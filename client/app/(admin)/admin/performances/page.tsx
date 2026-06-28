"use client";

import { useEffect, useState, useCallback } from "react";
import {
   fetchPerformances,
   deletePerformance,
   forceEndPerformance,
} from "../../../../services/adminApi";

type Perf = {
   _id: string;
   title: string;
   status: string;
   type: string;
   creator: { username: string };
   stats: { viewers: number; totalReactions: number; commentCount: number };
   createdAt: string;
   isDeleted: boolean;
};

const STATUS_COLOR: Record<string, string> = {
   LIVE: "#22c55e",
   ENDED: "#64748b",
   SCHEDULED: "#f59e0b",
};

export default function PerformancesPage() {
   const [performances, setPerformances] = useState<Perf[]>([]);
   const [pagination, setPagination] = useState({
      total: 0,
      page: 1,
      totalPages: 1,
   });
   const [loading, setLoading] = useState(true);
   const [status, setStatus] = useState("");
   const [includeDeleted, setIncludeDeleted] = useState(false);
   const [actionLoading, setActionLoading] = useState("");

   const load = useCallback(
      async (page = 1) => {
         setLoading(true);
         try {
            const params: Record<string, string | number> = {
               page,
               limit: 20,
               includeDeleted: includeDeleted ? "true" : "false",
            };
            if (status) params.status = status;
            const d = (await fetchPerformances(params)) as {
               performances: Perf[];
               pagination: typeof pagination;
            };
            setPerformances(d.performances);
            setPagination(d.pagination);
         } finally {
            setLoading(false);
         }
      },
      [status, includeDeleted],
   );

   useEffect(() => {
      load(1);
   }, [load]);

   const doDelete = async (id: string, title: string) => {
      if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
      setActionLoading(id + "del");
      try {
         await deletePerformance(id);
         await load(pagination.page);
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Failed");
      } finally {
         setActionLoading("");
      }
   };

   const doForceEnd = async (id: string) => {
      setActionLoading(id + "end");
      try {
         await forceEndPerformance(id);
         await load(pagination.page);
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Failed");
      } finally {
         setActionLoading("");
      }
   };

   return (
      <div style={pg}>
         <div style={toolbar}>
            <select
               value={status}
               onChange={(e) => setStatus(e.target.value)}
               style={inp}
            >
               <option value="">All Status</option>
               <option value="LIVE">Live</option>
               <option value="ENDED">Ended</option>
               <option value="SCHEDULED">Scheduled</option>
            </select>
            <label style={checkLabel}>
               <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
               />
               Include deleted
            </label>
            <button onClick={() => load(1)} style={searchBtn}>
               Filter
            </button>
            <span style={totalBadge}>{pagination.total} results</span>
         </div>

         <div style={tableWrap}>
            <table style={table}>
               <thead>
                  <tr>
                     {[
                        "Title",
                        "Creator",
                        "Type",
                        "Status",
                        "Viewers",
                        "Reactions",
                        "Date",
                        "Actions",
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
                        <td colSpan={8} style={tdc}>
                           Loading…
                        </td>
                     </tr>
                  ) : (
                     performances.map((p) => (
                        <tr
                           key={p._id}
                           style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                              opacity: p.isDeleted ? 0.4 : 1,
                           }}
                        >
                           <td style={td}>
                              <div
                                 style={{
                                    fontWeight: 600,
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                    maxWidth: 200,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                 }}
                              >
                                 {p.title}
                              </div>
                              {p.isDeleted && (
                                 <span
                                    style={{
                                       fontSize: "0.65rem",
                                       color: "#ef4444",
                                    }}
                                 >
                                    deleted
                                 </span>
                              )}
                           </td>
                           <td style={{ ...td, color: "#a78bfa" }}>
                              @{p.creator?.username}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 fontSize: "0.75rem",
                                 color: "rgba(255,255,255,0.45)",
                              }}
                           >
                              {p.type}
                           </td>
                           <td style={td}>
                              <span
                                 style={{
                                    background: `${STATUS_COLOR[p.status] ?? "#64748b"}22`,
                                    color: STATUS_COLOR[p.status] ?? "#64748b",
                                    border: `1px solid ${STATUS_COLOR[p.status] ?? "#64748b"}44`,
                                    borderRadius: "0.3rem",
                                    padding: "0.15rem 0.5rem",
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                 }}
                              >
                                 {p.status === "LIVE"}
                                 {p.status}
                              </span>
                           </td>
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 color: "rgba(255,255,255,0.5)",
                              }}
                           >
                              {p.stats?.viewers ?? 0}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 color: "rgba(255,255,255,0.5)",
                              }}
                           >
                              {p.stats?.totalReactions ?? 0}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 fontSize: "0.75rem",
                                 color: "rgba(255,255,255,0.3)",
                              }}
                           >
                              {new Date(p.createdAt).toLocaleDateString()}
                           </td>
                           <td
                              style={{ ...td, display: "flex", gap: "0.35rem" }}
                           >
                              {p.status === "LIVE" && (
                                 <Btn
                                    color="#f59e0b"
                                    loading={actionLoading === p._id + "end"}
                                    onClick={() => doForceEnd(p._id)}
                                 >
                                    End
                                 </Btn>
                              )}
                              {!p.isDeleted && (
                                 <Btn
                                    color="#ef4444"
                                    loading={actionLoading === p._id + "del"}
                                    onClick={() => doDelete(p._id, p.title)}
                                 >
                                    Delete
                                 </Btn>
                              )}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         <div style={pgBar}>
            <button
               disabled={pagination.page <= 1}
               onClick={() => load(pagination.page - 1)}
               style={pgBtn}
            >
               ← Prev
            </button>
            <span
               style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}
            >
               Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
               disabled={pagination.page >= pagination.totalPages}
               onClick={() => load(pagination.page + 1)}
               style={pgBtn}
            >
               Next →
            </button>
         </div>
      </div>
   );
}

