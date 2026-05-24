"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthenticatedLayout from "../../../components/AuthenticatedLayout";
import Timer from "../../../components/Timer";
import CommentBox from "../../../components/CommentBox";
import ReactionButtons from "../../../components/ReactionButtons";
import { useAuth } from "../../../context/AuthContext";
import {
   getPerformanceById,
   startPerformance,
   endPerformance,
   getReactionSummary,
} from "../../../services/performanceApi";
import { pinComment, unpinComment } from "../../../services/commentApi";
import useSocket from "../../../hooks/useSocket";
import useWebRTC from "../../../hooks/useWebRTC";
import {
   getStatusConfig,
   getInitials,
   formatCount,
} from "../../../utils/helpers";

/**
 * LiveRoom — the full performance experience.
 * Handles real-time comments, reactions, pin/unpin, and performer controls.
 */
export default function LiveRoomPage() {
   const { id } = useParams();
   const router = useRouter();
   const { user, token } = useAuth();

   const [performance, setPerformance] = useState(null);
   const [reactionSummary, setReactionSummary] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [actionLoading, setActionLoading] = useState(false);

   // Real-time state: passed as props to CommentBox
   const [socketCommentNew, setSocketCommentNew] = useState(null);
   const [socketCommentDeleted, setSocketCommentDeleted] = useState(null);
   const [socketCommentLiked, setSocketCommentLiked] = useState(null);
   const [socketCommentPinned, setSocketCommentPinned] = useState(null);
   const [socketCommentUnpinned, setSocketCommentUnpinned] = useState(null);

   const isOwner = user && performance && user._id === performance.creator?._id;
   const canPin = isOwner || user?.role === "admin";
   const statusCfg = getStatusConfig(performance?.status ?? "ENDED");
   const isLive = performance?.status === "LIVE";
   const webrtcRole = isOwner ? "broadcaster" : "viewer";

   // Fetch performance + reactions
   useEffect(() => {
      if (!id) return;
      setLoading(true);

      Promise.all([getPerformanceById(id), getReactionSummary(id)])
         .then(([perf, reactions]) => {
            if (!perf) {
               setError("Performance not found.");
               return;
            }
            setPerformance(perf);
            setReactionSummary(reactions);
         })
         .catch(() => setError("Failed to load performance."))
         .finally(() => setLoading(false));
   }, [id]);

   // Socket event handlers
   const handlePerformanceLive = useCallback(
      (p) => {
         if (p._id === id) setPerformance(p);
      },
      [id],
   );
   const handlePerformanceEnded = useCallback(
      (p) => {
         if (p._id === id) setPerformance(p);
      },
      [id],
   );
   const handleReactionNew = useCallback(
      (data) => {
         if (data.performanceId !== id) return;
         setReactionSummary((prev) => {
            const existing = prev.find((r) => r._id === data.type);
            if (existing)
               return prev.map((r) =>
                  r._id === data.type
                     ? { ...r, count: r.count + data.value }
                     : r,
               );
            return [...prev, { _id: data.type, count: data.value }];
         });
      },
      [id],
   );

   const socket = useSocket({
      token,
      performanceId: id,
      onCommentNew: (c) => setSocketCommentNew(c),
      onCommentDeleted: (d) => setSocketCommentDeleted(d),
      onCommentLiked: (d) => setSocketCommentLiked(d),
      onCommentPinned: (d) => setSocketCommentPinned(d),
      onCommentUnpinned: (d) => setSocketCommentUnpinned(d),
      onReactionNew: handleReactionNew,
      onPerformanceLive: handlePerformanceLive,
      onPerformanceEnded: handlePerformanceEnded,
   });

   // WebRTC (media stream)
   // Socket.IO is the signaling channel; WebRTC carries the actual audio/video.
   const { localStream, remoteStream, mediaError } = useWebRTC({
      role: webrtcRole,
      performanceId: id,
      socket,
      isLive,
   });

   // Attach MediaStream objects to <video> elements via refs
   const localVideoRef = useRef(null);
   const remoteVideoRef = useRef(null);

   useEffect(() => {
      if (localVideoRef.current && localStream) {
         localVideoRef.current.srcObject = localStream;
      }
   }, [localStream]);

   useEffect(() => {
      if (remoteVideoRef.current && remoteStream) {
         remoteVideoRef.current.srcObject = remoteStream;
      }
   }, [remoteStream]);

   // Performer controls
   const handleStart = async () => {
      setActionLoading(true);
      try {
         const updated = await startPerformance(id);
         setPerformance(updated);
      } catch (err) {
         alert(err.message);
      } finally {
         setActionLoading(false);
      }
   };

   const handleEnd = async () => {
      if (!confirm("Are you sure you want to end this performance?")) return;
      setActionLoading(true);
      try {
         const updated = await endPerformance(id);
         setPerformance(updated);
      } catch (err) {
         alert(err.message);
      } finally {
         setActionLoading(false);
      }
   };

   const handlePin = useCallback(async (commentId) => {
      try {
         await pinComment(commentId);
      } catch {}
   }, []);
   const handleUnpin = useCallback(async (commentId) => {
      try {
         await unpinComment(commentId);
      } catch {}
   }, []);

   // Loading / Error states
   if (loading)
      return (
         <AuthenticatedLayout>
            <div
               style={{
                  maxWidth: 1100,
                  margin: "0 auto",
                  padding: "32px 20px",
               }}
            >
               <div
                  className="skeleton"
                  style={{ height: 200, borderRadius: 16, marginBottom: 20 }}
               />
               <div
                  style={{
                     display: "grid",
                     gridTemplateColumns: "1fr 360px",
                     gap: 20,
                  }}
               >
                  <div
                     className="skeleton"
                     style={{ height: 400, borderRadius: 16 }}
                  />
                  <div
                     className="skeleton"
                     style={{ height: 400, borderRadius: 16 }}
                  />
               </div>
            </div>
         </AuthenticatedLayout>
      );

   if (error || !performance)
      return (
         <AuthenticatedLayout>
            <div
               style={{
                  maxWidth: 600,
                  margin: "80px auto",
                  padding: "0 20px",
                  textAlign: "center",
               }}
            >
               <p style={{ fontSize: "3rem" }}>🎤</p>
               <h2
                  style={{
                     color: "var(--color-text-primary)",
                     margin: "12px 0 8px",
                  }}
               >
                  {error || "Performance not found"}
               </h2>
               <button
                  className="btn-primary"
                  onClick={() => router.push("/home")}
                  style={{ marginTop: 16 }}
               >
                  Back to Home
               </button>
            </div>
         </AuthenticatedLayout>
      );

   const creatorName =
      performance.creator?.username || performance.creator?.name || "Unknown";
   const totalReactions = reactionSummary.reduce((s, r) => s + r.count, 0);

   return (
      <AuthenticatedLayout>
         <main
            style={{
               maxWidth: 1100,
               margin: "0 auto",
               padding: "28px 20px 60px",
            }}
         >
            {/* Performance header */}
            <div
               className="card"
               style={{
                  marginBottom: 24,
                  padding: "24px 28px",
                  background:
                     performance.status === "LIVE"
                        ? "linear-gradient(135deg, #0f0f1a, #1a0a2e)"
                        : "var(--color-bg-card)",
                  borderColor:
                     performance.status === "LIVE"
                        ? "rgba(124,58,237,0.4)"
                        : "var(--color-border)",
                  boxShadow:
                     performance.status === "LIVE"
                        ? "var(--shadow-primary)"
                        : "var(--shadow-card)",
               }}
            >
               <div
                  style={{
                     display: "flex",
                     alignItems: "flex-start",
                     justifyContent: "space-between",
                     flexWrap: "wrap",
                     gap: 16,
                  }}
               >
                  {/* Left info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                     <div
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: 10,
                           marginBottom: 10,
                           flexWrap: "wrap",
                        }}
                     >
                        <span className={statusCfg.className}>
                           {statusCfg.label}
                        </span>
                        <Timer
                           startedAt={performance.startedAt}
                           status={performance.status}
                        />
                     </div>

                     <h1
                        style={{
                           margin: "0 0 8px",
                           fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
                           fontWeight: 800,
                           lineHeight: 1.25,
                           color: "var(--color-text-primary)",
                        }}
                     >
                        {performance.title}
                     </h1>

                     {performance.description && (
                        <p
                           style={{
                              margin: "0 0 12px",
                              color: "var(--color-text-secondary)",
                              fontSize: "0.9rem",
                              lineHeight: 1.6,
                           }}
                        >
                           {performance.description}
                        </p>
                     )}

                     {/* Creator */}
                     <div
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: 8,
                        }}
                     >
                        <div
                           style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background: "var(--color-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: "#fff",
                              overflow: "hidden",
                           }}
                        >
                           {performance.creator?.avatar ? (
                              <img
                                 src={performance.creator.avatar}
                                 alt=""
                                 style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                 }}
                              />
                           ) : (
                              getInitials(creatorName)
                           )}
                        </div>
                        <span
                           style={{
                              fontSize: "0.85rem",
                              color: "var(--color-text-secondary)",
                           }}
                        >
                           by{" "}
                           <span
                              style={{
                                 color: "var(--color-primary-light)",
                                 fontWeight: 600,
                              }}
                           >
                              {creatorName}
                           </span>
                        </span>
                     </div>
                  </div>

                  {/* Right: stats + performer controls */}
                  <div
                     style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 12,
                     }}
                  >
                     {/* Stats */}
                     <div style={{ display: "flex", gap: 16 }}>
                        {[
                           {
                              icon: "👁",
                              label: "Viewers",
                              val: formatCount(performance.stats?.viewers ?? 0),
                           },
                           {
                              icon: "⚡",
                              label: "Reactions",
                              val: formatCount(totalReactions),
                           },
                           {
                              icon: "💬",
                              label: "Comments",
                              val: formatCount(
                                 performance.stats?.commentCount ?? 0,
                              ),
                           },
                        ].map((s) => (
                           <div key={s.label} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "1.1rem" }}>{s.icon}</div>
                              <div
                                 style={{
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    color: "var(--color-text-primary)",
                                 }}
                              >
                                 {s.val}
                              </div>
                              <div
                                 style={{
                                    fontSize: "0.65rem",
                                    color: "var(--color-text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                 }}
                              >
                                 {s.label}
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Performer controls */}
                     {isOwner && (
                        <div style={{ display: "flex", gap: 8 }}>
                           {performance.status !== "LIVE" &&
                              performance.status !== "ENDED" && (
                                 <button
                                    className="btn-primary"
                                    onClick={handleStart}
                                    disabled={actionLoading}
                                    style={{ background: "var(--color-live)" }}
                                 >
                                    {actionLoading ? "Starting…" : "🔴 Go Live"}
                                 </button>
                              )}
                           {performance.status === "LIVE" && (
                              <button
                                 className="btn-ghost"
                                 onClick={handleEnd}
                                 disabled={actionLoading}
                                 style={{
                                    borderColor: "var(--color-live)",
                                    color: "var(--color-live)",
                                 }}
                              >
                                 {actionLoading
                                    ? "Ending…"
                                    : "⏹ End Performance"}
                              </button>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Two-column: Stream area + Chat */}
            <div
               style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 360px",
                  gap: 20,
                  alignItems: "start",
               }}
            >
               {/* Left: video placeholder + reactions */}
               <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
               >
                  {/* Stream / video area */}
                  <div
                     style={{
                        aspectRatio: "16/9",
                        background: "#000",
                        border: "1px solid var(--color-border)",
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 12,
                        overflow: "hidden",
                        position: "relative",
                     }}
                  >
                     {/* Broadcaster self-view */}
                     {isOwner && isLive && (
                        <video
                           ref={localVideoRef}
                           autoPlay
                           muted
                           playsInline
                           style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: localStream ? "block" : "none",
                           }}
                        />
                     )}

                     {/* Viewer remote stream */}
                     {!isOwner && isLive && (
                        <video
                           ref={remoteVideoRef}
                           autoPlay
                           playsInline
                           style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: remoteStream ? "block" : "none",
                           }}
                        />
                     )}

                     {/* Overlay states */}
                     {isLive && !isOwner && !remoteStream && (
                        <>
                           <div
                              style={{
                                 position: "absolute",
                                 inset: 0,
                                 background:
                                    "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 70%)",
                                 animation: "pulse 3s ease-in-out infinite",
                              }}
                           />
                           <span
                              style={{
                                 fontSize: "3rem",
                                 position: "relative",
                                 zIndex: 1,
                              }}
                           >
                              🎤
                           </span>
                           <p
                              style={{
                                 margin: 0,
                                 fontWeight: 700,
                                 fontSize: "1rem",
                                 color: "var(--color-text-primary)",
                                 position: "relative",
                                 zIndex: 1,
                              }}
                           >
                              Connecting to stream…
                           </p>
                        </>
                     )}

                     {isLive && isOwner && !localStream && !mediaError && (
                        <>
                           <div
                              style={{
                                 position: "absolute",
                                 inset: 0,
                                 background:
                                    "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, transparent 70%)",
                                 animation: "pulse 3s ease-in-out infinite",
                              }}
                           />
                           <span
                              style={{
                                 fontSize: "2rem",
                                 position: "relative",
                                 zIndex: 1,
                              }}
                           >
                              📷
                           </span>
                           <p
                              style={{
                                 margin: 0,
                                 fontSize: "0.85rem",
                                 color: "var(--color-text-muted)",
                                 position: "relative",
                                 zIndex: 1,
                              }}
                           >
                              Requesting camera access…
                           </p>
                        </>
                     )}

                     {mediaError && (
                        <>
                           <span style={{ fontSize: "2rem" }}>⚠️</span>
                           <p
                              style={{
                                 margin: "0 16px",
                                 fontSize: "0.85rem",
                                 color: "#f87171",
                                 textAlign: "center",
                              }}
                           >
                              {mediaError}
                           </p>
                        </>
                     )}

                     {performance.status === "ENDED" && (
                        <>
                           <span style={{ fontSize: "2.5rem" }}>⏹</span>
                           <p
                              style={{
                                 margin: 0,
                                 color: "var(--color-text-muted)",
                                 fontSize: "0.9rem",
                              }}
                           >
                              This performance has ended.
                           </p>
                        </>
                     )}

                     {performance.status !== "LIVE" &&
                        performance.status !== "ENDED" && (
                           <>
                              <span style={{ fontSize: "2.5rem" }}>🕐</span>
                              <p
                                 style={{
                                    margin: 0,
                                    color: "var(--color-text-muted)",
                                    fontSize: "0.9rem",
                                 }}
                              >
                                 Performance hasn&apos;t started yet.
                              </p>
                           </>
                        )}
                  </div>

                  {/* Reaction bar */}
                  <ReactionButtons
                     performanceId={id}
                     summary={reactionSummary}
                  />
               </div>

               {/* Right: live chat */}
               <div style={{ height: "min(620px, 70vh)" }}>
                  <CommentBox
                     performanceId={id}
                     canPin={canPin}
                     onPin={handlePin}
                     onUnpin={handleUnpin}
                     socketCommentNew={socketCommentNew}
                     socketCommentDeleted={socketCommentDeleted}
                     socketCommentLiked={socketCommentLiked}
                     socketCommentPinned={socketCommentPinned}
                     socketCommentUnpinned={socketCommentUnpinned}
                  />
               </div>
            </div>
         </main>
      </AuthenticatedLayout>
   );
}
