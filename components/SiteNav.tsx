import Link from "next/link";
import { BarChart3, CalendarDays, LogIn, LogOut, Settings, ShieldCheck, Table2, Trophy, Users } from "lucide-react";
import { signOut } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Dashboard", icon: Trophy },
  { href: "/squad", label: "Squad", icon: Users },
  { href: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { href: "/standings", label: "Standings", icon: Table2 },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/rules", label: "Rules", icon: ShieldCheck },
  { href: "/admin", label: "Admin", icon: Settings }
];

export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060a0f]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-pitch/30 bg-pitch/15 text-pitch">
            <Trophy className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-xl uppercase leading-none text-white sm:text-2xl">FC26 League</span>
            <span className="hidden font-label text-xs uppercase tracking-wide text-muted sm:block">Group Chat Tournament</span>
          </span>
        </Link>
        <nav className="scrollbar-thin ml-auto flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 font-label text-sm uppercase tracking-wide text-muted transition hover:bg-white/[0.07] hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {user ? (
            <form action={signOut} className="shrink-0">
              <Button type="submit" variant="secondary" size="sm" title={user.email ?? undefined}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          ) : (
            <Link
              href="/admin"
              className="ml-1 inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-pitch/50 bg-pitch px-3 font-label text-sm uppercase tracking-wide text-[#031008] shadow-glow transition hover:bg-[#22df73]"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
