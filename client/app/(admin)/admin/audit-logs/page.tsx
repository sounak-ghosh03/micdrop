"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchAuditLogs } from "../../../../services/adminApi";

type Log = {
   _id: string;
   admin: { username: string; email: string };
   action: string;
   targetType: string;
   targetId?: string;
   details?: Record<string, unknown>;
   ip?: string;
   createdAt: string;
};

const ACTION_COLOR: Record<string, string> = {
   admin_login: "#22c55e",
   admin_logout: "#64748b",
   ban_user: "#ef4444",
   unban_user: "#22c55e",
   delete_user: "#dc2626",
   change_role: "#7c3aed",
   verify_user: "#10b981",
   warn_user: "#f59e0b",
   reset_warnings: "#06b6d4",
   delete_performance: "#ef4444",
   force_end_performance: "#f59e0b",
   delete_comment: "#ef4444",
   pin_comment: "#f59e0b",
   update_banned_words: "#a855f7",
   reset_leaderboard: "#dc2626",
   refresh_leaderboard: "#22c55e",
   kick_from_room: "#f59e0b",
   change_password: "#7c3aed",
};

export default function AuditLogsPage() {
   const [logs, setLogs] = useState<Log[]>([]);
   const [pagination, setPagination] = useState({
      total: 0,
      page: 1,
      totalPages: 1,
   });
   const [loading, setLoading] = useState(true);
   const [actionFilter, setActionFilter] = useState("");
   const [typeFilter, setTypeFilter] = useState("");
   const [expanded, setExpanded] = useState<string | null>(null);

   const load = useCallback(
      async (page = 1) => {
         setLoading(true);
         try {
            const params: Record<string, string | number> = { page, limit: 30 };
            if (actionFilter) params.action = actionFilter;
            if (typeFilter) params.targetType = typeFilter;
            const d = (await fetchAuditLogs(params)) as {
               logs: Log[];
               pagination: typeof pagination;
            };
            setLogs(d.logs);
            setPagination(d.pagination);
         } finally {
            setLoading(false);
         }
      },
      [actionFilter, typeFilter],
   );

   useEffect(() => {
      load(1);
   }, [load]);

   return (
      <div style={pg}>
         <div style={toolbar}>
            <select
               value={actionFilter}
               onChange={(e) => setActionFilter(e.target.value)}
               style={inp}
            >
               <option value="">All Actions</option>
               {Object.keys(ACTION_COLOR).map((a) => (
                  <option key={a} value={a}>
                     {a.replace(/_/g, " ")}
                  </option>
               ))}
            </select>
            <select
               value={typeFilter}
               onChange={(e) => setTypeFilter(e.target.value)}
               style={inp}
            >
               <option value="">All Target Types</option>
               <option value="user">User</option>
               <option value="performance">Performance</option>
               <option value="comment">Comment</option>
               <option value="leaderboard">Leaderboard</option>
               <option value="system">System</option>
            </select>
            <button onClick={() => load(1)} style={filterBtn}>
               Filter
            </button>
            <span style={totalBadge}>{pagination.total} entries</span>
         </div>

         <div style={logList}>
            {loading ? (
               <div style={empty}>Loading logs…</div>
            ) : logs.length === 0 ? (
               <div style={empty}>No audit logs found</div>
            ) : (
               logs.map((log) => {
                  const color = ACTION_COLOR[log.action] ?? "#64748b";
                  const isExp = expanded === log._id;
                  return (
                     <div
                        key={log._id}
                        style={{ ...logRow, borderLeftColor: color }}
                        onClick={() => setExpanded(isExp ? null : log._id)}
                     >
                        <div style={logHead}>
                           <div
                              style={{
                                 display: "flex",
                                 alignItems: "center",
                                 gap: "0.75rem",
                                 flex: 1,
                              }}
                           >
                              <span
                                 style={{
                                    ...actionBadge,
                                    background: `${color}22`,
                                    color,
                                    borderColor: `${color}44`,
                                 }}
                              >
                                 {log.action.replace(/_/g, " ")}
                              </span>
                              <span
                                 style={{
                                    fontSize: "0.78rem",
                                    color: "rgba(255,255,255,0.5)",
                                 }}
                              >
                                 by{" "}
                                 <strong style={{ color: "#a78bfa" }}>
                                    @{log.admin?.username}
                                 </strong>
                              </span>
                              <span
                                 style={{
                                    fontSize: "0.72rem",
                                    color: "rgba(255,255,255,0.3)",
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: "0.3rem",
                                    padding: "0.1rem 0.4rem",
                                 }}
                              >
                                 {log.targetType}
                              </span>
                           </div>
                           <div
                              style={{
                                 display: "flex",
                                 alignItems: "center",
                                 gap: "0.75rem",
                              }}
                           >
                              {log.ip && (
                                 <span
                                    style={{
                                       fontSize: "0.7rem",
                                       color: "rgba(255,255,255,0.2)",
                                       fontFamily: "monospace",
                                    }}
                                 >
                                    {log.ip}
                                 </span>
                              )}
                              <span
                                 style={{
                                    fontSize: "0.72rem",
                                    color: "rgba(255,255,255,0.25)",
                                 }}
                              >
                                 {new Date(log.createdAt).toLocaleString()}
                              </span>
                              <span
                                 style={{
                                    color: "rgba(255,255,255,0.3)",
                                    fontSize: "0.8rem",
                                 }}
                              >
                                 {isExp ? "▲" : "▼"}
                              </span>
                           </div>
                        </div>
                        {isExp && (
                           <div style={logDetail}>
                              <div
                                 style={{
                                    display: "flex",
                                    gap: "1rem",
                                    flexWrap: "wrap",
                                    marginBottom: "0.5rem",
                                 }}
                              >
                                 <span
                                    style={{
                                       fontSize: "0.75rem",
                                       color: "rgba(255,255,255,0.35)",
                                    }}
                                 >
                                    Admin: {log.admin?.email}
                                 </span>
                                 {log.targetId && (
                                    <span
                                       style={{
                                          fontSize: "0.75rem",
                                          color: "rgba(255,255,255,0.35)",
                                          fontFamily: "monospace",
                                       }}
                                    >
                                       Target ID: {String(log.targetId)}
                                    </span>
                                 )}
                              </div>
                              {log.details &&
                                 Object.keys(log.details).length > 0 && (
                                    <pre
                                       style={{
                                          fontSize: "0.75rem",
                                          color: "#a78bfa",
                                          background: "rgba(124,58,237,0.08)",
                                          borderRadius: "0.4rem",
                                          padding: "0.5rem 0.75rem",
                                          margin: 0,
                                          overflowX: "auto",
                                       }}
                                    >
                                       {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                 )}
                           </div>
                        )}
                     </div>
                  );
               })
            )}
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
const filterBtn: React.CSSProperties = {
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
const logList: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "0.4rem",
};
const logRow: React.CSSProperties = {
   background: "rgba(255,255,255,0.02)",
   border: "1px solid rgba(255,255,255,0.06)",
   borderLeft: "3px solid",
   borderRadius: "0.6rem",
   padding: "0.75rem 1rem",
   cursor: "pointer",
   transition: "background 0.15s",
};
const logHead: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   justifyContent: "space-between",
   gap: "0.75rem",
   flexWrap: "wrap",
};
const actionBadge: React.CSSProperties = {
   padding: "0.15rem 0.5rem",
   borderRadius: "0.3rem",
   border: "1px solid",
   fontSize: "0.72rem",
   fontWeight: 600,
   textTransform: "capitalize",
};
const logDetail: React.CSSProperties = {
   marginTop: "0.75rem",
   paddingTop: "0.75rem",
   borderTop: "1px solid rgba(255,255,255,0.06)",
};
const empty: React.CSSProperties = {
   color: "rgba(255,255,255,0.3)",
   textAlign: "center",
   padding: "2rem",
   background: "rgba(255,255,255,0.02)",
   borderRadius: "0.75rem",
   border: "1px dashed rgba(255,255,255,0.07)",
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
