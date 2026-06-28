"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "../../context/AdminAuthContext";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopBar from "../../components/admin/AdminTopBar";

// Inner shell — needs access to useAdminAuth
function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdminAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAdminAuthenticated, loading, router]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Verifying credentials…</p>
      </div>
    );
  }

  if (!isAdminAuthenticated) return null;

  return (
    <div style={styles.shell}>
      <AdminSidebar />
      <div style={styles.main}>
        <AdminTopBar />
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#0a0a14",
    color: "#fff",
    fontFamily: "var(--font-sans, Inter, sans-serif)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: "1.5rem",
    overflowY: "auto",
  },
  loading: {
    minHeight: "100vh",
    background: "#0a0a14",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "3px solid rgba(124,58,237,0.2)",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.875rem",
  },
};
