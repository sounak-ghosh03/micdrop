"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
   getComments,
   createComment,
   deleteComment,
   likeComment,
} from "../services/commentApi";
import { timeAgo, getInitials } from "../utils/helpers";

/**
 * CommentBox — live comment feed for a performance.
 * Accepts real-time socket events via props to stay in sync.
 *
 * @param {{
 *   performanceId: string,
 *   canPin: boolean,
 *   onPin: (commentId: string) => void,
 *   onUnpin: (commentId: string) => void,
 *   socketCommentNew: object|null,
 *   socketCommentDeleted: { commentId: string }|null,
 *   socketCommentLiked: { commentId: string, likes: number }|null,
 *   socketCommentPinned: { commentId: string }|null,
 *   socketCommentUnpinned: { commentId: string }|null,
 * }} props
 */
export default function CommentBox({
   performanceId,
   canPin = false,
   onPin,
   onUnpin,
   socketCommentNew = null,
   socketCommentDeleted = null,
   socketCommentLiked = null,
   socketCommentPinned = null,
   socketCommentUnpinned = null,
}) {
   const { user, isAuthenticated } = useAuth();
   const [comments, setComments] = useState([]);
   const [text, setText] = useState("");
   const [loading, setLoading] = useState(true);
   const [sending, setSending] = useState(false);
   const [error, setError] = useState("");
   const bottomRef = useRef(null);

   // Fetch initial comments
   useEffect(() => {
      if (!performanceId) return;
      setLoading(true);
      getComments(performanceId)
         .then(setComments)
         .catch(() => setError("Could not load comments."))
         .finally(() => setLoading(false));
   }, [performanceId]);

   // Auto-scroll to bottom on new comment
   useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [comments.length]);

   // Real-time: new comment
   useEffect(() => {
      if (!socketCommentNew) return;
      setComments((prev) => {
         if (prev.find((c) => c._id === socketCommentNew._id)) return prev;
         return [...prev, socketCommentNew];
      });
   }, [socketCommentNew]);

   // Real-time: deleted comment
   useEffect(() => {
      if (!socketCommentDeleted) return;
      setComments((prev) =>
         prev.filter((c) => c._id !== socketCommentDeleted.commentId),
      );
   }, [socketCommentDeleted]);

   // Real-time: liked comment
   useEffect(() => {
      if (!socketCommentLiked) return;
      setComments((prev) =>
         prev.map((c) =>
            c._id === socketCommentLiked.commentId
               ? { ...c, likes: socketCommentLiked.likes }
               : c,
         ),
      );
   }, [socketCommentLiked]);

   // Real-time: pinned/unpinned
   useEffect(() => {
      if (!socketCommentPinned) return;
      setComments((prev) =>
         prev.map((c) =>
            c._id === socketCommentPinned.commentId
               ? { ...c, pinned: true }
               : c,
         ),
      );
   }, [socketCommentPinned]);

   useEffect(() => {
      if (!socketCommentUnpinned) return;
      setComments((prev) =>
         prev.map((c) =>
            c._id === socketCommentUnpinned.commentId
               ? { ...c, pinned: false }
               : c,
         ),
      );
   }, [socketCommentUnpinned]);

   // Submit comment
   const handleSubmit = useCallback(
      async (e) => {
         e.preventDefault();
         if (!text.trim() || sending) return;
         setSending(true);
         setError("");
         try {
            await createComment({ performanceId, text: text.trim() });
            setText("");
         } catch (err) {
            setError(err.message || "Failed to post comment.");
         } finally {
            setSending(false);
         }
      },
      [text, performanceId, sending],
   );

   // Like comment
   const handleLike = useCallback(async (commentId) => {
      try {
         await likeComment(commentId);
      } catch {
         // Optimistic update already applied via socket; ignore error
      }
   }, []);

   // Delete comment
   const handleDelete = useCallback(async (commentId) => {
      try {
         await deleteComment(commentId);
         setComments((prev) => prev.filter((c) => c._id !== commentId));
      } catch {
         /* handled by socket */
      }
   }, []);

   return (
      <div
         style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--color-radius-lg, 16px)",
            overflow: "hidden",
         }}
      >
         {/* Header */}
         <div
            style={{
               padding: "12px 16px",
               borderBottom: "1px solid var(--color-border)",
               display: "flex",
               alignItems: "center",
               gap: 8,
            }}
         >
            <span style={{ fontSize: "1rem" }}>💬</span>
            <span
               style={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "var(--color-text-primary)",
               }}
            >
               Live Chat
            </span>
            <span
               style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
               }}
            >
               {comments.length} messages
            </span>
         </div>

         {/* Comment list */}
         <div
            style={{
               flex: 1,
               overflowY: "auto",
               padding: "12px 16px",
               display: "flex",
               flexDirection: "column",
               gap: 10,
            }}
         >
            {loading && (
               <>
                  {[1, 2, 3].map((i) => (
                     <div
                        key={i}
                        className="skeleton"
                        style={{ height: 56, borderRadius: 10 }}
                     />
                  ))}
               </>
            )}

            {!loading && comments.length === 0 && (
               <p
                  style={{
                     textAlign: "center",
                     color: "var(--color-text-muted)",
                     fontSize: "0.85rem",
                     marginTop: 32,
                  }}
               >
                  No comments yet. Be the first!
               </p>
            )}

            {comments.map((comment) => (
               <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUser={user}
                  canPin={canPin}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onPin={onPin}
                  onUnpin={onUnpin}
               />
            ))}
            <div ref={bottomRef} />
         </div>

         {/* Error */}
         {error && (
            <p
               style={{
                  padding: "6px 16px",
                  fontSize: "0.75rem",
                  color: "var(--color-error)",
                  background: "rgba(239,68,68,0.08)",
               }}
            >
               {error}
            </p>
         )}

         {/* Input */}
         <form
            onSubmit={handleSubmit}
            style={{
               padding: "12px 16px",
               borderTop: "1px solid var(--color-border)",
               display: "flex",
               gap: 8,
            }}
         >
            <input
               className="input-field"
               style={{ flex: 1 }}
               placeholder={
                  isAuthenticated ? "Say something…" : "Login to comment"
               }
               value={text}
               onChange={(e) => setText(e.target.value)}
               disabled={!isAuthenticated || sending}
               maxLength={500}
            />
            <button
               className="btn-primary"
               type="submit"
               disabled={!isAuthenticated || !text.trim() || sending}
               style={{ flexShrink: 0 }}
            >
               {sending ? "…" : "Send"}
            </button>
         </form>
      </div>
   );
}

