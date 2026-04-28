import { Performance } from "../models/Performance.model.js";

/*
  In-memory viewer registry
  Structure: Map<performanceId, Set<userId>>
  Keyed on performanceId (string), value is a Set of userId strings.

  This gives O(1) join/leave and accurate unique-viewer counts.
  For horizontal scaling, replace with a Redis SET per performanceId.
*/
const viewerRegistry = new Map();

/* ── helpers ─────────────────────────────────────────────────── */

/**
 * Return (or lazily create) the viewer Set for a given room.
 */
const getRoom = (performanceId) => {
   if (!viewerRegistry.has(performanceId)) {
      viewerRegistry.set(performanceId, new Set());
   }
   return viewerRegistry.get(performanceId);
};

/**
 * Flush the in-memory viewer count to MongoDB.
 * Fire-and-forget — we don't await this on hot paths.
 */
const flushViewerCount = (performanceId, count) => {
   Performance.findByIdAndUpdate(performanceId, {
      $set: { "stats.viewers": count },
   }).catch((err) =>
      console.error(`[liveRoom] flushViewerCount error for ${performanceId}:`, err)
   );
};

/* ── public API ──────────────────────────────────────────────── */

/**
 * Register a user entering a live performance room.
 * @param {string} performanceId
 * @param {string} userId
 * @returns {number} updated viewer count
 */
export const joinRoom = (performanceId, userId) => {
   const room = getRoom(performanceId);
   room.add(userId);
   const count = room.size;
   flushViewerCount(performanceId, count);
   return count;
};

/**
 * Deregister a user leaving a live performance room.
 * @param {string} performanceId
 * @param {string} userId
 * @returns {number} updated viewer count
 */
export const leaveRoom = (performanceId, userId) => {
   const room = getRoom(performanceId);
   room.delete(userId);
   const count = room.size;

   // Clean up empty rooms to avoid memory leaks
   if (count === 0) {
      viewerRegistry.delete(performanceId);
   }

   flushViewerCount(performanceId, count);
   return count;
};

/**
 * Remove a user from every room they are currently in.
 * Called when a socket disconnects without an explicit leave.
 * @param {string} userId
 * @returns {Map<string, number>} performanceId → new viewer count for each affected room
 */
export const removeUserFromAllRooms = (userId) => {
   const affected = new Map();

   for (const [performanceId, viewers] of viewerRegistry.entries()) {
      if (viewers.has(userId)) {
         viewers.delete(userId);
         const count = viewers.size;

         if (count === 0) {
            viewerRegistry.delete(performanceId);
         }

         flushViewerCount(performanceId, count);
         affected.set(performanceId, count);
      }
   }

   return affected;
};

/**
 * Return the current live viewer count for a performance.
 * @param {string} performanceId
 * @returns {number}
 */
export const getViewerCount = (performanceId) => {
   return viewerRegistry.get(performanceId)?.size ?? 0;
};

/**
 * Return a snapshot of all active rooms.
 * Useful for admin dashboards / healthchecks.
 * @returns {Array<{ performanceId: string, viewers: number }>}
 */
export const getRoomSnapshot = () => {
   const snapshot = [];
   for (const [performanceId, viewers] of viewerRegistry.entries()) {
      snapshot.push({ performanceId, viewers: viewers.size });
   }
   return snapshot;
};
