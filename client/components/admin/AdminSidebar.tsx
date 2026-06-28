"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
   { href: "/admin", label: "Dashboard" },
   { href: "/admin/users", label: "Users" },
   { href: "/admin/performances", label: "Performances" },
   { href: "/admin/comments", label: "Comments" },
   { href: "/admin/live-monitor", label: "Live Monitor" },
   { href: "/admin/leaderboard", label: "Leaderboard" },
   { href: "/admin/audit-logs", label: "Audit Logs" },
   { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebar() {
   const pathname = usePathname();
   const [collapsed, setCollapsed] = useState(false);

   const isActive = (href: string) =>
      href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

   return (
      <aside style={{ ...styles.sidebar, width: collapsed ? 64 : 220 }}>
         {/* Logo */}
         <div style={styles.logoRow}>
            {!collapsed && (
               <div style={styles.logoText}>
                  <div>
                     <div style={styles.logoName}>MicDrop</div>
                     <div style={styles.logoBadge}>Admin Console</div>
                  </div>
               </div>
            )}
            <button
               style={styles.collapseBtn}
               onClick={() => setCollapsed(!collapsed)}
               title={collapsed ? "Expand" : "Collapse"}
            >
               {collapsed ? "▶" : "◀"}
            </button>
         </div>

         {/* Nav */}
         <nav style={styles.nav}>
            {NAV.map(({ href, label }) => {
               const active = isActive(href);
               return (
                  <Link
                     key={href}
                     href={href}
                     style={{
                        ...styles.navItem,
                        ...(active ? styles.navActive : {}),
                     }}
                     title={collapsed ? label : undefined}
                  >
                     {collapsed ? (
                        <span style={styles.navCollapsedLabel}>{label.charAt(0)}</span>
                     ) : (
                        <span style={styles.navLabel}>{label}</span>
                     )}
                     {active && !collapsed && <span style={styles.activeDot} />}
                  </Link>
               );
            })}
         </nav>

         {/* Footer */}
         {!collapsed && (
            <div style={styles.sidebarFooter}>
               <div style={styles.footerDot} />
               <span
                  style={{
                     fontSize: "0.7rem",
                     color: "rgba(255,255,255,0.25)",
                  }}
               >
                  Admin Console v1.0
               </span>
            </div>
         )}
      </aside>
   );
}

const styles: Record<string, React.CSSProperties> = {
   sidebar: {
      background: "rgba(15,15,26,0.98)",
      borderRight: "1px solid rgba(124,58,237,0.15)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s ease",
      overflow: "hidden",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
   },
   logoRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1.25rem 0.9rem 1rem",
      borderBottom: "1px solid rgba(124,58,237,0.1)",
      minHeight: 64,
   },
   logoText: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      overflow: "hidden",
   },

   logoName: {
      fontWeight: 700,
      fontSize: "0.95rem",
      color: "#fff",
      whiteSpace: "nowrap",
   },
   logoBadge: {
      fontSize: "0.6rem",
      color: "#a78bfa",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      fontWeight: 600,
   },
   collapseBtn: {
      background: "rgba(124,58,237,0.1)",
      border: "1px solid rgba(124,58,237,0.2)",
      borderRadius: "0.4rem",
      color: "#a78bfa",
      cursor: "pointer",
      width: 28,
      height: 28,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.6rem",
      flexShrink: 0,
   },
   nav: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "0.15rem",
      padding: "0.75rem 0.5rem",
      overflowY: "auto",
   },
   navItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.65rem",
      padding: "0.6rem 0.75rem",
      borderRadius: "0.6rem",
      color: "rgba(255,255,255,0.5)",
      textDecoration: "none",
      fontSize: "0.875rem",
      fontWeight: 500,
      transition: "all 0.15s",
      position: "relative",
      whiteSpace: "nowrap",
   },
   navActive: {
      background: "rgba(124,58,237,0.18)",
      color: "#c4b5fd",
      borderLeft: "2px solid #7c3aed",
   },
   navCollapsedLabel: { fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", width: "100%", textAlign: "center" as const },
   navLabel: { flex: 1, overflow: "hidden", textOverflow: "ellipsis" },
   activeDot: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#7c3aed",
      flexShrink: 0,
   },
   sidebarFooter: {
      padding: "1rem",
      borderTop: "1px solid rgba(124,58,237,0.1)",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
   },
   footerDot: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#22c55e",
      flexShrink: 0,
   },
};
