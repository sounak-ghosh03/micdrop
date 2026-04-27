"use client";

import { useState, useEffect, useRef } from "react";
import { formatDuration } from "../utils/helpers";

/**
 * Timer — counts up from the moment a live performance started.
 *
 * @param {{ startedAt: string|Date, status: string }} props
 *   startedAt — ISO timestamp when the performance went LIVE
 *   status    — "LIVE" | "ENDED" | "SCHEDULED"
 */
export default function Timer({ startedAt, status }) {
   const [elapsed, setElapsed] = useState(0);
   const intervalRef = useRef(null);

   useEffect(() => {
      // Calculate initial elapsed time (handles page reload mid-stream)
      if (status === "LIVE" && startedAt) {
         const initial = Math.floor(
            (Date.now() - new Date(startedAt).getTime()) / 1000,
         );
         setElapsed(Math.max(0, initial));

         intervalRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
         }, 1000);
      }

      return () => clearInterval(intervalRef.current);
   }, [startedAt, status]);

   if (status !== "LIVE") return null;

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
