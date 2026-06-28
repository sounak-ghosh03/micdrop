"use client";

import { useEffect, useState, useCallback } from "react";
import {
   fetchComments,
   deleteComment,
   pinComment,
} from "../../../../services/adminApi";

type Comment = {
   _id: string;
   text: string;
   user: { username: string };
   performance?: { title: string };
   pinned: boolean;
   isDeleted: boolean;
   createdAt: string;
};

export default function CommentsPage() {
   const [comments, setComments] = useState<Comment[]>([]);
   const [pagination, setPagination] = useState({
      total: 0,
      page: 1,
      totalPages: 1,
   });
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState("");
   const [includeDeleted, setIncludeDeleted] = useState(false);

   const load = useCallback(
      async (page = 1) => {
         setLoading(true);
         try {
            const params: Record<string, string | number> = {
               page,
               limit: 30,
               includeDeleted: includeDeleted ? "true" : "false",
            };
            const d = (await fetchComments(params)) as {
               comments: Comment[];
               pagination: typeof pagination;
            };
            setComments(d.comments);
            setPagination(d.pagination);
         } finally {
            setLoading(false);
         }
      },
      [includeDeleted],
   );

   useEffect(() => {
      load(1);
   }, [load]);

   const doDelete = async (id: string) => {
      setActionLoading(id + "del");
      try {
         await deleteComment(id);
         await load(pagination.page);
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Failed");
      } finally {
         setActionLoading("");
      }
   };

   const doPin = async (id: string) => {
      setActionLoading(id + "pin");
      try {
         await pinComment(id);
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
            <label style={checkLabel}>
               <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
               />
               Include deleted
            </label>
            <span style={totalBadge}>{pagination.total} comments</span>
         </div>

         <div style={tableWrap}>
            <table style={table}>
               <thead>
                  <tr>
                     {[
                        "Comment",
                        "Author",
                        "Performance",
                        "Pinned",
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
                        <td colSpan={6} style={tdc}>
                           Loading…
                        </td>
                     </tr>
                  ) : (
                     comments.map((c) => (
                        <tr
                           key={c._id}
                           style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                              opacity: c.isDeleted ? 0.4 : 1,
                           }}
                        >
                           <td style={{ ...td, maxWidth: 300 }}>
                              <div
                                 style={{
                                    color: "#fff",
                                    fontSize: "0.85rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical" as const,
                                 }}
                              >
                                 {c.text}
                              </div>
                              {c.isDeleted && (
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
                              @{c.user?.username}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 fontSize: "0.78rem",
                                 color: "rgba(255,255,255,0.4)",
                                 maxWidth: 180,
                              }}
                           >
                              {c.performance?.title ?? "—"}
                           </td>
                           <td style={{ ...td, textAlign: "center" }}>
                              {c.pinned ? (
                                 <span style={{ color: "#f59e0b" }}>📌</span>
                              ) : (
                                 <span
                                    style={{ color: "rgba(255,255,255,0.2)" }}
                                 >
                                    —
                                 </span>
                              )}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 fontSize: "0.75rem",
                                 color: "rgba(255,255,255,0.3)",
                              }}
                           >
                              {new Date(c.createdAt).toLocaleDateString()}
                           </td>
                           <td
                              style={{ ...td, display: "flex", gap: "0.35rem" }}
                           >
                              <Btn
                                 color="#f59e0b"
                                 loading={actionLoading === c._id + "pin"}
                                 onClick={() => doPin(c._id)}
                              >
                                 {c.pinned ? "Unpin" : "📌 Pin"}
                              </Btn>
                              {!c.isDeleted && (
                                 <Btn
                                    color="#ef4444"
                                    loading={actionLoading === c._id + "del"}
                                    onClick={() => doDelete(c._id)}
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
const checkLabel: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   gap: "0.4rem",
   color: "rgba(255,255,255,0.5)",
   fontSize: "0.82rem",
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
