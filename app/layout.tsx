import type { Metadata } from "next";
import "./globals.css";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "FC25 Group Chat Tournament",
  description: "A premium dashboard for managing your EA Sports FC 25 group-chat league."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <RealtimeRefresh />
        <SiteNav />
        <main className="pitch-grid min-h-screen">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
