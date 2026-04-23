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

// ─── Helper: parse error from response ──────────────────────────────────────
const parseError = async (res) => {
   try {
      const data = await res.json();
      return new Error(data.message || `HTTP ${res.status}`);
   } catch {
      return new Error(`HTTP ${res.status}`);
   }
};

// =====================================================
// COMMENT API
// =====================================================

/**
 * POST /api/comments
 * Create a new comment on a performance.
 * @param {{ performanceId: string, text: string }} payload
 * @returns {Promise<Comment>}
 */
export const createComment = async ({ performanceId, text }) => {
   const res = await fetch(`${API_URL}/api/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ performanceId, text }),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * GET /api/comments/:performanceId
 * Fetch all comments for a performance (sorted: pinned first, then newest).
 * @param {string} performanceId
 * @returns {Promise<Comment[]>}
 */
export const getComments = async (performanceId) => {
   const res = await fetch(`${API_URL}/api/comments/${performanceId}`);
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * DELETE /api/comments/:id
 * Soft-delete a comment (owner or admin only).
 * @param {string} commentId
 */
export const deleteComment = async (commentId) => {
   const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * PATCH /api/comments/:id/like
 * Increment the like count on a comment.
 * @param {string} commentId
 */
export const likeComment = async (commentId) => {
   const res = await fetch(`${API_URL}/api/comments/${commentId}/like`, {
      method: "PATCH",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * PATCH /api/comments/:id/pin  (performer / admin only)
 * @param {string} commentId
 */
export const pinComment = async (commentId) => {
   const res = await fetch(`${API_URL}/api/comments/${commentId}/pin`, {
      method: "PATCH",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};

/**
 * PATCH /api/comments/:id/unpin  (performer / admin only)
 * @param {string} commentId
 */
export const unpinComment = async (commentId) => {
   const res = await fetch(`${API_URL}/api/comments/${commentId}/unpin`, {
      method: "PATCH",
      headers: getAuthHeaders(),
   });
   if (!res.ok) throw await parseError(res);
   return res.json();
};
