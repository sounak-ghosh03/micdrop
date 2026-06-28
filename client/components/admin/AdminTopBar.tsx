"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "../../context/AdminAuthContext";

const PAGE_TITLES: Record<string, string> = {
   "/admin": "Dashboard",
   "/admin/users": "User Management",
   "/admin/performances": "Performance Management",
   "/admin/comments": "Comment Moderation",
   "/admin/live-monitor": "Live Monitor",
   "/admin/leaderboard": "Leaderboard Control",
   "/admin/audit-logs": "Audit Logs",
   "/admin/settings": "Platform Settings",
};

export default function AdminTopBar() {
   const pathname = usePathname();
   const router = useRouter();
   const { admin, adminLogout } = useAdminAuth();

   const title =
      Object.entries(PAGE_TITLES).find(
         ([key]) =>
            pathname === key || (key !== "/admin" && pathname.startsWith(key)),
      )?.[1] ?? "Admin Console";

   const handleLogout = () => {
      adminLogout();
      // Clear presence cookie
      document.cookie = "adminTokenPresent=; path=/; max-age=0";
      router.replace("/admin/login");
   };

   return (
      <header style={styles.bar}>
         <div style={styles.left}>
            <h1 style={styles.title}>{title}</h1>
         </div>

         <div style={styles.right}>
            {/* Status pill */}
            <div style={styles.statusPill}>
               <span style={styles.greenDot} />
               <span style={styles.statusText}>System Online</span>
            </div>

            {/* Admin badge */}
            <div style={styles.adminBadge}>
               <div style={styles.avatar}>
                  {admin?.username?.charAt(0).toUpperCase() ?? "A"}
               </div>
               <div style={styles.adminInfo}>
                  <div style={styles.adminName}>
                     {admin?.username ?? "Admin"}
                  </div>
                  <div style={styles.adminRole}>Super Admin</div>
               </div>
            </div>

            {/* Logout */}
            <button
               id="admin-logout-btn"
               style={styles.logoutBtn}
               onClick={handleLogout}
               title="Sign out"
            >
               Sign Out
            </button>
         </div>
      </header>
   );
}

const styles: Record<string, React.CSSProperties> = {
   bar: {
      height: 60,
      background: "rgba(15,15,26,0.98)",
      borderBottom: "1px solid rgba(124,58,237,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 50,
      backdropFilter: "blur(12px)",
   },
   left: { display: "flex", alignItems: "center", gap: "1rem" },
   title: {
      fontSize: "1rem",
      fontWeight: 600,
      color: "#fff",
      margin: 0,
      letterSpacing: "0.01em",
   },
   right: { display: "flex", alignItems: "center", gap: "0.75rem" },
   statusPill: {
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
      background: "rgba(34,197,94,0.1)",
      border: "1px solid rgba(34,197,94,0.2)",
      borderRadius: "2rem",
      padding: "0.25rem 0.6rem",
   },
   greenDot: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "#22c55e",
      boxShadow: "0 0 6px #22c55e",
   },
   statusText: { fontSize: "0.72rem", color: "#86efac", fontWeight: 500 },
   adminBadge: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      background: "rgba(124,58,237,0.1)",
      border: "1px solid rgba(124,58,237,0.2)",
      borderRadius: "0.6rem",
      padding: "0.35rem 0.75rem",
   },
   avatar: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #7c3aed, #c026d3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: "0.75rem",
      color: "#fff",
      flexShrink: 0,
   },
   adminInfo: { lineHeight: 1.2 },
   adminName: { fontSize: "0.78rem", fontWeight: 600, color: "#fff" },
   adminRole: { fontSize: "0.65rem", color: "#a78bfa" },
   logoutBtn: {
      background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.25)",
      borderRadius: "0.5rem",
      color: "#fca5a5",
      padding: "0.35rem 0.75rem",
      fontSize: "0.78rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.15s",
   },
};
