import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "FC26 Group Chat Tournament",
  description: "A premium dashboard for managing your EA Sports FC 26 group-chat league."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <RealtimeRefresh />
          <SiteNav />
          <main className="pitch-grid min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
