"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
   fetchUsers,
   banUser,
   unbanUser,
   deleteUser,
   verifyUser,
   warnUser,
} from "../../../../services/adminApi";

type User = {
   _id: string;
   username: string;
   email: string;
   role: string;
   isBanned: boolean;
   isVerified: boolean;
   warningsCount: number;
   followers: unknown[];
   following: unknown[];
   createdAt: string;
   lastActiveAt: string;
};

const ROLE_COLORS: Record<string, string> = {
   admin: "#f59e0b",
   performer: "#7c3aed",
   audience: "#06b6d4",
};

export default function UsersPage() {
   const router = useRouter();
   const [users, setUsers] = useState<User[]>([]);
   const [pagination, setPagination] = useState({
      total: 0,
      page: 1,
      totalPages: 1,
   });
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [roleFilter, setRoleFilter] = useState("");
   const [bannedFilter, setBannedFilter] = useState("");
   const [confirm, setConfirm] = useState<{
      action: string;
      userId: string;
      name: string;
   } | null>(null);
   const [actionLoading, setActionLoading] = useState<string | null>(null);

   const load = useCallback(
      async (page = 1) => {
         setLoading(true);
         try {
            const params: Record<string, string | number> = { page, limit: 20 };
            if (search) params.q = search;
            if (roleFilter) params.role = roleFilter;
            if (bannedFilter !== "") params.isBanned = bannedFilter;
            const data = (await fetchUsers(params)) as {
               users: User[];
               pagination: typeof pagination;
            };
            setUsers(data.users);
            setPagination(data.pagination);
         } finally {
            setLoading(false);
         }
      },
      [search, roleFilter, bannedFilter],
   );

   useEffect(() => {
      load(1);
   }, [load]);

   const doAction = async (action: string, userId: string) => {
      setActionLoading(userId + action);
      try {
         if (action === "ban") await banUser(userId, "Admin action");
         if (action === "unban") await unbanUser(userId);
         if (action === "delete") await deleteUser(userId);
         if (action === "verify") await verifyUser(userId);
         if (action === "warn") await warnUser(userId);
         await load(pagination.page);
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Action failed");
      } finally {
         setActionLoading(null);
         setConfirm(null);
      }
   };

   return (
      <div style={page}>
         {/* Filters */}
         <div style={toolbar}>
            <input
               placeholder="Search username…"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               style={inp}
               onKeyDown={(e) => e.key === "Enter" && load(1)}
            />
            <select
               value={roleFilter}
               onChange={(e) => setRoleFilter(e.target.value)}
               style={inp}
            >
               <option value="">All Roles</option>
               <option value="audience">Audience</option>
               <option value="performer">Performer</option>
               <option value="admin">Admin</option>
            </select>
            <select
               value={bannedFilter}
               onChange={(e) => setBannedFilter(e.target.value)}
               style={inp}
            >
               <option value="">All Status</option>
               <option value="false">Active</option>
               <option value="true">Banned</option>
            </select>
            <button onClick={() => load(1)} style={searchBtn}>
               Search
            </button>
            <span style={totalBadge}>{pagination.total} users</span>
         </div>

         {/* Table */}
         <div style={tableWrap}>
            <table style={table}>
               <thead>
                  <tr>
                     {[
                        "Username",
                        "Email",
                        "Role",
                        "Status",
                        "Warnings",
                        "Followers",
                        "Joined",
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
                        <td
                           colSpan={8}
                           style={{
                              textAlign: "center",
                              padding: "2rem",
                              color: "rgba(255,255,255,0.3)",
                           }}
                        >
                           Loading…
                        </td>
                     </tr>
                  ) : (
                     users.map((u) => (
                        <tr
                           key={u._id}
                           style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                           }}
                        >
                           <td style={td}>
                              <button
                                 onClick={() =>
                                    router.push(`/admin/users/${u._id}`)
                                 }
                                 style={linkBtn}
                              >
                                 @{u.username}
                              </button>
                              {u.isVerified && (
                                 <span
                                    title="Verified"
                                    style={{ marginLeft: 4 }}
                                 ></span>
                              )}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 color: "rgba(255,255,255,0.5)",
                                 fontSize: "0.78rem",
                              }}
                           >
                              {u.email}
                           </td>
                           <td style={td}>
                              <span
                                 style={{
                                    ...roleBadge,
                                    background: `${ROLE_COLORS[u.role]}22`,
                                    color: ROLE_COLORS[u.role],
                                    borderColor: `${ROLE_COLORS[u.role]}44`,
                                 }}
                              >
                                 {u.role}
                              </span>
                           </td>
                           <td style={td}>
                              <span
                                 style={{
                                    color: u.isBanned ? "#ef4444" : "#22c55e",
                                    fontWeight: 600,
                                    fontSize: "0.78rem",
                                 }}
                              >
                                 {u.isBanned ? "Banned" : "Active"}
                              </span>
                           </td>
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 color:
                                    u.warningsCount > 0
                                       ? "#f59e0b"
                                       : "rgba(255,255,255,0.3)",
                              }}
                           >
                              {u.warningsCount}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 textAlign: "center",
                                 color: "rgba(255,255,255,0.5)",
                              }}
                           >
                              {(u.followers as unknown[]).length}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 fontSize: "0.75rem",
                                 color: "rgba(255,255,255,0.35)",
                              }}
                           >
                              {new Date(u.createdAt).toLocaleDateString()}
                           </td>
                           <td
                              style={{
                                 ...td,
                                 display: "flex",
                                 gap: "0.35rem",
                                 flexWrap: "wrap",
                              }}
                           >
                              {!u.isBanned ? (
                                 <ActionBtn
                                    color="#ef4444"
                                    loading={actionLoading === u._id + "ban"}
                                    onClick={() =>
                                       setConfirm({
                                          action: "ban",
                                          userId: u._id,
                                          name: u.username,
                                       })
                                    }
                                 >
                                    Ban
                                 </ActionBtn>
                              ) : (
                                 <ActionBtn
                                    color="#22c55e"
                                    loading={actionLoading === u._id + "unban"}
                                    onClick={() => doAction("unban", u._id)}
                                 >
                                    Unban
                                 </ActionBtn>
                              )}
                              <ActionBtn
                                 color="#f59e0b"
                                 loading={actionLoading === u._id + "warn"}
                                 onClick={() => doAction("warn", u._id)}
                              >
                                 Warn
                              </ActionBtn>
                              {!u.isVerified && (
                                 <ActionBtn
                                    color="#7c3aed"
                                    loading={actionLoading === u._id + "verify"}
                                    onClick={() => doAction("verify", u._id)}
                                 >
                                    Verify
                                 </ActionBtn>
                              )}
                              {u.role !== "admin" && (
                                 <ActionBtn
                                    color="#dc2626"
                                    loading={actionLoading === u._id + "delete"}
                                    onClick={() =>
                                       setConfirm({
                                          action: "delete",
                                          userId: u._id,
                                          name: u.username,
                                       })
                                    }
                                 >
                                    Delete
                                 </ActionBtn>
                              )}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         <div style={pagination_bar}>
            <button
               disabled={pagination.page <= 1}
               onClick={() => load(pagination.page - 1)}
               style={pageBtn}
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
               style={pageBtn}
            >
               Next →
            </button>
         </div>

         {/* Confirm modal */}
         {confirm && (
            <div style={overlay}>
               <div style={modal}>
                  <h3 style={{ color: "#fff", margin: "0 0 0.5rem" }}>
                     {confirm.action === "delete"
                        ? " Delete Account"
                        : " Ban User"}
                  </h3>
                  <p
                     style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.875rem",
                     }}
                  >
                     {confirm.action === "delete"
                        ? `This will permanently delete @${confirm.name} and all their content. This cannot be undone.`
                        : `This will ban @${confirm.name} from the platform.`}
                  </p>
                  <div
                     style={{
                        display: "flex",
                        gap: "0.75rem",
                        marginTop: "1rem",
                     }}
                  >
                     <button onClick={() => setConfirm(null)} style={cancelBtn}>
                        Cancel
                     </button>
                     <button
                        onClick={() => doAction(confirm.action, confirm.userId)}
                        style={dangerBtn}
                     >
                        Confirm {confirm.action === "delete" ? "Delete" : "Ban"}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

