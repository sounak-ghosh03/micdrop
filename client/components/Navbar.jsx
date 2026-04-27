"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";

const NAV_LINKS = [
   { href: "/home", label: "Home" },
   { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
   const pathname = usePathname();
   const router = useRouter();
   const { user, isAuthenticated, logout } = useAuth();
   const [menuOpen, setMenuOpen] = useState(false);

   const handleLogout = () => {
      logout();
      setMenuOpen(false);
      router.push("/login");
   };

   return (
      <nav
         style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(7,7,15,0.85)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--color-border)",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
         }}
      >
         {/* Logo */}
         <Link
            href="/home"
            style={{
               textDecoration: "none",
               display: "flex",
               alignItems: "center",
               gap: 8,
            }}
         >
            <span style={{ fontSize: "1.4rem" }}></span>
            <span
               style={{
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  background: "linear-gradient(135deg, #a78bfa, #e879f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
               }}
            >
               MicDrop
            </span>
         </Link>

         {/* Nav links (desktop) */}
         <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV_LINKS.map((link) => {
               const active =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
               return (
                  <Link
                     key={link.href}
                     href={link.href}
                     style={{
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: "0.875rem",
                        fontWeight: active ? 700 : 500,
                        color: active
                           ? "var(--color-primary-light)"
                           : "var(--color-text-secondary)",
                        background: active
                           ? "rgba(124,58,237,0.12)"
                           : "transparent",
                        transition: "background 0.15s, color 0.15s",
                     }}
                     onMouseEnter={(e) => {
                        if (!active) {
                           e.currentTarget.style.background =
                              "rgba(255,255,255,0.05)";
                           e.currentTarget.style.color =
                              "var(--color-text-primary)";
                        }
                     }}
                     onMouseLeave={(e) => {
                        if (!active) {
                           e.currentTarget.style.background = "transparent";
                           e.currentTarget.style.color =
                              "var(--color-text-secondary)";
                        }
                     }}
                  >
                     {link.label}
                  </Link>
               );
            })}
         </div>

         {/* Right side */}
         <div
            style={{
               display: "flex",
               alignItems: "center",
               gap: 10,
               position: "relative",
            }}
         >
            {isAuthenticated ? (
               <>
                  {/* Avatar / user menu trigger */}
                  <button
                     id="user-menu-btn"
                     onClick={() => setMenuOpen((v) => !v)}
                     style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 99,
                        padding: "5px 12px 5px 6px",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                     }}
                     onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                           "var(--color-primary)";
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                           "var(--color-border)";
                     }}
                  >
                     <div
                        style={{
                           width: 28,
                           height: 28,
                           borderRadius: "50%",
                           background: "var(--color-primary)",
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           fontSize: "0.65rem",
                           fontWeight: 700,
                           color: "#fff",
                           overflow: "hidden",
                           flexShrink: 0,
                        }}
                     >
                        {user?.avatar ? (
                           <img
                              src={user.avatar}
                              alt=""
                              style={{
                                 width: "100%",
                                 height: "100%",
                                 objectFit: "cover",
                              }}
                           />
                        ) : (
                           getInitials(user?.username)
                        )}
                     </div>
                     <span
                        style={{
                           fontSize: "0.82rem",
                           fontWeight: 600,
                           color: "var(--color-text-primary)",
                           maxWidth: 80,
                           overflow: "hidden",
                           textOverflow: "ellipsis",
                           whiteSpace: "nowrap",
                        }}
                     >
                        {user?.username}
                     </span>
                     <span
                        style={{
                           fontSize: "0.7rem",
                           color: "var(--color-text-muted)",
                        }}
                     >
                        ▾
                     </span>
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                     <div
                        style={{
                           position: "absolute",
                           top: "calc(100% + 8px)",
                           right: 0,
                           background: "var(--color-bg-elevated)",
                           border: "1px solid var(--color-border)",
                           borderRadius: 12,
                           minWidth: 180,
                           boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                           overflow: "hidden",
                           zIndex: 100,
                        }}
                     >
                        <div
                           style={{
                              padding: "10px 16px",
                              borderBottom: "1px solid var(--color-border)",
                           }}
                        >
                           <p
                              style={{
                                 margin: 0,
                                 fontSize: "0.78rem",
                                 fontWeight: 600,
                                 color: "var(--color-text-primary)",
                              }}
                           >
                              {user?.username}
                           </p>
                           <p
                              style={{
                                 margin: 0,
                                 fontSize: "0.72rem",
                                 color: "var(--color-text-muted)",
                              }}
                           >
                              {user?.email}
                           </p>
                           <span
                              style={{
                                 display: "inline-block",
                                 marginTop: 4,
                                 fontSize: "0.65rem",
                                 fontWeight: 700,
                                 textTransform: "uppercase",
                                 letterSpacing: "0.06em",
                                 color: "var(--color-primary-light)",
                                 background: "rgba(124,58,237,0.15)",
                                 padding: "1px 8px",
                                 borderRadius: 99,
                              }}
                           >
                              {user?.role}
                           </span>
                        </div>
                        <button
                           onClick={handleLogout}
                           style={{
                              width: "100%",
                              padding: "10px 16px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              fontSize: "0.83rem",
                              color: "var(--color-error)",
                              transition: "background 0.15s",
                           }}
                           onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                 "rgba(239,68,68,0.08)";
                           }}
                           onMouseLeave={(e) => {
                              e.currentTarget.style.background = "none";
                           }}
                        >
                           Sign Out
                        </button>
                     </div>
                  )}
               </>
            ) : (
               <>
                  <Link href="/login">
                     <button
                        className="btn-ghost"
                        style={{ padding: "6px 16px" }}
                     >
                        Log in
                     </button>
                  </Link>
                  <Link href="/register">
                     <button
                        className="btn-primary"
                        style={{ padding: "6px 16px" }}
                     >
                        Sign up
                     </button>
                  </Link>
               </>
            )}
         </div>

         {/* Click-away overlay */}
         {menuOpen && (
            <div
               style={{ position: "fixed", inset: 0, zIndex: 40 }}
               onClick={() => setMenuOpen(false)}
            />
         )}
      </nav>
   );
}
