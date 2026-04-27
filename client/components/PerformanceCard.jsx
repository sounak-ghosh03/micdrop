"use client";

import Link from "next/link";
import {
   getStatusConfig,
   timeAgo,
   getInitials,
   formatCount,
} from "../utils/helpers";
import Timer from "./Timer";

/**
 * PerformanceCard — displays a single performance in the feed.
 *
 * @param {{
 *   performance: {
 *     _id: string,
 *     title: string,
 *     description?: string,
 *     type: "LIVE"|"RECORDED",
 *     status: "LIVE"|"SCHEDULED"|"ENDED",
 *     startedAt?: string,
 *     endedAt?: string,
 *     creator: { _id?: string, username?: string, name?: string, avatar?: string },
 *     stats: { viewers: number, totalReactions: number, applauseCount: number, commentCount: number }
 *   }
 * }} props
 */
export default function PerformanceCard({ performance }) {
   const { _id, title, description, status, startedAt, creator, stats } =
      performance;
   const statusCfg = getStatusConfig(status);
   const creatorName = creator?.username || creator?.name || "Unknown";

   return (
      <Link
         href={`/live/${_id}`}
         style={{ textDecoration: "none", display: "block" }}
      >
         <div
            className="card animate-fade-in"
            style={{
               cursor: "pointer",
               transition:
                  "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
               overflow: "hidden",
            }}
            onMouseEnter={(e) => {
               e.currentTarget.style.borderColor = "var(--color-primary)";
               e.currentTarget.style.boxShadow = "var(--shadow-primary)";
               e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
               e.currentTarget.style.borderColor = "var(--color-border)";
               e.currentTarget.style.boxShadow = "var(--shadow-card)";
               e.currentTarget.style.transform = "translateY(0)";
            }}
         >
            {/* Top gradient bar for LIVE */}
            {status === "LIVE" && (
               <div
                  style={{
                     height: 3,
                     background:
                        "linear-gradient(90deg, var(--color-live), var(--color-accent))",
                  }}
               />
            )}

            <div style={{ padding: "18px 20px" }}>
               {/* Header row */}
               <div
                  style={{
                     display: "flex",
                     alignItems: "flex-start",
                     justifyContent: "space-between",
                     gap: 12,
                     marginBottom: 10,
                  }}
               >
                  <div style={{ flex: 1, minWidth: 0 }}>
                     {/* Status badge + Timer */}
                     <div
                        style={{
                           display: "flex",
                           alignItems: "center",
                           gap: 8,
                           marginBottom: 6,
                        }}
                     >
                        <span className={statusCfg.className}>
                           {statusCfg.label}
                        </span>
                        {status === "LIVE" && (
                           <Timer startedAt={startedAt} status={status} />
                        )}
                     </div>

                     {/* Title */}
                     <h3
                        style={{
                           margin: 0,
                           fontSize: "1rem",
                           fontWeight: 700,
                           color: "var(--color-text-primary)",
                           lineHeight: 1.3,
                           overflow: "hidden",
                           textOverflow: "ellipsis",
                           whiteSpace: "nowrap",
                        }}
                     >
                        {title}
                     </h3>
                  </div>

                  {/* Creator avatar */}
                  <div
                     style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                        border: "2px solid var(--color-border)",
                        overflow: "hidden",
                     }}
                  >
                     {creator?.avatar ? (
                        <img
                           src={creator.avatar}
                           alt={creatorName}
                           style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                           }}
                        />
                     ) : (
                        getInitials(creatorName)
                     )}
                  </div>
               </div>

               {/* Description */}
               {description && (
                  <p
                     style={{
                        margin: "0 0 12px",
                        fontSize: "0.82rem",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.55,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                     }}
                  >
                     {description}
                  </p>
               )}

               {/* Divider */}
               <div
                  style={{
                     height: 1,
                     background: "var(--color-border)",
                     margin: "10px 0",
                  }}
               />

               {/* Footer: creator + stats */}
               <div
                  style={{
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "space-between",
                     gap: 8,
                  }}
               >
                  {/* Creator name */}
                  <span
                     style={{
                        fontSize: "0.78rem",
                        color: "var(--color-text-muted)",
                     }}
                  >
                     by{" "}
                     <span
                        style={{
                           color: "var(--color-primary-light)",
                           fontWeight: 600,
                        }}
                     >
                        {creatorName}
                     </span>
                  </span>

                  {/* Stats */}
                  <div
                     style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                     }}
                  >
                     <StatPill
                        icon="👁"
                        value={formatCount(stats?.viewers ?? 0)}
                     />
                     <StatPill
                        icon="👏"
                        value={formatCount(stats?.applauseCount ?? 0)}
                     />
                     <StatPill
                        icon="💬"
                        value={formatCount(stats?.commentCount ?? 0)}
                     />
                  </div>
               </div>
            </div>
         </div>
      </Link>
   );
}

function StatPill({ icon, value }) {
   return (
      <span
         style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: "0.72rem",
            color: "var(--color-text-muted)",
         }}
      >
         {icon} {value}
      </span>
   );
}
