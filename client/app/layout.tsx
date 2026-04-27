import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({
   subsets: ["latin"],
   variable: "--font-sans",
   display: "swap",
});

export const metadata: Metadata = {
   title: {
      template: "%s | MicDrop",
      default: "MicDrop — Live Performance Platform",
   },
   description:
      "Watch live performances, drop reactions, and cheer your favourite artists in real time on MicDrop.",
   keywords: [
      "live performance",
      "streaming",
      "music",
      "reactions",
      "leaderboard",
   ],
};

export default function RootLayout({
   children,
}: Readonly<{ children: React.ReactNode }>) {
   return (
      <html lang="en" className={inter.variable}>
         <body
            style={{
               minHeight: "100vh",
               display: "flex",
               flexDirection: "column",
            }}
         >
            <AuthProvider>{children}</AuthProvider>
         </body>
      </html>
   );
}
