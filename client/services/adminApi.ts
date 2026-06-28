// client/services/adminApi.ts
// Centralised typed API calls for all admin endpoints.
// Every function reads the adminToken from localStorage automatically.

import { getAdminToken } from "../utils/adminHelpers";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
   const token = getAdminToken();
   const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
         "Content-Type": "application/json",
         ...(token ? { Authorization: `Bearer ${token}` } : {}),
         ...(options.headers ?? {}),
      },
   });
   const data = await res.json();
   if (!res.ok) throw new Error(data.message || "Request failed");
   return data as T;
}

// Dashboard
export const fetchAdminStats = () => req("/api/admin/stats");

// Users
export const fetchUsers = (params: Record<string, string | number> = {}) => {
   const qs = new URLSearchParams(
      Object.fromEntries(
         Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
   ).toString();
   return req(`/api/admin/users${qs ? `?${qs}` : ""}`);
};

export const fetchUserDetail = (id: string) => req(`/api/admin/users/${id}`);

export const banUser = (id: string, reason?: string) =>
   req(`/api/admin/users/${id}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
   });

export const unbanUser = (id: string) =>
   req(`/api/admin/users/${id}/unban`, { method: "PATCH" });

export const deleteUser = (id: string) =>
   req(`/api/admin/users/${id}`, { method: "DELETE" });

export const changeUserRole = (id: string, role: string) =>
   req(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
   });

export const verifyUser = (id: string) =>
   req(`/api/admin/users/${id}/verify`, { method: "PATCH" });

export const warnUser = (id: string) =>
   req(`/api/admin/users/${id}/warn`, { method: "PATCH" });

export const resetWarnings = (id: string) =>
   req(`/api/admin/users/${id}/reset-warnings`, { method: "PATCH" });

// Performances
export const fetchPerformances = (
   params: Record<string, string | number> = {},
) => {
   const qs = new URLSearchParams(
      Object.fromEntries(
         Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
   ).toString();
   return req(`/api/admin/performances${qs ? `?${qs}` : ""}`);
};

export const deletePerformance = (id: string) =>
   req(`/api/admin/performances/${id}`, { method: "DELETE" });

export const forceEndPerformance = (id: string) =>
   req(`/api/admin/performances/${id}/force-end`, { method: "PATCH" });

// Comments
export const fetchComments = (params: Record<string, string | number> = {}) => {
   const qs = new URLSearchParams(
      Object.fromEntries(
         Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
   ).toString();
   return req(`/api/admin/comments${qs ? `?${qs}` : ""}`);
};

export const deleteComment = (id: string) =>
   req(`/api/admin/comments/${id}`, { method: "DELETE" });

export const pinComment = (id: string) =>
   req(`/api/admin/comments/${id}/pin`, { method: "PATCH" });

//Leaderboard
export const refreshLeaderboard = () =>
   req("/api/admin/leaderboard/refresh", { method: "POST" });

export const resetLeaderboard = () =>
   req("/api/admin/leaderboard/reset", { method: "DELETE" });

//  Moderation Settings
export const fetchBannedWords = () => req("/api/admin/moderation/banned-words");

export const updateBannedWords = (bannedWords: string[]) =>
   req("/api/admin/moderation/banned-words", {
      method: "PATCH",
      body: JSON.stringify({ bannedWords }),
   });

// Audit Logs
export const fetchAuditLogs = (
   params: Record<string, string | number> = {},
) => {
   const qs = new URLSearchParams(
      Object.fromEntries(
         Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
   ).toString();
   return req(`/api/admin/audit-logs${qs ? `?${qs}` : ""}`);
};

//Live Rooms
export const fetchLiveRooms = () => req("/api/admin/live-rooms");
