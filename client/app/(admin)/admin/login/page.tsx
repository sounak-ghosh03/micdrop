"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "../../../../context/AdminAuthContext";

export default function AdminLoginPage() {
   const { adminLogin, isAdminAuthenticated, loading } = useAdminAuth();
   const router = useRouter();
   const searchParams = useSearchParams();

   const [form, setForm] = useState({
      email: "",
      password: "",
      accessCode: "",
   });
   const [showCode, setShowCode] = useState(false);
   const [showPass, setShowPass] = useState(false);
   const [error, setError] = useState("");
   const [submitting, setSubmitting] = useState(false);

   // Redirect if already authenticated
   useEffect(() => {
      if (!loading && isAdminAuthenticated) {
         const redirect = searchParams.get("redirect") || "/admin";
         router.replace(redirect);
      }
   }, [isAdminAuthenticated, loading, router, searchParams]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSubmitting(true);
      try {
         await adminLogin(form.email, form.password, form.accessCode);
         // Set cookie so middleware can detect presence
         document.cookie =
            "adminTokenPresent=1; path=/; max-age=14400; SameSite=Strict";
         const redirect = searchParams.get("redirect") || "/admin";
         router.replace(redirect);
      } catch (err: unknown) {
         setError(err instanceof Error ? err.message : "Login failed");
      } finally {
         setSubmitting(false);
      }
   };

   if (loading) {
      return (
         <div style={styles.fullCenter}>
            <div style={styles.spinner} />
         </div>
      );
   }

   return (
      <div style={styles.page}>
         {/* Background grid effect */}
         <div style={styles.gridBg} />

         <div style={styles.card}>
            {/* Logo */}
            <div style={styles.logoWrap}>
               <div style={styles.logoIcon}>🎤</div>
               <div>
                  <div style={styles.logoTitle}>MicDrop</div>
                  <div style={styles.logoSub}>Admin Console</div>
               </div>
            </div>

            <h1 style={styles.heading}>Secure Sign In</h1>
            <p style={styles.subHeading}>
               Three-factor authentication required
            </p>

            {error && (
               <div style={styles.errorBox}>
                  <span>{error}</span>
               </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
               {/* Email */}
               <div style={styles.fieldGroup}>
                  <label style={styles.label}>Admin Email</label>
                  <input
                     id="admin-email"
                     type="email"
                     autoComplete="email"
                     required
                     placeholder="admin@micdrop.internal"
                     value={form.email}
                     onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                     }
                     style={styles.input}
                     onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                     onBlur={(e) => (e.target.style.borderColor = "#2d2d3d")}
                  />
               </div>

               {/* Password */}
               <div style={styles.fieldGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrap}>
                     <input
                        id="admin-password"
                        type={showPass ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) =>
                           setForm({ ...form, password: e.target.value })
                        }
                        style={{ ...styles.input, paddingRight: "3rem" }}
                        onFocus={(e) =>
                           (e.target.style.borderColor = "#7c3aed")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#2d2d3d")}
                     />
                     <button
                        type="button"
                        style={styles.eyeBtn}
                        onClick={() => setShowPass(!showPass)}
                     >
                        {showPass}
                     </button>
                  </div>
               </div>

               {/* Access Code */}
               <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                     Access Code <span style={styles.badge}>3rd Factor</span>
                  </label>
                  <div style={styles.inputWrap}>
                     <input
                        id="admin-access-code"
                        type={showCode ? "text" : "password"}
                        required
                        placeholder="MD-ADMIN-ACCESS-XXXX"
                        value={form.accessCode}
                        onChange={(e) =>
                           setForm({ ...form, accessCode: e.target.value })
                        }
                        style={{
                           ...styles.input,
                           paddingRight: "3rem",
                           fontFamily: "monospace",
                        }}
                        onFocus={(e) =>
                           (e.target.style.borderColor = "#7c3aed")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#2d2d3d")}
                     />
                     <button
                        type="button"
                        style={styles.eyeBtn}
                        onClick={() => setShowCode(!showCode)}
                     >
                        {showCode}
                     </button>
                  </div>
               </div>

               <button
                  id="admin-login-btn"
                  type="submit"
                  disabled={submitting}
                  style={{
                     ...styles.submitBtn,
                     opacity: submitting ? 0.7 : 1,
                     cursor: submitting ? "not-allowed" : "pointer",
                  }}
               >
                  {submitting ? (
                     <span
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: 8,
                           justifyContent: "center",
                        }}
                     >
                        <span style={styles.btnSpinner} /> Authenticating…
                     </span>
                  ) : (
                     "Sign In to Admin Console"
                  )}
               </button>
            </form>

            <div style={styles.footer}>
               <span style={styles.lock}></span>
               Secured with 3-factor authentication + encrypted token
            </div>
         </div>
      </div>
   );
}

