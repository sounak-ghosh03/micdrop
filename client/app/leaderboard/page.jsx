"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { getRankMedal, getRankStyle, formatCount } from "../../utils/helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const PERIODS = [
   { key: "DAILY", label: "Daily" },
   { key: "WEEKLY", label: "Weekly" },
   { key: "ALL_TIME", label: "All Time" },
];

/**
 * Leaderboard — ranked performer board pulled from the Leaderboard model.
 * Supports DAILY / WEEKLY / ALL_TIME period switching.
 */
export default function LeaderboardPage() {
   const [period, setPeriod] = useState("ALL_TIME");
   const [entries, setEntries] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      setLoading(true);
      setError("");

      // The backend doesn't have a dedicated leaderboard route exposed yet,
      // so we derive the leaderboard from the performances feed.
      // When the Leaderboard model route is added, swap this fetch.
      fetch(`${API_URL}/api/performances`)
         .then((r) => r.json())
         .then((perfs) => {
            // Aggregate stats per creator from performances
            const map = {};
            perfs.forEach((p) => {
               const id = p.creator?._id ?? p.creator;
               if (!id) return;
               if (!map[id]) {
                  map[id] = {
                     creator: p.creator,
                     score: 0,
                     breakdown: {
                        totalViews: 0,
                        totalReactions: 0,
                        applauseCount: 0,
                        performancesCount: 0,
                     },
                  };
               }
               const entry = map[id];
               entry.breakdown.totalViews += p.stats?.viewers ?? 0;
               entry.breakdown.totalReactions += p.stats?.totalReactions ?? 0;
               entry.breakdown.applauseCount += p.stats?.applauseCount ?? 0;
               entry.breakdown.performancesCount += 1;
               // Score formula: viewers*1 + reactions*2 + applause*3
               entry.score +=
                  (p.stats?.viewers ?? 0) * 1 +
                  (p.stats?.totalReactions ?? 0) * 2 +
                  (p.stats?.applauseCount ?? 0) * 3;
            });

            const ranked = Object.values(map)
               .sort((a, b) => b.score - a.score)
               .map((e, i) => ({ ...e, rank: i + 1 }));

            setEntries(ranked);
         })
         .catch(() => setError("Failed to load leaderboard."))
         .finally(() => setLoading(false));
   }, [period]);

   const getInitials = (name) => {
      if (!name) return "?";
      return name
         .split(" ")
         .map((n) => n[0])
         .join("")
         .toUpperCase()
         .slice(0, 2);
   };

   const creatorName = (c) => c?.username || c?.name || "Unknown";

   return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}>
         <Navbar />

         <main
            style={{
               maxWidth: 760,
               margin: "0 auto",
               padding: "32px 20px 60px",
            }}
         >
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
               <h1
                  style={{
                     margin: "0 0 8px",
                     fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                     fontWeight: 900,
                     letterSpacing: "-0.03em",
                     background:
                        "linear-gradient(135deg, #f59e0b 0%, #fbbf24 40%, #f1f5f9 100%)",
                     WebkitBackgroundClip: "text",
                     WebkitTextFillColor: "transparent",
                     backgroundClip: "text",
                  }}
               >
                  🏆 Leaderboard
               </h1>
               <p
                  style={{
                     margin: 0,
                     color: "var(--color-text-secondary)",
                     fontSize: "0.95rem",
                  }}
               >
                  Top performers ranked by audience engagement
               </p>
            </div>

            {/* ── Period tabs ──────────────────────────────────────────────────── */}
            <div
               style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 28,
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  padding: 5,
               }}
            >
               {PERIODS.map((p) => (
                  <button
                     key={p.key}
                     onClick={() => setPeriod(p.key)}
                     style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        border: "none",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background:
                           period === p.key
                              ? "var(--color-primary)"
                              : "transparent",
                        color:
                           period === p.key
                              ? "#fff"
                              : "var(--color-text-muted)",
                        boxShadow:
                           period === p.key ? "var(--shadow-primary)" : "none",
                     }}
                  >
                     {p.label}
                  </button>
               ))}
            </div>

            {/* ── Top-3 podium ─────────────────────────────────────────────────── */}
            {!loading && entries.length >= 3 && (
               <div
                  style={{
                     display: "flex",
                     alignItems: "flex-end",
                     justifyContent: "center",
                     gap: 12,
                     marginBottom: 32,
                     padding: "0 8px",
                  }}
               >
                  {[entries[1], entries[0], entries[2]].map(
                     (entry, podiumIdx) => {
                        const podiumHeights = [120, 160, 100];
                        const isFirst = entry?.rank === 1;
                        return (
                           <div
                              key={entry?.rank}
                              style={{
                                 flex: 1,
                                 display: "flex",
                                 flexDirection: "column",
                                 alignItems: "center",
                                 gap: 8,
                              }}
                           >
                              {/* Avatar */}
                              <div
                                 style={{
                                    width: isFirst ? 64 : 52,
                                    height: isFirst ? 64 : 52,
                                    borderRadius: "50%",
                                    background: isFirst
                                       ? "linear-gradient(135deg, var(--color-gold), #fbbf24)"
                                       : "var(--color-primary)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: isFirst ? "1.1rem" : "0.9rem",
                                    fontWeight: 800,
                                    color: "#fff",
                                    border: `3px solid ${isFirst ? "var(--color-gold)" : entry?.rank === 2 ? "var(--color-silver)" : "var(--color-bronze)"}`,
                                    boxShadow: isFirst
                                       ? "0 0 24px rgba(245,158,11,0.5)"
                                       : "none",
                                    overflow: "hidden",
                                 }}
                              >
                                 {entry?.creator?.avatar ? (
                                    <img
                                       src={entry.creator.avatar}
                                       alt=""
                                       style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                       }}
                                    />
                                 ) : (
                                    getInitials(creatorName(entry?.creator))
                                 )}
                              </div>

                              <p
                                 style={{
                                    margin: 0,
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    color: "var(--color-text-primary)",
                                    textAlign: "center",
                                 }}
                              >
                                 {getRankMedal(entry?.rank)}{" "}
                                 {creatorName(entry?.creator)}
                              </p>

                              {/* Podium block */}
                              <div
                                 style={{
                                    width: "100%",
                                    height: podiumHeights[podiumIdx],
                                    background: isFirst
                                       ? "linear-gradient(180deg, rgba(245,158,11,0.3), rgba(245,158,11,0.08))"
                                       : "var(--color-bg-elevated)",
                                    border: `1px solid ${isFirst ? "rgba(245,158,11,0.4)" : "var(--color-border)"}`,
                                    borderRadius: "10px 10px 0 0",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 2,
                                 }}
                              >
                                 <span
                                    style={{
                                       fontSize: "1.1rem",
                                       fontWeight: 800,
                                       color: isFirst
                                          ? "var(--color-gold)"
                                          : "var(--color-text-primary)",
                                    }}
                                 >
                                    {formatCount(entry?.score ?? 0)}
                                 </span>
                                 <span
                                    style={{
                                       fontSize: "0.65rem",
                                       color: "var(--color-text-muted)",
                                       textTransform: "uppercase",
                                       letterSpacing: "0.06em",
                                    }}
                                 >
                                    score
                                 </span>
                              </div>
                           </div>
                        );
                     },
                  )}
               </div>
            )}

            {/* ── Full ranked list ─────────────────────────────────────────────── */}
            {loading && (
               <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
               >
                  {[1, 2, 3, 4, 5].map((i) => (
                     <div
                        key={i}
                        className="skeleton"
                        style={{ height: 72, borderRadius: 12 }}
                     />
                  ))}
               </div>
            )}

            {!loading && error && (
               <div
                  style={{
                     padding: 20,
                     background: "rgba(239,68,68,0.08)",
                     border: "1px solid rgba(239,68,68,0.2)",
                     borderRadius: 12,
                     color: "var(--color-error)",
                     textAlign: "center",
                  }}
               >
                  ⚠️ {error}
               </div>
            )}

            {!loading && !error && entries.length === 0 && (
               <div style={{ textAlign: "center", padding: 48 }}>
                  <p style={{ fontSize: "2.5rem" }}>🎤</p>
                  <p style={{ color: "var(--color-text-muted)" }}>
                     No entries yet. Performances coming soon!
                  </p>
               </div>
            )}

            {!loading && entries.length > 0 && (
               <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
               >
                  {entries.map((entry) => (
                     <div
                        key={entry.rank}
                        className="card animate-fade-in"
                        style={{
                           padding: "14px 20px",
                           display: "flex",
                           alignItems: "center",
                           gap: 16,
                           borderColor:
                              entry.rank <= 3
                                 ? "rgba(245,158,11,0.2)"
                                 : "var(--color-border)",
                           background:
                              entry.rank === 1
                                 ? "linear-gradient(135deg, rgba(245,158,11,0.06), var(--color-bg-card))"
                                 : "var(--color-bg-card)",
                           transition: "transform 0.15s, border-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                           e.currentTarget.style.transform = "translateX(4px)";
                           e.currentTarget.style.borderColor =
                              "var(--color-primary)";
                        }}
                        onMouseLeave={(e) => {
                           e.currentTarget.style.transform = "translateX(0)";
                           e.currentTarget.style.borderColor =
                              entry.rank <= 3
                                 ? "rgba(245,158,11,0.2)"
                                 : "var(--color-border)";
                        }}
                     >
                        {/* Rank */}
                        <div
                           style={{
                              width: 36,
                              textAlign: "center",
                              fontSize: entry.rank <= 3 ? "1.4rem" : "0.95rem",
                              fontWeight: 800,
                              ...getRankStyle(entry.rank),
                              flexShrink: 0,
                           }}
                        >
                           {getRankMedal(entry.rank)}
                        </div>

                        {/* Avatar */}
                        <div
                           style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: "var(--color-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                              overflow: "hidden",
                           }}
                        >
                           {entry.creator?.avatar ? (
                              <img
                                 src={entry.creator.avatar}
                                 alt=""
                                 style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                 }}
                              />
                           ) : (
                              getInitials(creatorName(entry.creator))
                           )}
                        </div>

                        {/* Name + breakdown */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                           <p
                              style={{
                                 margin: 0,
                                 fontWeight: 700,
                                 fontSize: "0.95rem",
                                 color: "var(--color-text-primary)",
                                 overflow: "hidden",
                                 textOverflow: "ellipsis",
                                 whiteSpace: "nowrap",
                              }}
                           >
                              {creatorName(entry.creator)}
                           </p>
                           <div
                              style={{ display: "flex", gap: 12, marginTop: 3 }}
                           >
                              <Stat
                                 label="Shows"
                                 value={entry.breakdown.performancesCount}
                              />
                              <Stat
                                 label="Views"
                                 value={formatCount(entry.breakdown.totalViews)}
                              />
                              <Stat
                                 label="👏"
                                 value={formatCount(
                                    entry.breakdown.applauseCount,
                                 )}
                              />
                           </div>
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                           <p
                              style={{
                                 margin: 0,
                                 fontWeight: 800,
                                 fontSize: "1.05rem",
                                 color:
                                    entry.rank <= 3
                                       ? "var(--color-gold)"
                                       : "var(--color-text-primary)",
                              }}
                           >
                              {formatCount(entry.score)}
                           </p>
                           <p
                              style={{
                                 margin: 0,
                                 fontSize: "0.65rem",
                                 color: "var(--color-text-muted)",
                                 textTransform: "uppercase",
                                 letterSpacing: "0.06em",
                              }}
                           >
                              pts
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </main>
      </div>
   );
}

function Stat({ label, value }) {
   return (
      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
         <span
            style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}
         >
            {value}
         </span>{" "}
         {label}
      </span>
   );
}
