"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import ProtectedRoute from "../../components/ProtectedRoute";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { getInitials } from "../../utils/helpers";

const ROLE_META = {
   performer: {
      label: "Performer",
      color: "#e879f9",
      bg: "rgba(232,121,249,0.12)",
   },
   audience: {
      label: "Audience",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.12)",
   },
};

/* sub-components  */

function StatCard({ icon, label, value }) {
   return (
      <div
         style={{
            flex: "1 1 130px",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            transition: "border-color 0.2s, transform 0.2s",
         }}
         onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.transform = "translateY(-2px)";
         }}
         onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-subtle)";
            e.currentTarget.style.transform = "translateY(0)";
         }}
      >
         <span style={{ fontSize: "1.3rem" }}>{icon}</span>
         <span
            style={{
               fontSize: "1.5rem",
               fontWeight: 700,
               color: "var(--color-text-primary)",
               lineHeight: 1,
            }}
         >
            {value}
         </span>
         <span
            style={{
               fontSize: "0.75rem",
               color: "var(--color-text-muted)",
               textTransform: "uppercase",
               letterSpacing: "0.06em",
               fontWeight: 600,
            }}
         >
            {label}
         </span>
      </div>
   );
}

function InfoRow({ label, value, mono }) {
   return (
      <div
         style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 0",
            borderBottom: "1px solid var(--color-border)",
         }}
      >
         <span
            style={{
               fontSize: "0.8rem",
               color: "var(--color-text-muted)",
               fontWeight: 600,
               textTransform: "uppercase",
               letterSpacing: "0.05em",
            }}
         >
            {label}
         </span>
         <span
            style={{
               fontSize: "0.875rem",
               color: "var(--color-text-primary)",
               fontFamily: mono ? "monospace" : "inherit",
               fontWeight: 500,
            }}
         >
            {value || "—"}
         </span>
      </div>
   );
}

