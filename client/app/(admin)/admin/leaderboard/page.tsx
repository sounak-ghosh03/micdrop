"use client";

import { useEffect, useState } from "react";
import {
   refreshLeaderboard,
   resetLeaderboard,
} from "../../../../services/adminApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type LeaderboardEntry = {
   _id: string;
   creator: { username: string; avatar: string; isVerified: boolean };
   rank: number;
   score: number;
   totalPerformances: number;
   totalApplause: number;
   totalBoos: number;
   period: string;
};

export default function LeaderboardPage() {
   const [period, setPeriod] = useState<"DAILY" | "WEEKLY" | "ALL_TIME">(
      "ALL_TIME",
   );
   const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState("");

   const load = async () => {
      setLoading(true);
      try {
         const res = await fetch(`${API_URL}/api/leaderboard?period=${period}`);
         const d = await res.json();
         setEntries(d.leaderboard ?? d.entries ?? []);
      } catch {
         setEntries([]);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      load();
   }, [period]);

   const doRefresh = async () => {
      setActionLoading("refresh");
      try {
         await refreshLeaderboard();
         await load();
         alert("Leaderboard refreshed!");
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Failed");
      } finally {
         setActionLoading("");
      }
   };

   const doReset = async () => {
      if (!confirm("Reset the entire leaderboard? Cannot be undone.")) return;
      setActionLoading("reset");
      try {
         await resetLeaderboard();
         await load();
         alert("Leaderboard reset!");
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Failed");
      } finally {
         setActionLoading("");
      }
   };

   const MEDAL = ["🥇", "🥈", "🥉"];

   return (
      <div style={pg}>
         <div style={topBar}>
            {/* Period tabs */}
            <div style={tabs}>
               {(["DAILY", "WEEKLY", "ALL_TIME"] as const).map((p) => (
                  <button
                     key={p}
                     onClick={() => setPeriod(p)}
                     style={{ ...tab, ...(period === p ? tabActive : {}) }}
                  >
                     {p.replace("_", " ")}
                  </button>
               ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
               <button
                  onClick={doRefresh}
                  disabled={actionLoading === "refresh"}
                  style={refreshBtn}
               >
                  {actionLoading === "refresh" ? "Refreshing…" : "Refresh"}
               </button>
               <button
                  onClick={doReset}
                  disabled={actionLoading === "reset"}
                  style={resetBtn}
               >
                  {actionLoading === "reset" ? "Resetting…" : "Reset"}
               </button>
            </div>
         </div>

         <div style={tableWrap}>
            <table style={table}>
               <thead>
                  <tr>
                     {[
                        "Rank",
                        "Performer",
                        "Score",
                        "Performances",
                        "Applause",
                        "Boos",
                     ].map((h) => (
                        <th key={h} style={th}>
                           {h}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                     <tr>
                        <td colSpan={6} style={tdc}>
                           Loading…
                        </td>
                     </tr>
                  ) : entries.length === 0 ? (
                     <tr>
                        <td colSpan={6} style={tdc}>
                           No entries for this period
                        </td>
                     </tr>
                  ) : (
                     entries.map((e, i) => (
                        <tr
                           key={e._id}
                           style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                              background:
                                 i < 3
                                    ? `rgba(255,215,0,${0.04 - i * 0.01})`
                                    : "transparent",
                           }}
                        >
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 fontSize: "1.1rem",
                              }}
                           >
                              {MEDAL[i] ?? (
                                 <span
                                    style={{
                                       color: "rgba(255,255,255,0.4)",
                                       fontWeight: 700,
                                    }}
                                 >
                                    #{e.rank ?? i + 1}
                                 </span>
                              )}
                           </td>
                           <td style={td}>
                              <div
                                 style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                 }}
                              >
                                 <div style={avatarDot}>
                                    {e.creator?.username
                                       ?.charAt(0)
                                       .toUpperCase()}
                                 </div>
                                 <div>
                                    <div
                                       style={{
                                          fontWeight: 600,
                                          color: "#fff",
                                          fontSize: "0.875rem",
                                       }}
                                    >
                                       @{e.creator?.username}
                                       {e.creator?.isVerified && (
                                          <span
                                             style={{
                                                marginLeft: 4,
                                                fontSize: "0.7rem",
                                             }}
                                          >
                                             ✅
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td
                              style={{
                                 ...td,
                                 fontWeight: 800,
                                 fontSize: "1rem",
                                 color: "#f59e0b",
                              }}
                           >
                              {e.score?.toFixed?.(1) ?? e.score}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 color: "rgba(255,255,255,0.5)",
                              }}
                           >
                              {e.totalPerformances}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 color: "#22c55e",
                              }}
                           >
                              👏 {e.totalApplause}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 color: "#ef4444",
                              }}
                           >
                              👎 {e.totalBoos}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}

const pg: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "1rem",
};
const topBar: React.CSSProperties = {
   display: "flex",
   justifyContent: "space-between",
   alignItems: "center",
   gap: "1rem",
   flexWrap: "wrap",
};
const tabs: React.CSSProperties = {
   display: "flex",
   gap: "0.25rem",
   background: "rgba(255,255,255,0.05)",
   borderRadius: "0.6rem",
   padding: "0.2rem",
};
const tab: React.CSSProperties = {
   background: "transparent",
   border: "none",
   borderRadius: "0.4rem",
   color: "rgba(255,255,255,0.45)",
   padding: "0.4rem 0.9rem",
   fontSize: "0.8rem",
   fontWeight: 600,
   cursor: "pointer",
};
const tabActive: React.CSSProperties = { background: "#7c3aed", color: "#fff" };
const refreshBtn: React.CSSProperties = {
   background: "rgba(34,197,94,0.12)",
   border: "1px solid rgba(34,197,94,0.3)",
   borderRadius: "0.4rem",
   color: "#86efac",
   padding: "0.4rem 0.85rem",
   fontSize: "0.8rem",
   fontWeight: 600,
   cursor: "pointer",
};
const resetBtn: React.CSSProperties = {
   background: "rgba(239,68,68,0.12)",
   border: "1px solid rgba(239,68,68,0.3)",
   borderRadius: "0.4rem",
   color: "#fca5a5",
   padding: "0.4rem 0.85rem",
   fontSize: "0.8rem",
   fontWeight: 600,
   cursor: "pointer",
};
const tableWrap: React.CSSProperties = {
   overflowX: "auto",
   background: "rgba(255,255,255,0.02)",
   border: "1px solid rgba(255,255,255,0.07)",
   borderRadius: "0.875rem",
};
const table: React.CSSProperties = {
   width: "100%",
   borderCollapse: "collapse",
};
const th: React.CSSProperties = {
   padding: "0.75rem 1rem",
   textAlign: "left",
   fontSize: "0.72rem",
   fontWeight: 700,
   color: "rgba(255,255,255,0.35)",
   letterSpacing: "0.06em",
   textTransform: "uppercase",
   borderBottom: "1px solid rgba(255,255,255,0.07)",
   whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
   padding: "0.7rem 1rem",
   fontSize: "0.875rem",
   color: "#fff",
   verticalAlign: "middle",
};
const tdc: React.CSSProperties = {
   textAlign: "center",
   padding: "2rem",
   color: "rgba(255,255,255,0.3)",
};
const avatarDot: React.CSSProperties = {
   width: 32,
   height: 32,
   borderRadius: "50%",
   background: "linear-gradient(135deg,#7c3aed,#c026d3)",
   display: "flex",
   alignItems: "center",
   justifyContent: "center",
   fontWeight: 700,
   fontSize: "0.85rem",
   flexShrink: 0,
};