const styles: Record<string, React.CSSProperties> = {
   page: {
      minHeight: "100vh",
      background:
         "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      position: "relative",
      overflow: "hidden",
   },
   gridBg: {
      position: "absolute",
      inset: 0,
      backgroundImage: `
      linear-gradient(rgba(124,58,237,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,0.08) 1px, transparent 1px)
    `,
      backgroundSize: "40px 40px",
      pointerEvents: "none",
   },
   card: {
      background: "rgba(15,15,26,0.95)",
      border: "1px solid rgba(124,58,237,0.3)",
      borderRadius: "1.5rem",
      padding: "2.5rem",
      width: "100%",
      maxWidth: "420px",
      boxShadow:
         "0 25px 80px rgba(124,58,237,0.25), 0 0 0 1px rgba(124,58,237,0.1)",
      position: "relative",
      zIndex: 1,
      backdropFilter: "blur(20px)",
   },
   logoWrap: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "2rem",
   },
   logoIcon: {
      fontSize: "2rem",
      background: "linear-gradient(135deg, #7c3aed, #c026d3)",
      borderRadius: "0.75rem",
      width: "3rem",
      height: "3rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
   },
   logoTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#fff",
      lineHeight: 1.2,
   },
   logoSub: {
      fontSize: "0.75rem",
      color: "rgba(124,58,237,0.9)",
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
   },
   heading: {
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#fff",
      margin: "0 0 0.25rem",
   },
   subHeading: {
      fontSize: "0.875rem",
      color: "rgba(255,255,255,0.45)",
      marginBottom: "1.5rem",
   },
   errorBox: {
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.4)",
      borderRadius: "0.75rem",
      padding: "0.75rem 1rem",
      color: "#fca5a5",
      fontSize: "0.875rem",
      marginBottom: "1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
   },
   form: { display: "flex", flexDirection: "column", gap: "1rem" },
   fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
   label: {
      fontSize: "0.8rem",
      fontWeight: 600,
      color: "rgba(255,255,255,0.65)",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      letterSpacing: "0.04em",
   },
   badge: {
      fontSize: "0.65rem",
      background: "rgba(124,58,237,0.25)",
      color: "#a78bfa",
      padding: "0.1rem 0.4rem",
      borderRadius: "0.3rem",
      border: "1px solid rgba(124,58,237,0.4)",
      fontWeight: 600,
   },
   inputWrap: { position: "relative" },
   input: {
      width: "100%",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid #2d2d3d",
      borderRadius: "0.65rem",
      padding: "0.7rem 0.9rem",
      color: "#fff",
      fontSize: "0.9rem",
      outline: "none",
      transition: "border-color 0.2s",
      boxSizing: "border-box",
   },
   eyeBtn: {
      position: "absolute",
      right: "0.6rem",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "1rem",
      padding: "0.2rem",
   },
   submitBtn: {
      marginTop: "0.5rem",
      padding: "0.85rem",
      background: "linear-gradient(135deg, #7c3aed, #c026d3)",
      color: "#fff",
      border: "none",
      borderRadius: "0.75rem",
      fontWeight: 700,
      fontSize: "0.95rem",
      width: "100%",
      transition: "transform 0.15s, box-shadow 0.15s",
      boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
   },
   footer: {
      marginTop: "1.5rem",
      textAlign: "center",
      fontSize: "0.75rem",
      color: "rgba(255,255,255,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.4rem",
   },
   lock: { fontSize: "0.9rem" },
   fullCenter: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f1a",
   },
   spinner: {
      width: 40,
      height: 40,
      border: "3px solid rgba(124,58,237,0.2)",
      borderTop: "3px solid #7c3aed",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
   },
   btnSpinner: {
      display: "inline-block",
      width: 16,
      height: 16,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTop: "2px solid #fff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
   },
};
