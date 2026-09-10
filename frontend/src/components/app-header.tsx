"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/trips", label: "Trips" },
  { href: "/record", label: "Record" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between px-5 sm:px-8">
        <Link href="/" className="text-title font-semibold tracking-tight">
          Driver Scorecard
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2 text-small transition-colors duration-150 ease-standard",
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
