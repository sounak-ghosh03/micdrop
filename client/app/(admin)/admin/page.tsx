"use client";

import { useEffect, useState } from "react";
import { fetchAdminStats, fetchLiveRooms } from "../../../services/adminApi";

interface Stats {
   users: {
      total: number;
      performers: number;
      audience: number;
      admins: number;
      banned: number;
      verified: number;
      newToday: number;
      newThisWeek: number;
   };
   performances: { total: number; live: number };
   engagement: {
      totalComments: number;
      totalReactions: number;
      activeRooms: number;
   };
}

const KPI = ({
   label,
   value,
   sub,
   color,
}: {
   label: string;
   value: number | string;
   sub?: string;
   color: string;
}) => (
   <div style={{ ...card, borderColor: `${color}30` }}>
      <div
         style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
         }}
      >
         <div>
            <div
               style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
               }}
            >
               {label}
            </div>
            <div
               style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#fff",
                  margin: "0.25rem 0",
               }}
            >
               {value}
            </div>
            {sub && <div style={{ fontSize: "0.75rem", color }}>{sub}</div>}
         </div>
      </div>
      <div
         style={{
            marginTop: "0.75rem",
            height: 3,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 2,
         }}
      >
         <div
            style={{
               height: "100%",
               background: color,
               width: "60%",
               borderRadius: 2,
            }}
         />
      </div>
   </div>
);

export default function AdminDashboard() {
   const [stats, setStats] = useState<Stats | null>(null);
   const [liveRooms, setLiveRooms] = useState<unknown[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      Promise.all([fetchAdminStats(), fetchLiveRooms()])
         .then(([s, l]: unknown[]) => {
            setStats(s as Stats);
            setLiveRooms((l as { rooms: unknown[] }).rooms ?? []);
         })
         .finally(() => setLoading(false));
   }, []);

   if (loading) return <div style={loader}>Loading dashboard…</div>;

   return (
      <div style={page}>
         <div style={grid4}>
            <KPI
               label="Total Users"
               value={stats?.users.total ?? 0}
               sub={`+${stats?.users.newToday ?? 0} today`}
               color="#7c3aed"
            />
            <KPI
               label="Banned"
               value={stats?.users.banned ?? 0}
               sub="accounts suspended"
               color="#ef4444"
            />
            <KPI
               label="Live Now"
               value={stats?.performances.live ?? 0}
               sub="active streams"
               color="#22c55e"
            />
            <KPI
               label="Performances"
               value={stats?.performances.total ?? 0}
               sub="all time"
               color="#f59e0b"
            />
            <KPI
               label="Total Comments"
               value={stats?.engagement.totalComments ?? 0}
               sub="moderated"
               color="#06b6d4"
            />
            <KPI
               label="Total Reactions"
               value={stats?.engagement.totalReactions ?? 0}
               sub="all time"
               color="#ec4899"
            />
            <KPI
               label="New This Week"
               value={stats?.users.newThisWeek ?? 0}
               sub="signups"
               color="#a855f7"
            />
            <KPI
               label="Verified Users"
               value={stats?.users.verified ?? 0}
               sub="verified accounts"
               color="#10b981"
            />
         </div>

         {/* Live rooms */}
         <section style={section}>
            <h2 style={sectionTitle}>
               Active Live Rooms ({liveRooms.length})
            </h2>
            {liveRooms.length === 0 ? (
               <div style={emptyState}>No live performances right now</div>
            ) : (
               <div style={grid3}>
                  {(
                     liveRooms as Array<{
                        performanceId: string;
                        title: string;
                        viewerCount: number;
                        creator: { username: string };
                     }>
                  ).map((room) => (
                     <div key={room.performanceId} style={liveCard}>
                        <div
                           style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                           }}
                        >
                           <span style={liveDot} />
                           <span
                              style={{
                                 fontWeight: 600,
                                 color: "#fff",
                                 fontSize: "0.9rem",
                                 flex: 1,
                              }}
                           >
                              {room.title}
                           </span>
                        </div>
                        <div
                           style={{
                              fontSize: "0.78rem",
                              color: "rgba(255,255,255,0.45)",
                              marginTop: "0.4rem",
                           }}
                        >
                           by @{room.creator?.username}
                        </div>
                        <div
                           style={{
                              marginTop: "0.5rem",
                              fontSize: "0.8rem",
                              color: "#22c55e",
                              fontWeight: 600,
                           }}
                        >
                           {room.viewerCount ?? 0} viewers
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </section>

         {/* Role breakdown */}
         <section style={section}>
            <h2 style={sectionTitle}>User Breakdown</h2>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
               {[
                  {
                     label: "Performers",
                     value: stats?.users.performers ?? 0,
                     color: "#7c3aed",
                  },
                  {
                     label: "Audience",
                     value: stats?.users.audience ?? 0,
                     color: "#06b6d4",
                  },
                  {
                     label: "Admins",
                     value: stats?.users.admins ?? 0,
                     color: "#f59e0b",
                  },
               ].map(({ label, value, color }) => (
                  <div
                     key={label}
                     style={{ ...pill, borderColor: `${color}40`, color }}
                  >
                     <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                        {value}
                     </span>
                     <span
                        style={{
                           fontSize: "0.75rem",
                           color: "rgba(255,255,255,0.5)",
                        }}
                     >
                        {label}
                     </span>
                  </div>
               ))}
            </div>
         </section>
      </div>
   );
}

const page: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "1.5rem",
};
const grid4: React.CSSProperties = {
   display: "grid",
   gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
   gap: "1rem",
};
const grid3: React.CSSProperties = {
   display: "grid",
   gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
   gap: "1rem",
};
const card: React.CSSProperties = {
   background: "rgba(255,255,255,0.04)",
   border: "1px solid rgba(255,255,255,0.08)",
   borderRadius: "0.875rem",
   padding: "1.25rem",
};
const section: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "0.75rem",
};
const sectionTitle: React.CSSProperties = {
   fontSize: "0.9rem",
   fontWeight: 700,
   color: "#fff",
   margin: 0,
};
const liveCard: React.CSSProperties = {
   background: "rgba(34,197,94,0.06)",
   border: "1px solid rgba(34,197,94,0.2)",
   borderRadius: "0.75rem",
   padding: "1rem",
};
const liveDot: React.CSSProperties = {
   width: 8,
   height: 8,
   borderRadius: "50%",
   background: "#22c55e",
   boxShadow: "0 0 8px #22c55e",
   flexShrink: 0,
};
const emptyState: React.CSSProperties = {
   color: "rgba(255,255,255,0.3)",
   fontSize: "0.875rem",
   padding: "1.5rem",
   textAlign: "center",
   background: "rgba(255,255,255,0.02)",
   borderRadius: "0.75rem",
   border: "1px dashed rgba(255,255,255,0.08)",
};
const pill: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   alignItems: "center",
   gap: "0.2rem",
   background: "rgba(255,255,255,0.04)",
   border: "1px solid",
   borderRadius: "0.75rem",
   padding: "0.875rem 1.5rem",
   minWidth: 110,
};
const loader: React.CSSProperties = {
   color: "rgba(255,255,255,0.4)",
   textAlign: "center",
   paddingTop: "3rem",
};
