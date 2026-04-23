"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
   const { login } = useAuth();
   const router = useRouter();

   const [form, setForm] = useState({ email: "", password: "" });
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleChange = (e) =>
      setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
         await login(form);
         router.push("/home");
      } catch (err) {
         setError(err.message || "Login failed. Please try again.");
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
               top: "20%",
               left: "50%",
               transform: "translateX(-50%)",
               width: 500,
               height: 500,
               borderRadius: "50%",
               background:
                  "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)",
               pointerEvents: "none",
            }}
         />

         <div
            style={{
               width: "100%",
               maxWidth: 420,
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
                  Welcome back, performer 🎶
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
                  Sign In
               </h2>

               <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
               >
                  <div>
                     <label
                        htmlFor="login-email"
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
                        id="login-email"
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
                        htmlFor="login-password"
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
                        id="login-password"
                        className="input-field"
                        type="password"
                        name="password"
                        placeholder="Your password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
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
                     id="login-submit-btn"
                     className="btn-primary"
                     type="submit"
                     disabled={loading}
                     style={{
                        marginTop: 4,
                        padding: "10px",
                        fontSize: "0.95rem",
                     }}
                  >
                     {loading ? "Signing in…" : "Sign In →"}
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
                  Don&apos;t have an account?{" "}
                  <Link
                     href="/register"
                     style={{
                        color: "var(--color-primary-light)",
                        fontWeight: 600,
                        textDecoration: "none",
                     }}
                  >
                     Sign up
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
}
