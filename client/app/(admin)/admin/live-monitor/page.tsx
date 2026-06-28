"use client";

import { useAdminSocket } from "../../../../hooks/useAdminSocket";

const EVENT_COLORS: Record<string, string> = {
   user_connected: "#22c55e",
   user_disconnected: "#64748b",
   user_banned: "#ef4444",
   user_kicked: "#f59e0b",
   performance_started: "#7c3aed",
   performance_ended: "#06b6d4",
};

export default function LiveMonitorPage() {
   const {
      connected,
      liveRooms,
      recentEvents,
      kickUser,
      forceEndPerformance,
      refreshLiveRooms,
   } = useAdminSocket();

   return (
      <div style={pg}>
         {/* Connection status */}
         <div style={connBar}>
            <div
               style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
               <div
                  style={{
                     width: 10,
                     height: 10,
                     borderRadius: "50%",
                     background: connected ? "#22c55e" : "#ef4444",
                     boxShadow: connected
                        ? "0 0 8px #22c55e"
                        : "0 0 8px #ef4444",
                  }}
               />
               <span
                  style={{
                     color: connected ? "#86efac" : "#fca5a5",
                     fontWeight: 600,
                     fontSize: "0.85rem",
                  }}
               >
                  {connected ? "Real-time connection active" : "Connecting…"}
               </span>
            </div>
            <button onClick={refreshLiveRooms} style={refreshBtn}>
               Refresh Rooms
            </button>
         </div>

         <div style={splitGrid}>
            {/* Live rooms */}
            <section>
               <h2 style={sectionH}>Active Live Rooms ({liveRooms.length})</h2>
               <div style={roomsGrid}>
                  {liveRooms.length === 0 ? (
                     <div style={empty}>No live performances at the moment</div>
                  ) : (
                     liveRooms.map((room) => (
                        <div key={room.performanceId} style={roomCard}>
                           <div style={roomHeader}>
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
                                       fontWeight: 700,
                                       color: "#fff",
                                       fontSize: "0.875rem",
                                    }}
                                 >
                                    LIVE
                                 </span>
                              </div>
                              <span
                                 style={{
                                    fontSize: "0.75rem",
                                    color: "rgba(255,255,255,0.35)",
                                    fontFamily: "monospace",
                                 }}
                              >
                                 {room.performanceId.slice(-8)}
                              </span>
                           </div>
                           <div style={viewerCount}>
                              <span
                                 style={{
                                    fontSize: "1.75rem",
                                    fontWeight: 800,
                                    color: "#fff",
                                 }}
                              >
                                 {room.viewers}
                              </span>
                              <span
                                 style={{
                                    fontSize: "0.8rem",
                                    color: "rgba(255,255,255,0.4)",
                                 }}
                              >
                                 viewers
                              </span>
                           </div>
                           <div style={roomActions}>
                              <button
                                 onClick={() => {
                                    if (confirm("Force-end this performance?"))
                                       forceEndPerformance(room.performanceId);
                                 }}
                                 style={forceEndBtn}
                              >
                                 Force End
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </section>

            {/* Event feed */}
            <section>
               <h2 style={sectionH}>Live Event Feed ({recentEvents.length})</h2>
               <div style={feed}>
                  {recentEvents.length === 0 ? (
                     <div style={empty}>Waiting for events…</div>
                  ) : (
                     recentEvents.map((evt, i) => (
                        <div
                           key={i}
                           style={{
                              ...eventRow,
                              borderLeftColor:
                                 EVENT_COLORS[evt.type] ?? "#64748b",
                           }}
                        >
                           <div
                              style={{
                                 display: "flex",
                                 alignItems: "center",
                                 gap: "0.5rem",
                              }}
                           >
                              <span
                                 style={{
                                    fontWeight: 600,
                                    color: EVENT_COLORS[evt.type] ?? "#fff",
                                    fontSize: "0.78rem",
                                 }}
                              >
                                 {evt.type.replace(/_/g, " ").toUpperCase()}
                              </span>
                              <span
                                 style={{
                                    marginLeft: "auto",
                                    fontSize: "0.7rem",
                                    color: "rgba(255,255,255,0.2)",
                                 }}
                              >
                                 {new Date(evt.at).toLocaleTimeString()}
                              </span>
                           </div>
                           <pre
                              style={{
                                 fontSize: "0.7rem",
                                 color: "rgba(255,255,255,0.4)",
                                 margin: "0.25rem 0 0",
                                 overflow: "hidden",
                                 textOverflow: "ellipsis",
                                 whiteSpace: "pre-wrap",
                              }}
                           >
                              {JSON.stringify(evt.payload, null, 2).slice(
                                 0,
                                 200,
                              )}
                           </pre>
                        </div>
                     ))
                  )}
               </div>
            </section>
         </div>
      </div>
   );
}

const pg: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "1.25rem",
};
const connBar: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   justifyContent: "space-between",
   background: "rgba(255,255,255,0.03)",
   border: "1px solid rgba(255,255,255,0.07)",
   borderRadius: "0.75rem",
   padding: "0.75rem 1rem",
};
const refreshBtn: React.CSSProperties = {
   background: "rgba(124,58,237,0.15)",
   border: "1px solid rgba(124,58,237,0.3)",
   borderRadius: "0.4rem",
   color: "#a78bfa",
   padding: "0.35rem 0.75rem",
   fontSize: "0.78rem",
   fontWeight: 600,
   cursor: "pointer",
};
const splitGrid: React.CSSProperties = {
   display: "grid",
   gridTemplateColumns: "1fr 1fr",
   gap: "1.25rem",
};
const sectionH: React.CSSProperties = {
   fontSize: "0.875rem",
   fontWeight: 700,
   color: "#fff",
   margin: "0 0 0.75rem",
};
const roomsGrid: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "0.75rem",
};
const roomCard: React.CSSProperties = {
   background: "rgba(34,197,94,0.05)",
   border: "1px solid rgba(34,197,94,0.2)",
   borderRadius: "0.875rem",
   padding: "1rem",
};
const roomHeader: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   justifyContent: "space-between",
   marginBottom: "0.75rem",
};
const liveDot: React.CSSProperties = {
   width: 10,
   height: 10,
   borderRadius: "50%",
   background: "#22c55e",
   boxShadow: "0 0 8px #22c55e",
};
const viewerCount: React.CSSProperties = {
   display: "flex",
   alignItems: "center",
   gap: "0.5rem",
   marginBottom: "0.75rem",
};
const roomActions: React.CSSProperties = { display: "flex", gap: "0.5rem" };
const forceEndBtn: React.CSSProperties = {
   background: "rgba(239,68,68,0.12)",
   border: "1px solid rgba(239,68,68,0.35)",
   borderRadius: "0.4rem",
   color: "#fca5a5",
   padding: "0.35rem 0.75rem",
   fontSize: "0.78rem",
   fontWeight: 600,
   cursor: "pointer",
};
const feed: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "0.4rem",
   maxHeight: 500,
   overflowY: "auto",
};
const eventRow: React.CSSProperties = {
   background: "rgba(255,255,255,0.02)",
   border: "1px solid rgba(255,255,255,0.06)",
   borderLeft: "3px solid",
   borderRadius: "0.5rem",
   padding: "0.6rem 0.75rem",
};
const empty: React.CSSProperties = {
   color: "rgba(255,255,255,0.2)",
   fontSize: "0.8rem",
   textAlign: "center",
   padding: "2rem",
   background: "rgba(255,255,255,0.02)",
   borderRadius: "0.75rem",
   border: "1px dashed rgba(255,255,255,0.07)",
};
