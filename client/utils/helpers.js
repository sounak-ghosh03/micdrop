// FORMATTING HELPERS
/**
 * Format elapsed seconds into HH:MM:SS or MM:SS
 * @param {number} seconds
 * @returns {string}
 */
export const formatDuration = (seconds) => {
   const h = Math.floor(seconds / 3600);
   const m = Math.floor((seconds % 3600) / 60);
   const s = seconds % 60;
   if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
   }
   return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Returns a relative time string (e.g. "5m ago")
 * @param {string|Date} date
 * @returns {string}
 */
export const timeAgo = (date) => {
   const diff = Date.now() - new Date(date).getTime();
   const s = Math.floor(diff / 1000);
   if (s < 60) return `${s}s ago`;
   const m = Math.floor(s / 60);
   if (m < 60) return `${m}m ago`;
   const h = Math.floor(m / 60);
   if (h < 24) return `${h}h ago`;
   return `${Math.floor(h / 24)}d ago`;
};

/**
 * Get 1-2 character initials from a name for avatar fallback
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
   if (!name) return "?";
   return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
};

/**
 * Format a large number with K/M suffixes
 * @param {number} n
 * @returns {string}
 */
export const formatCount = (n) => {
   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
   if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
   return String(n ?? 0);
};


// REACTION CONFIG
export const REACTION_TYPES = ["LIKE", "APPLAUSE", "LOVE", "LAUGH", "WOW"];

export const REACTION_EMOJIS = {
   LIKE: "👍",
   APPLAUSE: "👏",
   LOVE: "❤️",
   LAUGH: "😂",
   WOW: "😮",
};

export const REACTION_LABELS = {
   LIKE: "Like",
   APPLAUSE: "Applause",
   LOVE: "Love",
   LAUGH: "Haha",
   WOW: "Wow",
};


// STATUS CONFIG
/**
 * Returns badge class and label for a performance status
 * @param {"LIVE"|"SCHEDULED"|"ENDED"} status
 * @returns {{ label: string, className: string }}
 */
export const getStatusConfig = (status) => {
   switch (status) {
      case "LIVE":
         return { label: "LIVE", className: "badge badge-live" };
      case "SCHEDULED":
         return { label: "SCHEDULED", className: "badge badge-scheduled" };
      case "ENDED":
         return { label: "ENDED", className: "badge badge-ended" };
      default:
         return { label: status, className: "badge badge-ended" };
   }
};


// AUTH / LOCAL STORAGE
const isBrowser = typeof window !== "undefined";

export const getToken = () =>
   isBrowser ? localStorage.getItem("token") : null;
export const setToken = (token) =>
   isBrowser && localStorage.setItem("token", token);
export const removeToken = () => isBrowser && localStorage.removeItem("token");

export const getStoredUser = () => {
   if (!isBrowser) return null;
   try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
   } catch {
      return null;
   }
};

export const setStoredUser = (user) =>
   isBrowser && localStorage.setItem("user", JSON.stringify(user));

export const removeStoredUser = () =>
   isBrowser && localStorage.removeItem("user");


// LEADERBOARD RANK HELPERS
/**
 * Returns the medal emoji for top 3 ranks
 * @param {number} rank  (1-based)
 * @returns {string}
 */
export const getRankMedal = (rank) => {
   if (rank === 1) return "🥇";
   if (rank === 2) return "🥈";
   if (rank === 3) return "🥉";
   return `#${rank}`;
};

export const getRankStyle = (rank) => {
   if (rank === 1) return { color: "var(--color-gold)" };
   if (rank === 2) return { color: "var(--color-silver)" };
   if (rank === 3) return { color: "var(--color-bronze)" };
   return { color: "var(--color-text-muted)" };
};
