"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../../components/Navbar";
import PerformanceCard from "../../components/PerformanceCard";
import {
   getPerformances,
   createPerformance,
} from "../../services/performanceApi";
import { useAuth } from "../../context/AuthContext";
import useSocket from "../../hooks/useSocket";

/**
 * Home — performance feed page.
 * Shows LIVE and ENDED performances, auto-updates via socket events.
 * Performers can create new performances from here.
 */
export default function HomePage() {
   const { user, token, isAuthenticated } = useAuth();
   const [performances, setPerformances] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [filter, setFilter] = useState("ALL"); // "ALL" | "LIVE" | "ENDED"

   // Create-performance modal state
   const [showCreate, setShowCreate] = useState(false);
   const [createForm, setCreateForm] = useState({
      title: "",
      description: "",
      type: "LIVE",
   });
   const [createLoading, setCreateLoading] = useState(false);
   const [createError, setCreateError] = useState("");

   const isPerformerOrAdmin =
      user?.role === "performer" || user?.role === "admin";

   // Fetch performances
   const fetchPerformances = useCallback(async () => {
      try {
         const data = await getPerformances();
         setPerformances(data);
      } catch {
         setError("Failed to load performances.");
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchPerformances();
   }, [fetchPerformances]);

   // Socket: react to global performance events
   const handlePerformanceLive = useCallback((perf) => {
      setPerformances((prev) => {
         const exists = prev.find((p) => p._id === perf._id);
         if (exists) return prev.map((p) => (p._id === perf._id ? perf : p));
         return [perf, ...prev];
      });
   }, []);

   const handlePerformanceEnded = useCallback((perf) => {
      setPerformances((prev) =>
         prev.map((p) => (p._id === perf._id ? perf : p)),
      );
   }, []);

   useSocket({
      token,
      onPerformanceLive: handlePerformanceLive,
      onPerformanceEnded: handlePerformanceEnded,
   });

   // Filtered performances
   const filtered = performances.filter((p) => {
      if (filter === "ALL") return true;
      if (filter === "LIVE") return p.status === "LIVE";
      if (filter === "ENDED") return p.status === "ENDED";
      return true;
   });

   const liveCount = performances.filter((p) => p.status === "LIVE").length;

   // Create performance
   const handleCreate = async (e) => {
      e.preventDefault();
      if (!createForm.title.trim()) return;
      setCreateLoading(true);
      setCreateError("");
      try {
         const perf = await createPerformance({
            title: createForm.title.trim(),
            description: createForm.description.trim(),
            type: createForm.type,
         });
         setPerformances((prev) => [perf, ...prev]);
         setShowCreate(false);
         setCreateForm({ title: "", description: "", type: "LIVE" });
      } catch (err) {
         setCreateError(err.message || "Failed to create performance.");
      } finally {
         setCreateLoading(false);
      }
   };

   return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}>
         <Navbar />

         <main
            style={{
               maxWidth: 900,
               margin: "0 auto",
               padding: "32px 20px 60px",
            }}
         >
            {/* Hero header */}
            <div style={{ marginBottom: 32 }}>
               <div
                  style={{
                     display: "flex",
                     alignItems: "flex-start",
                     justifyContent: "space-between",
                     gap: 16,
                     flexWrap: "wrap",
                  }}
               >
                  <div>
                     <h1
                        style={{
                           margin: 0,
                           fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                           fontWeight: 800,
                           lineHeight: 1.2,
                           background:
                              "linear-gradient(135deg, #f1f5f9 30%, #a78bfa)",
                           WebkitBackgroundClip: "text",
                           WebkitTextFillColor: "transparent",
                           backgroundClip: "text",
                        }}
                     >
                        Live Performances
                     </h1>
                     <p
                        style={{
                           margin: "6px 0 0",
                           color: "var(--color-text-secondary)",
                           fontSize: "0.9rem",
                        }}
                     >
                        {liveCount > 0 ? (
                           <>
                              <span
                                 style={{
                                    color: "var(--color-live)",
                                    fontWeight: 700,
                                 }}
                              >
                                 ● {liveCount} LIVE
                              </span>{" "}
                              right now — join the crowd!
                           </>
                        ) : (
                           "No live performances right now. Check back soon."
                        )}
                     </p>
                  </div>

                  {isPerformerOrAdmin && (
                     <button
                        className="btn-primary"
                        onClick={() => setShowCreate(true)}
                        style={{ flexShrink: 0 }}
                     >
                        + New Performance
                     </button>
                  )}
               </div>

               {/* Filter tabs */}
               <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
                  {["ALL", "LIVE", "ENDED"].map((f) => (
                     <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                           padding: "5px 18px",
                           borderRadius: 99,
                           border: "1px solid",
                           fontSize: "0.8rem",
                           fontWeight: 600,
                           cursor: "pointer",
                           transition: "all 0.15s",
                           borderColor:
                              filter === f
                                 ? "var(--color-primary)"
                                 : "var(--color-border)",
                           background:
                              filter === f
                                 ? "var(--color-primary)"
                                 : "transparent",
                           color:
                              filter === f
                                 ? "#fff"
                                 : "var(--color-text-secondary)",
                        }}
                     >
                        {f === "LIVE"
                           ? "LIVE"
                           : f === "ENDED"
                             ? "Ended"
                             : "All"}
                     </button>
                  ))}
               </div>
            </div>

            {/* ── Content ─────────────────────────────────────────────────────── */}
            {loading && (
               <div
                  style={{
                     display: "grid",
                     gridTemplateColumns:
                        "repeat(auto-fill, minmax(340px, 1fr))",
                     gap: 16,
                  }}
               >
                  {[1, 2, 3, 4].map((i) => (
                     <div
                        key={i}
                        className="skeleton"
                        style={{ height: 180, borderRadius: 16 }}
                     />
                  ))}
               </div>
            )}

            {!loading && error && (
               <div
                  style={{
                     padding: "20px 24px",
                     background: "rgba(239,68,68,0.08)",
                     border: "1px solid rgba(239,68,68,0.2)",
                     borderRadius: 12,
                     color: "var(--color-error)",
                     fontSize: "0.9rem",
                  }}
               >
                  {error}
               </div>
            )}

            {!loading && !error && filtered.length === 0 && (
               <div style={{ textAlign: "center", padding: "64px 0" }}>
                  <p style={{ fontSize: "3rem", margin: "0 0 12px" }}>🎤</p>
                  <p
                     style={{
                        color: "var(--color-text-muted)",
                        fontSize: "1rem",
                     }}
                  >
                     {filter === "LIVE"
                        ? "No live performances right now."
                        : "No performances found."}
                  </p>
               </div>
            )}

            {!loading && filtered.length > 0 && (
               <div
                  style={{
                     display: "grid",
                     gridTemplateColumns:
                        "repeat(auto-fill, minmax(340px, 1fr))",
                     gap: 16,
                  }}
               >
                  {filtered.map((perf) => (
                     <PerformanceCard key={perf._id} performance={perf} />
                  ))}
               </div>
            )}
         </main>

         {/* Create Performance Modal */}
         {showCreate && (
            <div
               style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.7)",
                  backdropFilter: "blur(4px)",
                  zIndex: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
               }}
               onClick={() => setShowCreate(false)}
            >
               <div
                  className="card animate-slide-up"
                  style={{ width: "100%", maxWidth: 480 }}
                  onClick={(e) => e.stopPropagation()}
               >
                  <div
                     style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                     }}
                  >
                     <h2
                        style={{
                           margin: 0,
                           fontSize: "1.1rem",
                           fontWeight: 700,
                        }}
                     >
                        New Performance
                     </h2>
                     <button
                        onClick={() => setShowCreate(false)}
                        style={{
                           background: "none",
                           border: "none",
                           cursor: "pointer",
                           color: "var(--color-text-muted)",
                           fontSize: "1.2rem",
                           lineHeight: 1,
                        }}
                     >
                        ✕
                     </button>
                  </div>

                  <form
                     onSubmit={handleCreate}
                     style={{
                        padding: "20px 24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                     }}
                  >
                     <div>
                        <label
                           style={{
                              display: "block",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                              marginBottom: 6,
                           }}
                        >
                           Title *
                        </label>
                        <input
                           className="input-field"
                           placeholder="What's your performance about?"
                           value={createForm.title}
                           onChange={(e) =>
                              setCreateForm((f) => ({
                                 ...f,
                                 title: e.target.value,
                              }))
                           }
                           maxLength={120}
                           required
                        />
                     </div>

                     <div>
                        <label
                           style={{
                              display: "block",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                              marginBottom: 6,
                           }}
                        >
                           Description
                        </label>
                        <textarea
                           className="input-field"
                           placeholder="Optional — tell the audience what to expect…"
                           value={createForm.description}
                           onChange={(e) =>
                              setCreateForm((f) => ({
                                 ...f,
                                 description: e.target.value,
                              }))
                           }
                           maxLength={500}
                           rows={3}
                           style={{ resize: "vertical", lineHeight: 1.6 }}
                        />
                     </div>

                     <div>
                        <label
                           style={{
                              display: "block",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                              marginBottom: 6,
                           }}
                        >
                           Type
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                           {["LIVE", "RECORDED"].map((t) => (
                              <button
                                 key={t}
                                 type="button"
                                 onClick={() =>
                                    setCreateForm((f) => ({ ...f, type: t }))
                                 }
                                 style={{
                                    flex: 1,
                                    padding: "8px 0",
                                    borderRadius: 8,
                                    border: "1px solid",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    borderColor:
                                       createForm.type === t
                                          ? "var(--color-primary)"
                                          : "var(--color-border)",
                                    background:
                                       createForm.type === t
                                          ? "rgba(124,58,237,0.15)"
                                          : "transparent",
                                    color:
                                       createForm.type === t
                                          ? "var(--color-primary-light)"
                                          : "var(--color-text-secondary)",
                                 }}
                              >
                                 {t === "LIVE" ? "Live" : "Recorded"}
                              </button>
                           ))}
                        </div>
                     </div>

                     {createError && (
                        <p
                           style={{
                              margin: 0,
                              fontSize: "0.8rem",
                              color: "var(--color-error)",
                           }}
                        >
                           {createError}
                        </p>
                     )}

                     <button
                        className="btn-primary"
                        type="submit"
                        disabled={createLoading}
                        style={{ marginTop: 4 }}
                     >
                        {createLoading ? "Creating…" : "Create Performance"}
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
