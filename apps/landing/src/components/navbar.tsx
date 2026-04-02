"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-primary text-lg">&#x2B61;</span>
          Block Based
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "transition-colors hover:text-foreground",
                pathname?.startsWith(l.href)
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <a
          href="https://github.com/monokaijs/block-based"
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <Github className="h-4 w-4" />
          <span className="sr-only">GitHub</span>
        </a>
      </div>
    </header>
  );
}