/* main page */
const Profile = () => {
   const { user, loading, updateProfile, deleteAccount } = useAuth();

   const [editing, setEditing] = useState(false);
   const [saving, setSaving] = useState(false);
   const [saveError, setSaveError] = useState(null);
   const [saveSuccess, setSaveSuccess] = useState(false);

   const [form, setForm] = useState({ username: "", bio: "" });

   // Delete-account modal state
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [deleteConfirm, setDeleteConfirm] = useState("");
   const [deleting, setDeleting] = useState(false);
   const [deleteError, setDeleteError] = useState(null);

   const openEdit = () => {
      setForm({ username: user?.username || "", bio: user?.bio || "" });
      setSaveError(null);
      setSaveSuccess(false);
      setEditing(true);
   };

   const cancelEdit = () => {
      setEditing(false);
      setSaveError(null);
   };

   const handleSave = async () => {
      setSaving(true);
      setSaveError(null);
      try {
         await updateProfile({ username: form.username, bio: form.bio });
         setSaveSuccess(true);
         setEditing(false);
         setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
         setSaveError(err.message || "Failed to update profile.");
      } finally {
         setSaving(false);
      }
   };

   const openDeleteModal = () => {
      setDeleteConfirm("");
      setDeleteError(null);
      setShowDeleteModal(true);
   };

   const closeDeleteModal = () => {
      if (deleting) return;
      setShowDeleteModal(false);
      setDeleteConfirm("");
      setDeleteError(null);
   };

   const handleDeleteAccount = async () => {
      if (deleteConfirm !== user?.username) return;
      setDeleting(true);
      setDeleteError(null);
      try {
         await deleteAccount();
      } catch (err) {
         setDeleteError(err.message || "Failed to delete account.");
         setDeleting(false);
      }
   };

   if (loading) return <Loader />;

   const roleMeta = ROLE_META[user?.role] || ROLE_META.audience;
   const memberSince = user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
           month: "long",
           year: "numeric",
        })
      : "N/A";

   const canDelete = deleteConfirm === user?.username;

   return (
      <AuthenticatedLayout>
         <ProtectedRoute>
            <main
               className="animate-fade-in"
               style={{
                  minHeight: "calc(100vh - 60px)",
                  padding: "40px 24px 60px",
                  maxWidth: 820,
                  margin: "0 auto",
               }}
            >
               {/* Header */}
               <div style={{ marginBottom: 32 }}>
                  <h1
                     className="gradient-text"
                     style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        margin: 0,
                        letterSpacing: "-0.02em",
                     }}
                  >
                     My Profile
                  </h1>
                  <p
                     style={{
                        marginTop: 4,
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                     }}
                  >
                     Manage your account information and settings.
                  </p>
               </div>

               {user ? (
                  <div
                     style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                     }}
                  >
                     {/* Avatar + Identity card */}
                     <div
                        className="card"
                        style={{
                           padding: "28px 32px",
                           position: "relative",
                           overflow: "hidden",
                        }}
                     >
                        {/* subtle glow accent */}
                        <div
                           aria-hidden
                           style={{
                              position: "absolute",
                              top: -60,
                              right: -60,
                              width: 200,
                              height: 200,
                              borderRadius: "50%",
                              background:
                                 "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
                              pointerEvents: "none",
                           }}
                        />

                        <div
                           style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 24,
                              flexWrap: "wrap",
                           }}
                        >
                           {/* Avatar */}
                           <div
                              style={{
                                 width: 88,
                                 height: 88,
                                 borderRadius: "50%",
                                 background:
                                    "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center",
                                 fontSize: "2rem",
                                 fontWeight: 800,
                                 color: "#fff",
                                 overflow: "hidden",
                                 flexShrink: 0,
                                 boxShadow: "var(--shadow-primary)",
                                 border: "3px solid var(--color-border-subtle)",
                              }}
                           >
                              {user.avatar ? (
                                 <img
                                    src={user.avatar}
                                    alt="avatar"
                                    style={{
                                       width: "100%",
                                       height: "100%",
                                       objectFit: "cover",
                                    }}
                                 />
                              ) : (
                                 getInitials(user.username)
                              )}
                           </div>

                           {/* Name + role + bio */}
                           <div style={{ flex: 1, minWidth: 180 }}>
                              {editing ? (
                                 <input
                                    id="profile-username-input"
                                    className="input-field"
                                    value={form.username}
                                    onChange={(e) =>
                                       setForm((f) => ({
                                          ...f,
                                          username: e.target.value,
                                       }))
                                    }
                                    placeholder="Display name"
                                    style={{
                                       marginBottom: 10,
                                       maxWidth: 320,
                                       fontWeight: 700,
                                    }}
                                 />
                              ) : (
                                 <h2
                                    style={{
                                       margin: "0 0 4px",
                                       fontSize: "1.4rem",
                                       fontWeight: 800,
                                       color: "var(--color-text-primary)",
                                       letterSpacing: "-0.01em",
                                    }}
                                 >
                                    {user.username || "User"}
                                 </h2>
                              )}

                              {/* Role badge */}
                              <span
                                 style={{
                                    display: "inline-block",
                                    padding: "2px 12px",
                                    borderRadius: "var(--radius-full)",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.07em",
                                    textTransform: "uppercase",
                                    color: roleMeta.color,
                                    background: roleMeta.bg,
                                    border: `1px solid ${roleMeta.color}40`,
                                    marginBottom: 12,
                                 }}
                              >
                                 {roleMeta.label}
                              </span>

                              {/* Bio */}
                              {editing ? (
                                 <textarea
                                    id="profile-bio-input"
                                    className="input-field"
                                    rows={3}
                                    value={form.bio}
                                    onChange={(e) =>
                                       setForm((f) => ({
                                          ...f,
                                          bio: e.target.value,
                                       }))
                                    }
                                    placeholder="Write a short bio…"
                                    style={{
                                       resize: "vertical",
                                       maxWidth: 420,
                                       display: "block",
                                    }}
                                 />
                              ) : (
                                 <p
                                    style={{
                                       margin: 0,
                                       fontSize: "0.875rem",
                                       color: user.bio
                                          ? "var(--color-text-secondary)"
                                          : "var(--color-text-muted)",
                                       fontStyle: user.bio
                                          ? "normal"
                                          : "italic",
                                       maxWidth: 420,
                                       lineHeight: 1.6,
                                    }}
                                 >
                                    {user.bio ||
                                       "No bio set yet. Click Edit to add one."}
                                 </p>
                              )}
                           </div>

                           {/* Edit / Save / Cancel actions */}
                           <div
                              style={{
                                 display: "flex",
                                 flexDirection: "column",
                                 gap: 8,
                                 alignItems: "flex-end",
                              }}
                           >
                              {editing ? (
                                 <>
                                    <button
                                       id="profile-save-btn"
                                       className="btn-primary"
                                       onClick={handleSave}
                                       disabled={saving}
                                       style={{ minWidth: 100 }}
                                    >
                                       {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button
                                       id="profile-cancel-btn"
                                       className="btn-ghost"
                                       onClick={cancelEdit}
                                       disabled={saving}
                                       style={{ minWidth: 100 }}
                                    >
                                       Cancel
                                    </button>
                                 </>
                              ) : (
                                 <button
                                    id="profile-edit-btn"
                                    className="btn-ghost"
                                    onClick={openEdit}
                                    style={{
                                       display: "flex",
                                       alignItems: "center",
                                       gap: 6,
                                    }}
                                 >
                                    <svg
                                       xmlns="http://www.w3.org/2000/svg"
                                       width="14"
                                       height="14"
                                       viewBox="0 0 24 24"
                                       fill="currentColor"
                                    >
                                       <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                    Edit Profile
                                 </button>
                              )}
                           </div>
                        </div>

                        {/* Feedback banners */}
                        {saveError && (
                           <div
                              style={{
                                 marginTop: 16,
                                 padding: "10px 16px",
                                 borderRadius: "var(--radius-md)",
                                 background: "rgba(239,68,68,0.1)",
                                 border: "1px solid rgba(239,68,68,0.3)",
                                 color: "var(--color-error)",
                                 fontSize: "0.85rem",
                              }}
                           >
                              ⚠ {saveError}
                           </div>
                        )}
                        {saveSuccess && (
                           <div
                              className="animate-slide-up"
                              style={{
                                 marginTop: 16,
                                 padding: "10px 16px",
                                 borderRadius: "var(--radius-md)",
                                 background: "rgba(34,197,94,0.1)",
                                 border: "1px solid rgba(34,197,94,0.3)",
                                 color: "var(--color-success)",
                                 fontSize: "0.85rem",
                              }}
                           >
                              ✓ Profile updated successfully!
                           </div>
                        )}
                     </div>

                     {/* Stats row */}
                     <div
                        style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
                     >
                        <StatCard
                           icon="🎤"
                           label="Performances"
                           value={user.performanceCount ?? 0}
                        />
                        <StatCard
                           icon="⚡"
                           label="Reactions"
                           value={user.reactionCount ?? 0}
                        />
                        <StatCard
                           icon="💬"
                           label="Comments"
                           value={user.commentCount ?? 0}
                        />
                        <StatCard
                           icon="🏆"
                           label="Best Rank"
                           value={user.bestRank ? `#${user.bestRank}` : "—"}
                        />
                     </div>

                     {/* Account Details */}
                     <div className="card" style={{ padding: "24px 28px" }}>
                        <h3
                           style={{
                              margin: "0 0 4px",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                           }}
                        >
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="var(--color-primary-light)"
                           >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                           </svg>
                           Account Details
                        </h3>
                        <p
                           style={{
                              margin: "0 0 16px",
                              fontSize: "0.78rem",
                              color: "var(--color-text-muted)",
                           }}
                        >
                           Your registered account information.
                        </p>

                        <div>
                           <InfoRow label="Username" value={user.username} />
                           <InfoRow label="Email" value={user.email} mono />
                           <InfoRow label="Role" value={roleMeta.label} />
                           <InfoRow label="Member Since" value={memberSince} />
                           <InfoRow
                              label="Account Status"
                              value={
                                 <span
                                    style={{
                                       display: "inline-flex",
                                       alignItems: "center",
                                       gap: 6,
                                       color: "var(--color-success)",
                                       fontWeight: 600,
                                       fontSize: "0.875rem",
                                    }}
                                 >
                                    <span
                                       style={{
                                          width: 7,
                                          height: 7,
                                          borderRadius: "50%",
                                          background: "var(--color-success)",
                                          display: "inline-block",
                                       }}
                                    />
                                    Active
                                 </span>
                              }
                           />
                        </div>
                     </div>

                     {/* Delete Account */}
                     <div
                        style={{
                           background: "rgba(239,68,68,0.04)",
                           border: "1px solid rgba(239,68,68,0.2)",
                           borderRadius: "var(--radius-lg)",
                           padding: "20px 28px",
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "space-between",
                           flexWrap: "wrap",
                           gap: 16,
                        }}
                     >
                        <div>
                           <p
                              style={{
                                 margin: 0,
                                 fontWeight: 700,
                                 fontSize: "0.875rem",
                                 color: "var(--color-error)",
                              }}
                           >
                              Danger Zone
                           </p>
                           <p
                              style={{
                                 margin: "2px 0 0",
                                 fontSize: "0.8rem",
                                 color: "var(--color-text-muted)",
                              }}
                           >
                              Irreversible actions — proceed with caution.
                           </p>
                        </div>
                        <button
                           id="profile-delete-btn"
                           onClick={openDeleteModal}
                           style={{
                              background: "transparent",
                              border: "1px solid rgba(239,68,68,0.4)",
                              borderRadius: "var(--radius-md)",
                              padding: "8px 18px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "var(--color-error)",
                              cursor: "pointer",
                              transition: "background 0.2s, border-color 0.2s",
                           }}
                           onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                 "rgba(239,68,68,0.12)";
                              e.currentTarget.style.borderColor =
                                 "var(--color-error)";
                           }}
                           onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor =
                                 "rgba(239,68,68,0.4)";
                           }}
                        >
                           Delete Account
                        </button>
                     </div>
                  </div>
               ) : (
                  <div
                     className="card"
                     style={{
                        padding: "48px 32px",
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                     }}
                  >
                     <p style={{ margin: 0, fontSize: "0.95rem" }}>
                        Please log in to view your profile.
                     </p>
                  </div>
               )}
            </main>

            {/* ── Delete-account confirmation modal ── */}
            {showDeleteModal && (
               <div
                  onClick={closeDeleteModal}
                  style={{
                     position: "fixed",
                     inset: 0,
                     zIndex: 1000,
                     background: "rgba(0,0,0,0.65)",
                     backdropFilter: "blur(6px)",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     padding: "24px",
                     animation: "fadeIn 0.18s ease",
                  }}
               >
                  <div
                     onClick={(e) => e.stopPropagation()}
                     style={{
                        background: "var(--color-bg-elevated)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        borderRadius: "var(--radius-lg)",
                        padding: "32px 36px",
                        maxWidth: 460,
                        width: "100%",
                        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                        animation: "slideUp 0.22s ease",
                     }}
                  >
                     {/* Modal header */}
                     <div
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: 12,
                           marginBottom: 8,
                        }}
                     >
                        <div
                           style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: "rgba(239,68,68,0.15)",
                              border: "1px solid rgba(239,68,68,0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                           }}
                        >
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="var(--color-error)"
                           >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                           </svg>
                        </div>
                        <div>
                           <p
                              style={{
                                 margin: 0,
                                 fontWeight: 800,
                                 fontSize: "1rem",
                                 color: "var(--color-error)",
                                 letterSpacing: "-0.01em",
                              }}
                           >
                              Delete Account
                           </p>
                           <p
                              style={{
                                 margin: 0,
                                 fontSize: "0.75rem",
                                 color: "var(--color-text-muted)",
                              }}
                           >
                              This action cannot be undone.
                           </p>
                        </div>
                     </div>

                     {/* Warning body */}
                     <div
                        style={{
                           margin: "20px 0",
                           padding: "14px 16px",
                           borderRadius: "var(--radius-md)",
                           background: "rgba(239,68,68,0.07)",
                           border: "1px solid rgba(239,68,68,0.2)",
                           fontSize: "0.82rem",
                           color: "var(--color-text-secondary)",
                           lineHeight: 1.6,
                        }}
                     >
                        Deleting your account will permanently remove your
                        profile, performances, comments, and all associated
                        data. This{" "}
                        <strong style={{ color: "var(--color-error)" }}>
                           cannot be recovered
                        </strong>
                        .
                     </div>

                     {/* Confirmation input */}
                     <label
                        style={{
                           display: "block",
                           fontSize: "0.78rem",
                           fontWeight: 600,
                           color: "var(--color-text-muted)",
                           marginBottom: 8,
                           letterSpacing: "0.04em",
                        }}
                     >
                        Type{" "}
                        <span
                           style={{
                              fontFamily: "monospace",
                              color: "var(--color-text-primary)",
                              background:
                                 "var(--color-bg-surface, rgba(255,255,255,0.06))",
                              padding: "1px 6px",
                              borderRadius: 4,
                           }}
                        >
                           {user?.username}
                        </span>{" "}
                        to confirm:
                     </label>
                     <input
                        id="delete-confirm-input"
                        className="input-field"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={user?.username}
                        autoComplete="off"
                        disabled={deleting}
                        style={{ marginBottom: 0 }}
                     />

                     {/* Error */}
                     {deleteError && (
                        <div
                           style={{
                              marginTop: 12,
                              padding: "10px 14px",
                              borderRadius: "var(--radius-md)",
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid rgba(239,68,68,0.3)",
                              color: "var(--color-error)",
                              fontSize: "0.82rem",
                           }}
                        >
                           ⚠ {deleteError}
                        </div>
                     )}

                     {/* Actions */}
                     <div
                        style={{
                           display: "flex",
                           gap: 10,
                           marginTop: 20,
                           justifyContent: "flex-end",
                        }}
                     >
                        <button
                           id="delete-modal-cancel-btn"
                           className="btn-ghost"
                           onClick={closeDeleteModal}
                           disabled={deleting}
                           style={{ minWidth: 90 }}
                        >
                           Cancel
                        </button>
                        <button
                           id="delete-modal-confirm-btn"
                           disabled={!canDelete || deleting}
                           onClick={handleDeleteAccount}
                           style={{
                              minWidth: 140,
                              padding: "9px 20px",
                              borderRadius: "var(--radius-md)",
                              border: "none",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              cursor:
                                 canDelete && !deleting
                                    ? "pointer"
                                    : "not-allowed",
                              background: canDelete
                                 ? "rgba(239,68,68,0.85)"
                                 : "rgba(239,68,68,0.25)",
                              color: canDelete ? "#fff" : "rgba(239,68,68,0.5)",
                              transition: "background 0.2s, color 0.2s",
                           }}
                        >
                           {deleting ? "Deleting…" : "Delete my account"}
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </ProtectedRoute>
      </AuthenticatedLayout>
   );
};

export default Profile;