const ActionBtn = ({
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
      }}
   >
      {loading ? "…" : children}
   </button>
);

const page: React.CSSProperties = {
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
   outline: "none",
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
const roleBadge: React.CSSProperties = {
   padding: "0.15rem 0.5rem",
   borderRadius: "0.3rem",
   border: "1px solid",
   fontSize: "0.72rem",
   fontWeight: 600,
};
const linkBtn: React.CSSProperties = {
   background: "none",
   border: "none",
   color: "#a78bfa",
   cursor: "pointer",
   padding: 0,
   fontWeight: 600,
   fontSize: "0.85rem",
   textDecoration: "underline",
};
const pagination_bar: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   gap: "1rem",
   justifyContent: "center",
};
const pageBtn: React.CSSProperties = {
   background: "rgba(255,255,255,0.06)",
   border: "1px solid rgba(255,255,255,0.1)",
   borderRadius: "0.4rem",
   color: "#fff",
   padding: "0.4rem 0.9rem",
   fontSize: "0.8rem",
   cursor: "pointer",
};
const overlay: React.CSSProperties = {
   position: "fixed",
   inset: 0,
   background: "rgba(0,0,0,0.75)",
   display: "flex",
   alignItems: "center",
   justifyContent: "center",
   zIndex: 999,
};
const modal: React.CSSProperties = {
   background: "#1a1a2e",
   border: "1px solid rgba(239,68,68,0.3)",
   borderRadius: "1rem",
   padding: "2rem",
   maxWidth: 400,
   width: "90%",
};
const cancelBtn: React.CSSProperties = {
   background: "rgba(255,255,255,0.07)",
   border: "1px solid rgba(255,255,255,0.15)",
   borderRadius: "0.5rem",
   color: "#fff",
   padding: "0.5rem 1.25rem",
   cursor: "pointer",
   fontWeight: 600,
};
const dangerBtn: React.CSSProperties = {
   background: "rgba(239,68,68,0.15)",
   border: "1px solid rgba(239,68,68,0.4)",
   borderRadius: "0.5rem",
   color: "#fca5a5",
   padding: "0.5rem 1.25rem",
   cursor: "pointer",
   fontWeight: 600,
};
