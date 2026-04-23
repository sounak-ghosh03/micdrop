const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Auth header helper ──────────────────────────────────────────────────────
const getAuthHeaders = () => {
   const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
   return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
   };
};

const parseError = async (res) => {
   try {
      const data = await res.json();
      return new Error(data.message || `HTTP ${res.status}`);
   } catch {
      return new Error(`HTTP ${res.status}`);
   }
};

// =====================================================
// PERFORMANCE API
// =====================================================

/**
 * GET /api/performances
 * Returns all LIVE and ENDED performances sorted newest first.
 * @returns {Promise<Performance[]>}
 */
export const getPerformances = async () => {
   const res = await fetch(`${API_URL}/api/performances`);
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * POST /api/performances  (performer / admin only)
 * @param {{ title: string, description?: string, type: "LIVE"|"RECORDED", streamUrl?: string }} data
 * @returns {Promise<Performance>}
 */
export const createPerformance = async (data) => {
   const res = await fetch(`${API_URL}/api/performances`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * PATCH /api/performances/:id/start  (performer / admin only)
 * @param {string} id
 * @returns {Promise<Performance>}
 */
export const startPerformance = async (id) => {
   const res = await fetch(`${API_URL}/api/performances/${id}/start`, {
      method: "PATCH",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * PATCH /api/performances/:id/end  (performer / admin only)
 * @param {string} id
 * @returns {Promise<Performance>}
 */
export const endPerformance = async (id) => {
   const res = await fetch(`${API_URL}/api/performances/${id}/end`, {
      method: "PATCH",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

// =====================================================
// REACTION API
// =====================================================

/**
 * POST /api/performances/:id/reactions  (auth required)
 * @param {string} performanceId
 * @param {"LIKE"|"APPLAUSE"|"LOVE"|"LAUGH"|"WOW"} type
 * @param {number} [value=1]
 * @returns {Promise<Reaction>}
 */
export const addReaction = async (performanceId, type, value = 1) => {
   const res = await fetch(
      `${API_URL}/api/performances/${performanceId}/reactions`,
      {
         method: "POST",
         headers: getAuthHeaders(),
         body: JSON.stringify({ type, value }),
      },
   );
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * GET /api/performances/:id/reactions
 * Returns an array of { _id: reactionType, count: number }
 * @param {string} performanceId
 * @returns {Promise<Array<{_id: string, count: number}>>}
 */
export const getReactionSummary = async (performanceId) => {
   const res = await fetch(
      `${API_URL}/api/performances/${performanceId}/reactions`,
   );
   if (!res.ok) throw await parseError(res);
   return res.json();
};

// =====================================================
// USER API
// =====================================================

/**
 * GET /api/users/:id
 * @param {string} userId
 * @returns {Promise<User>}
 */
export const getUserProfile = async (userId) => {
   const res = await fetch(`${API_URL}/api/users/${userId}`);
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * GET /api/users/search?q=
 * @param {string} query
 * @returns {Promise<User[]>}
 */
export const searchUsers = async (query) => {
   const res = await fetch(
      `${API_URL}/api/users/search?q=${encodeURIComponent(query)}`,
   );
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * POST /api/users/:id/follow  (auth required)
 * @param {string} userId
 */
export const followUser = async (userId) => {
   const res = await fetch(`${API_URL}/api/users/${userId}/follow`, {
      method: "POST",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * DELETE /api/users/:id/follow  (auth required)
 * @param {string} userId
 */
export const unfollowUser = async (userId) => {
   const res = await fetch(`${API_URL}/api/users/${userId}/follow`, {
      method: "DELETE",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};
