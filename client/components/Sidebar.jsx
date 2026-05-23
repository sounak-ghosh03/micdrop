"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
   {
      href: "/home",
      label: "Home",
      icon: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
         >
            <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 11 21 L 11 15 L 13 15 L 13 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z M 12 4.7910156 L 18 10.191406 L 18 11 L 18 19 L 15 19 L 15 13 L 9 13 L 9 19 L 6 19 L 6 10.191406 L 12 4.7910156 z" />
         </svg>
      ),
   },
   {
      href: "/profile",
      label: "Profile",
      icon: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
         >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
         </svg>
      ),
   },
   {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
         >
            <path d="M7 21H3V9h4v12zm7 0h-4V3h4v18zm7 0h-4v-8h4v8z" />
         </svg>
      ),
   },
   {
      href: "/settings",
      label: "Settings",
      icon: (
         <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
         >
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.01 7.01 0 0 0-1.62-.94l-.36-2.54A.484.484 0 0 0 14 2h-4a.484.484 0 0 0-.48.41l-.36 2.54a7.07 7.07 0 0 0-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.47a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.36 1.04.67 1.62.94l.36 2.54c.07.24.29.41.48.41h4c.24 0 .44-.17.48-.41l.36-2.54a7.07 7.07 0 0 0 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 0 1 8.4 12 3.6 3.6 0 0 1 12 8.4 3.6 3.6 0 0 1 15.6 12 3.6 3.6 0 0 1 12 15.6z" />
         </svg>
      ),
   },
];

const Sidebar = () => {
   const path = usePathname();
   const { isAuthenticated, logout } = useAuth();

   return (
      <aside
         style={{
            width: 240,
            height: "calc(100vh - 64px)",
            position: "fixed",
            top: 64,
            left: 0,
            background: "var(--color-bg-card)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "24px 12px",
            zIndex: 100,
            boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
         }}
      >
         {/* Nav links */}
         <div>
            {/* Nav links */}
            <nav>
               <ul
                  style={{
                     listStyle: "none",
                     margin: 0,
                     padding: 0,
                     display: "flex",
                     flexDirection: "column",
                     gap: 4,
                  }}
               >
                  {NAV_LINKS.map(({ href, label, icon }) => {
                     const isActive =
                        path === href || (href === "/home" && path === "/");
                     return (
                        <li key={href}>
                           <Link
                              href={href}
                              style={{
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 10,
                                 padding: "9px 12px",
                                 borderRadius: "var(--radius-md)",
                                 fontSize: "0.875rem",
                                 fontWeight: isActive ? 700 : 500,
                                 textDecoration: "none",
                                 transition: "background 0.15s, color 0.15s",
                                 background: isActive
                                    ? "rgba(124, 58, 237, 0.18)"
                                    : "transparent",
                                 color: isActive
                                    ? "var(--color-primary-light)"
                                    : "var(--color-text-secondary)",
                                 borderLeft: isActive
                                    ? "3px solid var(--color-primary)"
                                    : "3px solid transparent",
                              }}
                              onMouseEnter={(e) => {
                                 if (!isActive) {
                                    e.currentTarget.style.background =
                                       "rgba(124,58,237,0.08)";
                                    e.currentTarget.style.color =
                                       "var(--color-text-primary)";
                                 }
                              }}
                              onMouseLeave={(e) => {
                                 if (!isActive) {
                                    e.currentTarget.style.background =
                                       "transparent";
                                    e.currentTarget.style.color =
                                       "var(--color-text-secondary)";
                                 }
                              }}
                           >
                              <span style={{ fontSize: "1rem", lineHeight: 1 }}>
                                 {icon}
                              </span>
                              {label}
                           </Link>
                        </li>
                     );
                  })}
               </ul>
            </nav>
         </div>

         {/* Logout */}
         {isAuthenticated && (
            <div
               style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: 16,
               }}
            >
               <button
                  onClick={logout}
                  style={{
                     width: "100%",
                     textAlign: "left",
                     padding: "9px 12px",
                     borderRadius: "var(--radius-md)",
                     border: "none",
                     background: "transparent",
                     fontSize: "0.875rem",
                     fontWeight: 600,
                     color: "var(--color-error)",
                     cursor: "pointer",
                     display: "flex",
                     alignItems: "center",
                     gap: 10,
                     transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                     e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                  }}
                  onMouseLeave={(e) => {
                     e.currentTarget.style.background = "transparent";
                  }}
               >
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>🚪</span>
                  Logout
               </button>
            </div>
         )}
      </aside>
   );
};

export default Sidebar;