// CommentItem

function CommentItem({
   comment,
   currentUser,
   canPin,
   onLike,
   onDelete,
   onPin,
   onUnpin,
}) {
   const isOwner = currentUser?._id === comment.user?._id;
   const isAdmin = currentUser?.role === "admin";

   return (
      <div
         className="animate-slide-up"
         style={{
            background: comment.pinned
               ? "rgba(124,58,237,0.08)"
               : "var(--color-bg-elevated)",
            border: `1px solid ${comment.pinned ? "rgba(124,58,237,0.3)" : "var(--color-border-subtle)"}`,
            borderRadius: 10,
            padding: "10px 12px",
            position: "relative",
         }}
      >
         {comment.pinned && (
            <span
               style={{
                  position: "absolute",
                  top: -8,
                  left: 10,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  background: "var(--color-primary)",
                  color: "#fff",
                  padding: "1px 8px",
                  borderRadius: 99,
               }}
            >
               📌 PINNED
            </span>
         )}

         <div
            style={{
               display: "flex",
               alignItems: "center",
               gap: 8,
               marginBottom: 4,
            }}
         >
            {/* Avatar */}
            <div
               style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
               }}
            >
               {comment.user?.avatar ? (
                  <img
                     src={comment.user.avatar}
                     alt=""
                     style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                     }}
                  />
               ) : (
                  getInitials(comment.user?.username)
               )}
            </div>

            <span
               style={{
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "var(--color-text-primary)",
               }}
            >
               {comment.user?.username ?? "Anonymous"}
            </span>
            <span
               style={{
                  marginLeft: "auto",
                  fontSize: "0.7rem",
                  color: "var(--color-text-muted)",
               }}
            >
               {timeAgo(comment.createdAt)}
            </span>
         </div>

         <p
            style={{
               fontSize: "0.85rem",
               color: "var(--color-text-primary)",
               lineHeight: 1.5,
               wordBreak: "break-word",
            }}
         >
            {comment.text}
         </p>

         {/* Actions row */}
         <div
            style={{
               display: "flex",
               alignItems: "center",
               gap: 12,
               marginTop: 6,
            }}
         >
            <button
               onClick={() => onLike(comment._id)}
               style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
               }}
            >
               ❤️ {comment.likes > 0 ? comment.likes : "Like"}
            </button>

            {canPin && (
               <button
                  onClick={() =>
                     comment.pinned
                        ? onUnpin?.(comment._id)
                        : onPin?.(comment._id)
                  }
                  style={{
                     background: "none",
                     border: "none",
                     cursor: "pointer",
                     fontSize: "0.75rem",
                     color: comment.pinned
                        ? "var(--color-primary-light)"
                        : "var(--color-text-muted)",
                     padding: 0,
                  }}
               >
                  {comment.pinned ? "📌 Unpin" : "📌 Pin"}
               </button>
            )}

            {(isOwner || isAdmin) && (
               <button
                  onClick={() => onDelete(comment._id)}
                  style={{
                     background: "none",
                     border: "none",
                     cursor: "pointer",
                     fontSize: "0.75rem",
                     color: "var(--color-text-muted)",
                     marginLeft: "auto",
                     padding: 0,
                  }}
               >
                  🗑 Delete
               </button>
            )}
         </div>
      </div>
   );
}
