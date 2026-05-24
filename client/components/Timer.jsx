"use client";

import { useState, useEffect, useRef } from "react";
import { formatDuration } from "../utils/helpers";

/**
 * Timer — counts up while a performance is LIVE; shows total duration when ENDED.
 *
 * @param {{
 *   startedAt: string|Date,
 *   endedAt?: string|Date,
 *   status: "LIVE"|"ENDED"|"SCHEDULED"
 * }} props
 */
export default function Timer({ startedAt, endedAt, status }) {
   const [elapsed, setElapsed] = useState(0);
   const intervalRef = useRef(null);

   useEffect(() => {
      clearInterval(intervalRef.current);

      if (status === "LIVE" && startedAt) {
         // Calculate initial elapsed time (handles page reload mid-stream)
         const initial = Math.floor(
            (Date.now() - new Date(startedAt).getTime()) / 1000,
         );
         setElapsed(Math.max(0, initial));

         intervalRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
         }, 1000);
      } else if (status === "ENDED" && startedAt && endedAt) {
         // Static total duration for ended performances
         const total = Math.floor(
            (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
         );
         setElapsed(Math.max(0, total));
      }

      return () => clearInterval(intervalRef.current);
   }, [startedAt, endedAt, status]);

   if (status === "LIVE") {
      return (
         <div
            style={{
               display: "inline-flex",
               alignItems: "center",
               gap: "6px",
               background: "rgba(239,68,68,0.12)",
               border: "1px solid rgba(239,68,68,0.3)",
               borderRadius: "var(--radius-full)",
               padding: "3px 10px",
               fontSize: "0.75rem",
               fontWeight: 700,
               fontVariantNumeric: "tabular-nums",
               letterSpacing: "0.03em",
               color: "var(--color-live)",
               userSelect: "none",
            }}
         >
            {/* Pulse dot */}
            <span
               style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--color-live)",
                  flexShrink: 0,
               }}
               className="animate-pulse-live"
            />
            {formatDuration(elapsed)}
         </div>
      );
   }

   if (status === "ENDED" && elapsed > 0) {
      return (
         <div
            style={{
               display: "inline-flex",
               alignItems: "center",
               gap: "5px",
               background: "rgba(148,163,184,0.10)",
               border: "1px solid rgba(148,163,184,0.2)",
               borderRadius: "var(--radius-full)",
               padding: "3px 10px",
               fontSize: "0.75rem",
               fontWeight: 600,
               fontVariantNumeric: "tabular-nums",
               letterSpacing: "0.03em",
               color: "var(--color-text-muted)",
               userSelect: "none",
            }}
         >
            🕐 {formatDuration(elapsed)}
         </div>
      );
   }

   return null;
}
