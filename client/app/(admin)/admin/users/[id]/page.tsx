"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
   fetchUserDetail,
   banUser,
   unbanUser,
   deleteUser,
   changeUserRole,
   verifyUser,
   warnUser,
   resetWarnings,
} from "../../../../../services/adminApi";

type UserDetail = {
   user: {
      _id: string;
      username: string;
      email: string;
      role: string;
      isBanned: boolean;
      isVerified: boolean;
      warningsCount: number;
      bio: string;
      avatar: string;
      stats: { totalPerformances: number; totalApplause: number };
      followers: unknown[];
      following: unknown[];
      createdAt: string;
      lastActiveAt: string;
   };
   performances: Array<{
      _id: string;
      title: string;
      status: string;
      createdAt: string;
      stats: { viewers: number; totalReactions: number };
   }>;
   comments: Array<{
      _id: string;
      text: string;
      performance?: { title: string };
      createdAt: string;
   }>;
   reactionCount: number;
};

export default function UserDetailPage() {
   const { id } = useParams<{ id: string }>();
   const router = useRouter();
   const [data, setData] = useState<UserDetail | null>(null);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState("");
   const [newRole, setNewRole] = useState("");

   const load = async () => {
      setLoading(true);
      try {
         const d = (await fetchUserDetail(id)) as UserDetail;
         setData(d);
         setNewRole(d.user.role);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      load();
   }, [id]);

   const act = async (action: string, payload?: unknown) => {
      setActionLoading(action);
      try {
         if (action === "ban") await banUser(id, "Manual admin action");
         if (action === "unban") await unbanUser(id);
         if (action === "delete") {
            await deleteUser(id);
            router.push("/admin/users");
            return;
         }
         if (action === "verify") await verifyUser(id);
         if (action === "warn") await warnUser(id);
         if (action === "resetW") await resetWarnings(id);
         if (action === "role") await changeUserRole(id, payload as string);
         await load();
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Action failed");
      } finally {
         setActionLoading("");
      }
   };

   if (loading || !data) return <div style={loader}>Loading user…</div>;
   const { user, performances, comments, reactionCount } = data;

   return (
      <div style={pg}>
         <button onClick={() => router.back()} style={backBtn}>
            ← Back to Users
         </button>

         <div style={grid}>
            {/* Left: profile card */}
            <div style={profileCard}>
               <div style={avatarCircle}>
                  {user.username.charAt(0).toUpperCase()}
               </div>
               <div
                  style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}
               >
                  @{user.username}
               </div>
               <div
                  style={{
                     fontSize: "0.8rem",
                     color: "rgba(255,255,255,0.4)",
                     marginBottom: "0.5rem",
                  }}
               >
                  {user.email}
               </div>

               <div
                  style={{
                     display: "flex",
                     gap: "0.5rem",
                     flexWrap: "wrap",
                     justifyContent: "center",
                  }}
               >
                  <Chip
                     label={user.role}
                     color={
                        user.role === "admin"
                           ? "#f59e0b"
                           : user.role === "performer"
                             ? "#7c3aed"
                             : "#06b6d4"
                     }
                  />
                  {user.isVerified && (
                     <Chip label="Verified ✅" color="#10b981" />
                  )}
                  {user.isBanned && <Chip label="Banned 🚫" color="#ef4444" />}
               </div>

               <div style={statsRow}>
                  <Stat label="Followers" value={user.followers.length} />
                  <Stat label="Following" value={user.following.length} />
                  <Stat
                     label="Performances"
                     value={user.stats.totalPerformances}
                  />
                  <Stat label="Reactions" value={reactionCount} />
                  <Stat
                     label="Warnings"
                     value={user.warningsCount}
                     color={user.warningsCount > 0 ? "#f59e0b" : undefined}
                  />
               </div>

               {user.bio && (
                  <p
                     style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "0.8rem",
                        textAlign: "center",
                        marginTop: "0.5rem",
                     }}
                  >
                     {user.bio}
                  </p>
               )}

               <div
                  style={{
                     fontSize: "0.72rem",
                     color: "rgba(255,255,255,0.25)",
                     marginTop: "0.5rem",
                  }}
               >
                  Joined {new Date(user.createdAt).toLocaleDateString()} · Last
                  active {new Date(user.lastActiveAt).toLocaleDateString()}
               </div>
            </div>

            {/* Right: actions */}
            <div style={actionsCard}>
               <h3 style={sectionH}>⚙️ Admin Actions</h3>
               <div style={actionGrid}>
                  {!user.isBanned ? (
                     <ActBtn
                        label="🚫 Ban User"
                        color="#ef4444"
                        action="ban"
                        onAct={act}
                        loading={actionLoading}
                     />
                  ) : (
                     <ActBtn
                        label="✅ Unban User"
                        color="#22c55e"
                        action="unban"
                        onAct={act}
                        loading={actionLoading}
                     />
                  )}
                  <ActBtn
                     label="⚠️ Issue Warning"
                     color="#f59e0b"
                     action="warn"
                     onAct={act}
                     loading={actionLoading}
                  />
                  <ActBtn
                     label="🔄 Reset Warnings"
                     color="#06b6d4"
                     action="resetW"
                     onAct={act}
                     loading={actionLoading}
                  />
                  {!user.isVerified && (
                     <ActBtn
                        label="✅ Verify User"
                        color="#10b981"
                        action="verify"
                        onAct={act}
                        loading={actionLoading}
                     />
                  )}
               </div>

               {/* Role change */}
               <h3 style={{ ...sectionH, marginTop: "1.25rem" }}>
                  🎭 Change Role
               </h3>
               <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                     value={newRole}
                     onChange={(e) => setNewRole(e.target.value)}
                     style={sel}
                  >
                     <option value="audience">Audience</option>
                     <option value="performer">Performer</option>
                     <option value="admin">Admin</option>
                  </select>
                  <button
                     onClick={() => act("role", newRole)}
                     style={confirmRoleBtn}
                     disabled={
                        newRole === user.role || actionLoading === "role"
                     }
                  >
                     {actionLoading === "role" ? "…" : "Apply"}
                  </button>
               </div>

               {/* Danger zone */}
               {user.role !== "admin" && (
                  <>
                     <h3
                        style={{
                           ...sectionH,
                           marginTop: "1.25rem",
                           color: "#ef4444",
                        }}
                     >
                        ⚠️ Danger Zone
                     </h3>
                     <button
                        onClick={() => {
                           if (
                              confirm(
                                 `Delete @${user.username}? This cannot be undone.`,
                              )
                           )
                              act("delete");
                        }}
                        style={deleteBtnStyle}
                     >
                        🗑️ Permanently Delete Account
                     </button>
                  </>
               )}
            </div>
         </div>

         {/* Performances */}
         <section>
            <h3 style={sectionH}>
               🎤 Recent Performances ({performances.length})
            </h3>
            <div style={listGrid}>
               {performances.length === 0 && <Empty text="No performances" />}
               {performances.map((p) => (
                  <div key={p._id} style={itemCard}>
                     <div
                        style={{
                           fontWeight: 600,
                           color: "#fff",
                           fontSize: "0.875rem",
                        }}
                     >
                        {p.title}
                     </div>
                     <div
                        style={{
                           display: "flex",
                           gap: "0.75rem",
                           marginTop: "0.35rem",
                           fontSize: "0.75rem",
                           color: "rgba(255,255,255,0.35)",
                        }}
                     >
                        <span
                           style={{
                              color:
                                 p.status === "LIVE"
                                    ? "#22c55e"
                                    : "rgba(255,255,255,0.35)",
                           }}
                        >
                           {p.status}
                        </span>
                        <span>👁 {p.stats?.viewers ?? 0}</span>
                        <span>❤️ {p.stats?.totalReactions ?? 0}</span>
                        <span>
                           {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Comments */}
         <section>
            <h3 style={sectionH}>💬 Recent Comments ({comments.length})</h3>
            <div style={listGrid}>
               {comments.length === 0 && <Empty text="No comments" />}
               {comments.map((c) => (
                  <div key={c._id} style={itemCard}>
                     <div
                        style={{
                           color: "rgba(255,255,255,0.8)",
                           fontSize: "0.85rem",
                        }}
                     >
                        {c.text}
                     </div>
                     <div
                        style={{
                           fontSize: "0.72rem",
                           color: "rgba(255,255,255,0.3)",
                           marginTop: "0.3rem",
                        }}
                     >
                        on "{c.performance?.title ?? "Unknown"}" ·{" "}
                        {new Date(c.createdAt).toLocaleDateString()}
                     </div>
                  </div>
               ))}
            </div>
         </section>
      </div>
   );
}

const Chip = ({ label, color }: { label: string; color: string }) => (
   <span
      style={{
         background: `${color}22`,
         color,
         border: `1px solid ${color}44`,
         borderRadius: "0.3rem",
         padding: "0.15rem 0.5rem",
         fontSize: "0.72rem",
         fontWeight: 600,
      }}
   >
      {label}
   </span>
);
const Stat = ({
   label,
   value,
   color,
}: {
   label: string;
   value: number;
   color?: string;
}) => (
   <div style={{ textAlign: "center" }}>
      <div
         style={{ fontSize: "1.1rem", fontWeight: 700, color: color ?? "#fff" }}
      >
         {value}
      </div>
      <div
         style={{
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
         }}
      >
         {label}
      </div>
   </div>
);
const ActBtn = ({
   label,
   color,
   action,
   onAct,
   loading,
}: {
   label: string;
   color: string;
   action: string;
   onAct: (a: string) => void;
   loading: string;
}) => (
   <button
      onClick={() => onAct(action)}
      disabled={loading === action}
      style={{
         background: `${color}15`,
         border: `1px solid ${color}40`,
         borderRadius: "0.5rem",
         color,
         padding: "0.55rem 0.75rem",
         fontSize: "0.8rem",
         fontWeight: 600,
         cursor: loading === action ? "not-allowed" : "pointer",
         opacity: loading === action ? 0.6 : 1,
         textAlign: "left",
      }}
   >
      {loading === action ? "Processing…" : label}
   </button>
);
const Empty = ({ text }: { text: string }) => (
   <div
      style={{
         color: "rgba(255,255,255,0.2)",
         fontSize: "0.8rem",
         padding: "1rem",
         textAlign: "center",
         background: "rgba(255,255,255,0.02)",
         borderRadius: "0.5rem",
         border: "1px dashed rgba(255,255,255,0.07)",
      }}
   >
      {text}
   </div>
);

const pg: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "1.5rem",
};
const loader: React.CSSProperties = {
   color: "rgba(255,255,255,0.4)",
   textAlign: "center",
   paddingTop: "3rem",
};
const backBtn: React.CSSProperties = {
   background: "rgba(255,255,255,0.06)",
   border: "1px solid rgba(255,255,255,0.1)",
   borderRadius: "0.5rem",
   color: "rgba(255,255,255,0.6)",
   padding: "0.4rem 0.9rem",
   fontSize: "0.8rem",
   cursor: "pointer",
   alignSelf: "flex-start",
};
const grid: React.CSSProperties = {
   display: "grid",
   gridTemplateColumns: "280px 1fr",
   gap: "1.25rem",
};
const profileCard: React.CSSProperties = {
   background: "rgba(255,255,255,0.03)",
   border: "1px solid rgba(255,255,255,0.08)",
   borderRadius: "1rem",
   padding: "1.5rem",
   display: "flex",
   flexDirection: "column",
   alignItems: "center",
   gap: "0.5rem",
};
const actionsCard: React.CSSProperties = {
   background: "rgba(255,255,255,0.03)",
   border: "1px solid rgba(255,255,255,0.08)",
   borderRadius: "1rem",
   padding: "1.5rem",
};
const avatarCircle: React.CSSProperties = {
   width: 64,
   height: 64,
   borderRadius: "50%",
   background: "linear-gradient(135deg, #7c3aed, #c026d3)",
   display: "flex",
   alignItems: "center",
   justifyContent: "center",
   fontSize: "1.5rem",
   fontWeight: 700,
   color: "#fff",
   marginBottom: "0.5rem",
};
const statsRow: React.CSSProperties = {
   display: "flex",
   gap: "1rem",
   flexWrap: "wrap",
   justifyContent: "center",
   marginTop: "0.75rem",
   paddingTop: "0.75rem",
   borderTop: "1px solid rgba(255,255,255,0.07)",
   width: "100%",
};
const sectionH: React.CSSProperties = {
   fontSize: "0.85rem",
   fontWeight: 700,
   color: "rgba(255,255,255,0.7)",
   margin: "0 0 0.75rem",
};
const actionGrid: React.CSSProperties = {
   display: "grid",
   gridTemplateColumns: "1fr 1fr",
   gap: "0.5rem",
};
const sel: React.CSSProperties = {
   background: "rgba(255,255,255,0.05)",
   border: "1px solid rgba(255,255,255,0.1)",
   borderRadius: "0.4rem",
   color: "#fff",
   padding: "0.4rem 0.6rem",
   fontSize: "0.85rem",
   flex: 1,
};
const confirmRoleBtn: React.CSSProperties = {
   background: "#7c3aed",
   border: "none",
   borderRadius: "0.4rem",
   color: "#fff",
   padding: "0.4rem 0.9rem",
   fontWeight: 600,
   cursor: "pointer",
   fontSize: "0.85rem",
};
const deleteBtnStyle: React.CSSProperties = {
   background: "rgba(239,68,68,0.08)",
   border: "1px solid rgba(239,68,68,0.25)",
   borderRadius: "0.5rem",
   color: "#fca5a5",
   padding: "0.6rem 1rem",
   width: "100%",
   cursor: "pointer",
   fontWeight: 600,
   fontSize: "0.8rem",
   textAlign: "left",
};
const listGrid: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "0.5rem",
};
const itemCard: React.CSSProperties = {
   background: "rgba(255,255,255,0.02)",
   border: "1px solid rgba(255,255,255,0.06)",
   borderRadius: "0.6rem",
   padding: "0.75rem 1rem",
};
