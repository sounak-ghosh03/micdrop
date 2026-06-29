// backend/src/services/moderation.service.js

import { User } from "../models/User.model.js";

/*
  In-memory trackers for MVP
  Later replace with Redis / DB for scaling
*/
const commentTracker = new Map();
const reactionTracker = new Map();

/*
=====================================================
UTILITY FUNCTIONS
=====================================================
*/

// Clean dangerous HTML tags
const sanitizeText = (text) => {
  return text.replace(/<[^>]*>?/gm, "").trim();
};

// Canonical banned-words list — owned here so the comment filter and the
// admin update API both read/write the same array.
let _bannedWords = [
  "idiot",
  "trash",
  "stupid",
  "hate",
  "loser",
  "abuse",
  "bjp",
  "tmc",
  "bitch",
  "modi",
  "mamata",
  "allah",
];

// Used by admin.controller.js to read/update the live list
export const getBannedWordsList = () => _bannedWords;
export const setBannedWords = (words) => { _bannedWords = words; };

// Check profanity
const containsProfanity = (text) => {
  const lowerText = text.toLowerCase();

  return _bannedWords.some((word) => lowerText.includes(word));
};

// Get tracker helper
const getTracker = (map, key) => {
  if (!map.has(key)) {
    map.set(key, []);
  }

  return map.get(key);
};

/*
=====================================================
COMMENT MODERATION
=====================================================
*/

export const moderateComment = async (userId, text) => {
  const cleanedText = sanitizeText(text);

  // Empty comment check
  if (!cleanedText) {
    return {
      allowed: false,
      reason: "Comment cannot be empty",
    };
  }

  // Length check
  if (cleanedText.length > 500) {
    return {
      allowed: false,
      reason: "Comment too long",
    };
  }

  // Profanity check
  if (containsProfanity(cleanedText)) {
    await incrementWarning(userId);

    return {
      allowed: false,
      reason: "Abusive language detected",
    };
  }

  // Spam check (max 5 comments in 10 sec)
  const now = Date.now();
  const tracker = getTracker(commentTracker, userId);

  const recent = tracker.filter((time) => now - time < 10000);

  if (recent.length >= 5) {
    return {
      allowed: false,
      reason: "Too many comments. Slow down.",
    };
  }

  recent.push(now);
  commentTracker.set(userId, recent);

  return {
    allowed: true,
    sanitizedText: cleanedText,
  };
};

/*
=====================================================
REACTION MODERATION
=====================================================
*/

export const moderateReaction = (userId, type) => {
  const now = Date.now();
  const key = `${userId}-${type}`;

  const tracker = getTracker(reactionTracker, key);

  // Max 10 same reactions in 10 sec
  const recent = tracker.filter((time) => now - time < 10000);

  if (recent.length >= 10) {
    return {
      allowed: false,
      reason: "Too many reactions",
    };
  }

  // Extra protection for boo
  if (type === "boo" && recent.length >= 3) {
    return {
      allowed: false,
      reason: "Too many boos sent",
    };
  }

  recent.push(now);
  reactionTracker.set(key, recent);

  return {
    allowed: true,
  };
};

/*
=====================================================
USER WARNING SYSTEM
=====================================================
*/

export const incrementWarning = async (userId) => {
  const user = await User.findById(userId);

  if (!user) return;

  user.warningsCount += 1;

  // Auto-ban after 5 warnings
  if (user.warningsCount >= 5) {
    user.isBanned = true;
  }

  await user.save();
};

/*
=====================================================
MANUAL CHECK
=====================================================
*/

export const shouldMuteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) return false;

  return user.warningsCount >= 3;
};
