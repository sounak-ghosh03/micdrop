"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { addReaction } from "../services/performanceApi";
import {
   REACTION_TYPES,
   REACTION_EMOJIS,
   REACTION_LABELS,
   formatCount,
} from "../utils/helpers";

/**
 * ReactionButtons — emoji reaction bar for a live performance.
 * Fires a floating animation on click and calls the backend.
 *
 * @param {{
 *   performanceId: string,
 *   summary: Array<{_id: string, count: number}>,
 *   onReactionSent?: (type: string) => void
 * }} props
 *   summary — initial reaction counts from GET /api/performances/:id/reactions
 */
export default function ReactionButtons({
   performanceId,
   summary = [],
   onReactionSent,
}) {
   const { isAuthenticated } = useAuth();

   // Build local count map from summary array → { LIKE: 0, APPLAUSE: 0, … }
   const buildCountMap = () =>
      REACTION_TYPES.reduce((acc, type) => {
         const found = summary.find((s) => s._id === type);
         acc[type] = found?.count ?? 0;
         return acc;
      }, {});

   const [counts, setCounts] = useState(buildCountMap);
   const [loading, setLoading] = useState({});
   const [floaters, setFloaters] = useState([]); // [{id, emoji, x}]
   const containerRef = useRef(null);

   // Update counts when summary prop changes (e.g. after initial fetch)
   // We skip this re-sync while the user is actively clicking to avoid jank.

   const spawnFloater = useCallback((type) => {
      const emoji = REACTION_EMOJIS[type];
      const id = Date.now() + Math.random();
      const x = 10 + Math.random() * 60; // % position within container
      setFloaters((prev) => [...prev, { id, emoji, x }]);
      setTimeout(
         () => setFloaters((prev) => prev.filter((f) => f.id !== id)),
         900,
      );
   }, []);

   const handleReact = useCallback(
      async (type) => {
         if (!isAuthenticated) return;
         if (loading[type]) return;

         // Optimistic update
         setCounts((prev) => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }));
         spawnFloater(type);
         setLoading((prev) => ({ ...prev, [type]: true }));

         try {
            await addReaction(performanceId, type);
            onReactionSent?.(type);
         } catch {
            // Roll back optimistic count on error
            setCounts((prev) => ({
               ...prev,
               [type]: Math.max(0, (prev[type] ?? 1) - 1),
            }));
         } finally {
            setLoading((prev) => ({ ...prev, [type]: false }));
         }
      },
      [isAuthenticated, loading, performanceId, spawnFloater, onReactionSent],
   );

   return (
      <div
         ref={containerRef}
         style={{
            position: "relative",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: 14,
            padding: "14px 16px",
         }}
      >
         {/* Floating emoji animations */}
         {floaters.map((f) => (
            <span
               key={f.id}
               className="animate-float-up"
               style={{
                  position: "absolute",
                  bottom: "100%",
                  left: `${f.x}%`,
                  fontSize: "1.6rem",
                  pointerEvents: "none",
                  zIndex: 10,
                  userSelect: "none",
               }}
            >
               {f.emoji}
            </span>
         ))}

         <p
            style={{
               fontSize: "0.7rem",
               fontWeight: 600,
               letterSpacing: "0.08em",
               textTransform: "uppercase",
               color: "var(--color-text-muted)",
               marginBottom: 10,
            }}
         >
            React to this performance
         </p>

         <div
            style={{
               display: "flex",
               flexWrap: "wrap",
               gap: 8,
            }}
         >
            {REACTION_TYPES.map((type) => (
               <button
                  key={type}
                  id={`reaction-${type.toLowerCase()}`}
                  onClick={() => handleReact(type)}
                  disabled={!isAuthenticated || loading[type]}
                  title={
                     !isAuthenticated ? "Login to react" : REACTION_LABELS[type]
                  }
                  style={{
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     gap: 3,
                     background: loading[type]
                        ? "rgba(124,58,237,0.15)"
                        : "var(--color-bg-card)",
                     border: "1px solid var(--color-border-subtle)",
                     borderRadius: 10,
                     padding: "8px 14px",
                     cursor: isAuthenticated ? "pointer" : "not-allowed",
                     transition:
                        "background 0.15s, transform 0.1s, border-color 0.15s",
                     opacity: isAuthenticated ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                     if (!isAuthenticated) return;
                     e.currentTarget.style.background = "rgba(124,58,237,0.12)";
                     e.currentTarget.style.borderColor = "var(--color-primary)";
                     e.currentTarget.style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.background = "var(--color-bg-card)";
                     e.currentTarget.style.borderColor =
                        "var(--color-border-subtle)";
                     e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseDown={(e) => {
                     e.currentTarget.style.transform = "scale(0.95)";
                  }}
                  onMouseUp={(e) => {
                     e.currentTarget.style.transform = "scale(1.08)";
                  }}
               >
                  <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>
                     {REACTION_EMOJIS[type]}
                  </span>
                  <span
                     style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                     }}
                  >
                     {formatCount(counts[type])}
                  </span>
               </button>
            ))}
         </div>

         {!isAuthenticated && (
            <p
               style={{
                  marginTop: 8,
                  fontSize: "0.72rem",
                  color: "var(--color-text-muted)",
               }}
            >
               <a
                  href="/login"
                  style={{
                     color: "var(--color-primary-light)",
                     textDecoration: "underline",
                  }}
               >
                  Log in
               </a>{" "}
               to react to this performance.
            </p>
         )}
      </div>
   );
}
