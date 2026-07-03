"use client";

import { useEffect, useState } from "react";
import {
   refreshLeaderboard,
   resetLeaderboard,
   fetchBannedWords,
   updateBannedWords,
} from "../../../../services/adminApi";
import { useAdminAuth } from "../../../../context/AdminAuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SettingsPage() {
   const { adminToken, admin } = useAdminAuth();

   // Banned words
   const [bannedWords, setBannedWords] = useState<string[]>([]);
   const [wordsLoading, setWordsLoading] = useState(true);
   const [wordsSaving, setWordsSaving] = useState(false);
   const [wordsInput, setWordsInput] = useState("");
   const [wordsSaved, setWordsSaved] = useState(false);

   // Leaderboard
   const [lbLoading, setLbLoading] = useState("");

   // Change password
   const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
   const [pwLoading, setPwLoading] = useState(false);
   const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(
      null,
   );

   useEffect(() => {
      fetchBannedWords()
         .then((d) => {
            const words = (d as { bannedWords: string[] }).bannedWords;
            setBannedWords(words);
            setWordsInput(words.join(", "));
         })
         .finally(() => setWordsLoading(false));
   }, []);

   const saveWords = async () => {
      setWordsSaving(true);
      try {
         const words = wordsInput
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean);
         await updateBannedWords(words);
         setBannedWords(words);
         setWordsSaved(true);
         setTimeout(() => setWordsSaved(false), 2500);
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Failed");
      } finally {
         setWordsSaving(false);
      }
   };

   const doLbAction = async (action: "refresh" | "reset") => {
      if (
         action === "reset" &&
         !confirm("Reset the entire leaderboard? This cannot be undone.")
      )
         return;
      setLbLoading(action);
      try {
         if (action === "refresh") await refreshLeaderboard();
         else await resetLeaderboard();
         alert(
            action === "refresh"
               ? "Leaderboard refreshed!"
               : "Leaderboard reset!",
         );
      } catch (e: unknown) {
         alert(e instanceof Error ? e.message : "Failed");
      } finally {
         setLbLoading("");
      }
   };

   const changePw = async (e: React.FormEvent) => {
      e.preventDefault();
      if (pw.next !== pw.confirm) {
         setPwMsg({ ok: false, text: "Passwords do not match" });
         return;
      }
      if (pw.next.length < 8) {
         setPwMsg({ ok: false, text: "Minimum 8 characters" });
         return;
      }
      setPwLoading(true);
      try {
         const res = await fetch(`${API_URL}/api/admin/auth/change-password`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
               currentPassword: pw.current,
               newPassword: pw.next,
            }),
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.message);
         setPwMsg({ ok: true, text: "Password changed successfully!" });
         setPw({ current: "", next: "", confirm: "" });
      } catch (e: unknown) {
         setPwMsg({
            ok: false,
            text: e instanceof Error ? e.message : "Failed",
         });
      } finally {
         setPwLoading(false);
      }
   };

   return (
      <div style={pg}>
         {/* Admin Info */}
         <Section title="Admin Account" color="#7c3aed">
            <div style={infoGrid}>
               <InfoRow label="Username" value={`@${admin?.username}`} />
               <InfoRow label="Email" value={admin?.email ?? ""} />
               <InfoRow label="Role" value="Super Admin" />
            </div>
         </Section>

         {/* Change Password */}
         <Section title="Change Password" color="#a855f7">
            <form onSubmit={changePw} style={formCol}>
               {pwMsg && (
                  <div
                     style={{
                        ...msg,
                        background: pwMsg.ok
                           ? "rgba(34,197,94,0.1)"
                           : "rgba(239,68,68,0.1)",
                        color: pwMsg.ok ? "#86efac" : "#fca5a5",
                        border: `1px solid ${pwMsg.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                     }}
                  >
                     {pwMsg.text}
                  </div>
               )}
               <PasswordField
                  label="Current Password"
                  value={pw.current}
                  onChange={(v) => setPw({ ...pw, current: v })}
                  id="pw-current"
               />
               <PasswordField
                  label="New Password"
                  value={pw.next}
                  onChange={(v) => setPw({ ...pw, next: v })}
                  id="pw-new"
               />
               <PasswordField
                  label="Confirm New"
                  value={pw.confirm}
                  onChange={(v) => setPw({ ...pw, confirm: v })}
                  id="pw-confirm"
               />
               <button type="submit" disabled={pwLoading} style={submitBtn}>
                  {pwLoading ? "Saving…" : "Change Password"}
               </button>
            </form>
         </Section>

         {/* Banned Words */}
         <Section title="Banned Words" color="#ef4444">
            <p style={hint}>
               Comma-separated list of words that will be auto-moderated in
               comments and chats.
            </p>
            {wordsLoading ? (
               <div style={dimText}>Loading…</div>
            ) : (
               <>
                  <div style={wordCount}>
                     {bannedWords.length} words configured
                  </div>
                  <textarea
                     value={wordsInput}
                     onChange={(e) => setWordsInput(e.target.value)}
                     style={textarea}
                     rows={5}
                     placeholder="word1, word2, word3, …"
                  />
                  <button
                     onClick={saveWords}
                     disabled={wordsSaving}
                     style={{
                        ...submitBtn,
                        background: wordsSaved ? "#22c55e" : "#ef4444",
                     }}
                  >
                     {wordsSaving
                        ? "Saving…"
                        : wordsSaved
                          ? "Saved!"
                          : "Save Banned Words"}
                  </button>
               </>
            )}
         </Section>

         {/* Leaderboard */}
         <Section title="Leaderboard Control" color="#f59e0b">
            <p style={hint}>
               Refresh recomputes all scores and ranks. Reset wipes the
               leaderboard entirely.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
               <button
                  onClick={() => doLbAction("refresh")}
                  disabled={lbLoading === "refresh"}
                  style={{ ...submitBtn, background: "#22c55e" }}
               >
                  {lbLoading === "refresh"
                     ? "Refreshing…"
                     : "Refresh Leaderboard"}
               </button>
               <button
                  onClick={() => doLbAction("reset")}
                  disabled={lbLoading === "reset"}
                  style={{ ...submitBtn, background: "#ef4444" }}
               >
                  {lbLoading === "reset" ? "Resetting…" : "Reset Leaderboard"}
               </button>
            </div>
         </Section>
      </div>
   );
}

const Section = ({
   title,
   color,
   children,
}: {
   title: string;
   color: string;
   children: React.ReactNode;
}) => (
   <section
      style={{
         background: "rgba(255,255,255,0.02)",
         border: `1px solid ${color}22`,
         borderLeft: `3px solid ${color}`,
         borderRadius: "0.875rem",
         padding: "1.5rem",
      }}
   >
      <h2
         style={{
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 1rem",
         }}
      >
         {title}
      </h2>
      {children}
   </section>
);
const InfoRow = ({ label, value }: { label: string; value: string }) => (
   <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      <span
         style={{
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
         }}
      >
         {label}
      </span>
      <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 500 }}>
         {value}
      </span>
   </div>
);
const PasswordField = ({
   label,
   value,
   onChange,
   id,
}: {
   label: string;
   value: string;
   onChange: (v: string) => void;
   id: string;
}) => {
   const [show, setShow] = useState(false);
   return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
         <label
            style={{
               fontSize: "0.78rem",
               color: "rgba(255,255,255,0.5)",
               fontWeight: 600,
            }}
         >
            {label}
         </label>
         <div style={{ position: "relative" }}>
            <input
               id={id}
               type={show ? "text" : "password"}
               value={value}
               onChange={(e) => onChange(e.target.value)}
               required
               style={{ ...pwInp, paddingRight: "2.5rem" }}
            />
            <button type="button" onClick={() => setShow(!show)} style={eyeBtn}>
               {show ? "🙈" : "👁️"}
            </button>
         </div>
      </div>
   );
};

const pg: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "1.25rem",
};
const infoGrid: React.CSSProperties = {
   display: "grid",
   gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
   gap: "1rem",
};
const formCol: React.CSSProperties = {
   display: "flex",
   flexDirection: "column",
   gap: "0.75rem",
   maxWidth: 380,
};
const msg: React.CSSProperties = {
   borderRadius: "0.5rem",
   padding: "0.6rem 0.9rem",
   fontSize: "0.83rem",
   fontWeight: 500,
};
const pwInp: React.CSSProperties = {
   width: "100%",
   background: "rgba(255,255,255,0.05)",
   border: "1px solid rgba(255,255,255,0.1)",
   borderRadius: "0.5rem",
   padding: "0.6rem 0.85rem",
   color: "#fff",
   fontSize: "0.875rem",
   outline: "none",
   boxSizing: "border-box",
};
const eyeBtn: React.CSSProperties = {
   position: "absolute",
   right: "0.5rem",
   top: "50%",
   transform: "translateY(-50%)",
   background: "none",
   border: "none",
   cursor: "pointer",
   fontSize: "0.9rem",
};
const submitBtn: React.CSSProperties = {
   background: "#7c3aed",
   border: "none",
   borderRadius: "0.5rem",
   color: "#fff",
   padding: "0.6rem 1.25rem",
   fontSize: "0.85rem",
   fontWeight: 700,
   cursor: "pointer",
   alignSelf: "flex-start",
};
const hint: React.CSSProperties = {
   fontSize: "0.8rem",
   color: "rgba(255,255,255,0.35)",
   margin: "0 0 0.75rem",
};
const wordCount: React.CSSProperties = {
   fontSize: "0.78rem",
   color: "rgba(255,255,255,0.35)",
   marginBottom: "0.5rem",
};
const textarea: React.CSSProperties = {
   width: "100%",
   background: "rgba(255,255,255,0.04)",
   border: "1px solid rgba(255,255,255,0.1)",
   borderRadius: "0.5rem",
   padding: "0.75rem",
   color: "#fff",
   fontSize: "0.85rem",
   fontFamily: "monospace",
   outline: "none",
   resize: "vertical",
   boxSizing: "border-box",
};
const dimText: React.CSSProperties = {
   color: "rgba(255,255,255,0.3)",
   fontSize: "0.8rem",
};