const Btn = ({
   children,
   onClick,
   color,
   loading,
}: {
   children: React.ReactNode;
   onClick: () => void;
   color: string;
   loading: boolean;
}) => (
   <button
      onClick={onClick}
      disabled={loading}
      style={{
         background: `${color}18`,
         border: `1px solid ${color}44`,
         color,
         borderRadius: "0.35rem",
         padding: "0.2rem 0.5rem",
         fontSize: "0.72rem",
         fontWeight: 600,
         cursor: loading ? "not-allowed" : "pointer",
         opacity: loading ? 0.6 : 1,
         whiteSpace: "nowrap",
      }}
   >
      {loading ? "…" : children}
   </button>
);

const pg: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "1rem",
};
const toolbar: React.CSSProperties = {
   display: "flex",
   gap: "0.75rem",
   flexWrap: "wrap",
   alignItems: "center",
};
const inp: React.CSSProperties = {
   background: "rgba(255,255,255,0.05)",
   border: "1px solid rgba(255,255,255,0.1)",
   borderRadius: "0.5rem",
   padding: "0.5rem 0.75rem",
   color: "#fff",
   fontSize: "0.85rem",
};
const checkLabel: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   gap: "0.4rem",
   color: "rgba(255,255,255,0.5)",
   fontSize: "0.82rem",
   cursor: "pointer",
};
const searchBtn: React.CSSProperties = {
   background: "#7c3aed",
   border: "none",
   borderRadius: "0.5rem",
   color: "#fff",
   padding: "0.5rem 1rem",
   fontSize: "0.85rem",
   fontWeight: 600,
   cursor: "pointer",
};
const totalBadge: React.CSSProperties = {
   marginLeft: "auto",
   color: "rgba(255,255,255,0.35)",
   fontSize: "0.8rem",
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
   fontSize: "0.85rem",
   color: "#fff",
   verticalAlign: "middle",
};
const tdc: React.CSSProperties = {
   textAlign: "center",
   padding: "2rem",
   color: "rgba(255,255,255,0.3)",
};
const pgBar: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   gap: "1rem",
   justifyContent: "center",
};
const pgBtn: React.CSSProperties = {
   background: "rgba(255,255,255,0.06)",
   border: "1px solid rgba(255,255,255,0.1)",
   borderRadius: "0.4rem",
   color: "#fff",
   padding: "0.4rem 0.9rem",
   fontSize: "0.8rem",
   cursor: "pointer",
};
