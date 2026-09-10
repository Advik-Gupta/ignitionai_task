"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/trips", label: "Trips" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/record", label: "Record" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="text-title font-semibold tracking-tight">
          <span className="sm:hidden">Scorecard</span>
          <span className="hidden sm:inline">Driver Scorecard</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-2 py-2 text-small transition-colors duration-150 ease-standard sm:px-3",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
