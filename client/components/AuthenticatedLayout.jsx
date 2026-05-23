"use client";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";


//  AuthenticatedLayout — wraps every authenticated page with the shared
 
export default function AuthenticatedLayout({ children, style = {} }) {
   return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}>
         <Navbar />
         <Sidebar />
         <div style={{ paddingLeft: 240, ...style }}>{children}</div>
      </div>
   );
}
