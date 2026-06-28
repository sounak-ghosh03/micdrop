import { Performance } from "../models/Performance.model.js";

/*
  In-memory viewer registry
  Structure: Map<performanceId, Set<userId>>
  Keyed on performanceId (string), value is a Set of userId strings.

  This gives O(1) join/leave and accurate unique-viewer counts.
  For horizontal scaling, replace with a Redis SET per performanceId.
*/
const viewerRegistry = new Map();

/*
  Broadcaster registry
  Structure: Map<performanceId, socketId>
  Tracks which socket is currently streaming for a given room.
  Only one broadcaster per room is supported at a time.
*/
const broadcasterRegistry = new Map();

//helpers
// Return (or lazily create) the viewer Set for a given room.
const getRoom = (performanceId) => {
   if (!viewerRegistry.has(performanceId)) {
      viewerRegistry.set(performanceId, new Set());
   }
   return viewerRegistry.get(performanceId);
};

// Flush the in-memory viewer count to MongoDB.
// Fire-and-forget — we don't await this on hot paths.
const flushViewerCount = (performanceId, count) => {
   Performance.findByIdAndUpdate(performanceId, {
      $set: { "stats.viewers": count },
   }).catch((err) =>
      console.error(
         `[liveRoom] flushViewerCount error for ${performanceId}:`,
         err,
      ),
   );
};

// publicAPI

// Register a user entering a live performance room.

export const joinRoom = (performanceId, userId) => {
   const room = getRoom(performanceId);
   room.add(userId);
   const count = room.size;
   flushViewerCount(performanceId, count);
   return count;
};

// Deregister a user leaving a live performance room.
// @param performanceId
// @param userId
// @returns updated viewer count
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

// Remove a user from every room they are currently in.
// Called when a socket disconnects without an explicit leave.
// @returns performanceId → new viewer count for each affected room
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

// Return the current live viewer count for a performance.

export const getViewerCount = (performanceId) => {
   return viewerRegistry.get(performanceId)?.size ?? 0;
};

// Return a snapshot of all active rooms.

export const getRoomSnapshot = () => {
   const snapshot = [];
   for (const [performanceId, viewers] of viewerRegistry.entries()) {
      snapshot.push({ performanceId, viewers: viewers.size });
   }
   return snapshot;
};

// Alias used by admin controller
export const getAllRooms = getRoomSnapshot;

//broadcaster registry API

// Register a socket as the broadcaster for a performance room.
// Replaces any previous broadcaster for that room.

export const registerBroadcaster = (performanceId, socketId) => {
   broadcasterRegistry.set(performanceId, socketId);
};

// Return the broadcaster socket ID for a room, or null if none.

export const getBroadcasterSocketId = (performanceId) => {
   return broadcasterRegistry.get(performanceId) ?? null;
};

// Remove broadcaster entries for every room owned by a given socket.
// Called on disconnect so stale entries don't block future broadcasts.

export const removeBroadcasterBySocketId = (socketId) => {
   const affected = [];
   for (const [performanceId, bSocketId] of broadcasterRegistry.entries()) {
      if (bSocketId === socketId) {
         broadcasterRegistry.delete(performanceId);
         affected.push(performanceId);
      }
   }
   return affected;
};
