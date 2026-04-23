"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
   {
      value: "audience",
      label: "🎧 Audience",
      desc: "Watch and react to performances",
   },
   {
      value: "performer",
      label: "🎤 Performer",
      desc: "Go live and perform for the crowd",
   },
];

export default function RegisterPage() {
   const { register } = useAuth();
   const router = useRouter();

   const [form, setForm] = useState({
      username: "",
      email: "",
      password: "",
      role: "audience",
   });
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleChange = (e) =>
      setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      if (form.password.length < 6) {
         setError("Password must be at least 6 characters.");
         return;
      }
      setLoading(true);
      try {
         await register(form);
         router.push("/home");
      } catch (err) {
         setError(err.message || "Registration failed. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div
         style={{
            minHeight: "100vh",
            background: "var(--color-bg-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 20px",
         }}
      >
         {/* Background glow */}
         <div
            aria-hidden
            style={{
               position: "fixed",
               top: "15%",
               left: "60%",
               width: 400,
               height: 400,
               borderRadius: "50%",
               background:
                  "radial-gradient(ellipse, rgba(232,121,249,0.12) 0%, transparent 70%)",
               pointerEvents: "none",
            }}
         />

         <div
            style={{
               width: "100%",
               maxWidth: 460,
               position: "relative",
               zIndex: 1,
            }}
         >
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
               <Link
                  href="/"
                  style={{
                     textDecoration: "none",
                     display: "inline-flex",
                     alignItems: "center",
                     gap: 10,
                  }}
               >
                  <span style={{ fontSize: "2rem" }}>🎤</span>
                  <span
                     style={{
                        fontWeight: 900,
                        fontSize: "1.8rem",
                        background: "linear-gradient(135deg, #a78bfa, #e879f9)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        letterSpacing: "-0.03em",
                     }}
                  >
                     MicDrop
                  </span>
               </Link>
               <p
                  style={{
                     margin: "10px 0 0",
                     color: "var(--color-text-muted)",
                     fontSize: "0.9rem",
                  }}
               >
                  Join the stage — it&apos;s free 🌟
               </p>
            </div>

            {/* Card */}
            <div className="card" style={{ padding: "32px 28px" }}>
               <h2
                  style={{
                     margin: "0 0 24px",
                     fontSize: "1.3rem",
                     fontWeight: 700,
                  }}
               >
                  Create Account
               </h2>

               <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
               >
                  {/* Role selector */}
                  <div>
                     <label
                        style={{
                           display: "block",
                           fontSize: "0.8rem",
                           fontWeight: 600,
                           color: "var(--color-text-secondary)",
                           marginBottom: 8,
                        }}
                     >
                        I want to…
                     </label>
                     <div
                        style={{
                           display: "grid",
                           gridTemplateColumns: "1fr 1fr",
                           gap: 8,
                        }}
                     >
                        {ROLES.map((r) => (
                           <button
                              key={r.value}
                              type="button"
                              onClick={() =>
                                 setForm((f) => ({ ...f, role: r.value }))
                              }
                              style={{
                                 padding: "12px 10px",
                                 borderRadius: 10,
                                 border: "1px solid",
                                 cursor: "pointer",
                                 textAlign: "left",
                                 transition: "all 0.15s",
                                 borderColor:
                                    form.role === r.value
                                       ? "var(--color-primary)"
                                       : "var(--color-border)",
                                 background:
                                    form.role === r.value
                                       ? "rgba(124,58,237,0.12)"
                                       : "var(--color-bg-elevated)",
                              }}
                           >
                              <div
                                 style={{
                                    fontWeight: 700,
                                    fontSize: "0.88rem",
                                    color:
                                       form.role === r.value
                                          ? "var(--color-primary-light)"
                                          : "var(--color-text-primary)",
                                    marginBottom: 3,
                                 }}
                              >
                                 {r.label}
                              </div>
                              <div
                                 style={{
                                    fontSize: "0.72rem",
                                    color: "var(--color-text-muted)",
                                    lineHeight: 1.4,
                                 }}
                              >
                                 {r.desc}
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>

                  <div>
                     <label
                        htmlFor="reg-username"
                        style={{
                           display: "block",
                           fontSize: "0.8rem",
                           fontWeight: 600,
                           color: "var(--color-text-secondary)",
                           marginBottom: 6,
                        }}
                     >
                        Username
                     </label>
                     <input
                        id="reg-username"
                        className="input-field"
                        type="text"
                        name="username"
                        placeholder="your_stage_name"
                        value={form.username}
                        onChange={handleChange}
                        minLength={3}
                        maxLength={20}
                        required
                        autoComplete="username"
                     />
                  </div>

                  <div>
                     <label
                        htmlFor="reg-email"
                        style={{
                           display: "block",
                           fontSize: "0.8rem",
                           fontWeight: 600,
                           color: "var(--color-text-secondary)",
                           marginBottom: 6,
                        }}
                     >
                        Email
                     </label>
                     <input
                        id="reg-email"
                        className="input-field"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                     />
                  </div>

                  <div>
                     <label
                        htmlFor="reg-password"
                        style={{
                           display: "block",
                           fontSize: "0.8rem",
                           fontWeight: 600,
                           color: "var(--color-text-secondary)",
                           marginBottom: 6,
                        }}
                     >
                        Password
                     </label>
                     <input
                        id="reg-password"
                        className="input-field"
                        type="password"
                        name="password"
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={handleChange}
                        minLength={6}
                        required
                        autoComplete="new-password"
                     />
                  </div>

                  {error && (
                     <div
                        style={{
                           padding: "10px 14px",
                           background: "rgba(239,68,68,0.1)",
                           border: "1px solid rgba(239,68,68,0.25)",
                           borderRadius: 8,
                           color: "var(--color-error)",
                           fontSize: "0.83rem",
                        }}
                     >
                        ⚠️ {error}
                     </div>
                  )}

                  <button
                     id="register-submit-btn"
                     className="btn-primary"
                     type="submit"
                     disabled={loading}
                     style={{
                        marginTop: 4,
                        padding: "10px",
                        fontSize: "0.95rem",
                     }}
                  >
                     {loading ? "Creating account…" : "Create Account →"}
                  </button>
               </form>

               <div
                  style={{
                     marginTop: 20,
                     paddingTop: 16,
                     borderTop: "1px solid var(--color-border)",
                     textAlign: "center",
                     fontSize: "0.83rem",
                     color: "var(--color-text-muted)",
                  }}
               >
                  Already have an account?{" "}
                  <Link
                     href="/login"
                     style={{
                        color: "var(--color-primary-light)",
                        fontWeight: 600,
                        textDecoration: "none",
                     }}
                  >
                     Sign in
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
}
