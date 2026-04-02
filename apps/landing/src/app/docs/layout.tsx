"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";

const SIDEBAR = [
  { title: "Getting Started", href: "/docs" },
  { title: "EmailBlockEditor", href: "/docs/editor" },
  { title: "Rendering HTML", href: "/docs/rendering" },
  { title: "Document Model", href: "/docs/document-model" },
  { title: "Block Types", href: "/docs/blocks" },
  { title: "Sections & Layouts", href: "/docs/sections" },
  { title: "Customization", href: "/docs/customization" },
  { title: "API Reference", href: "/docs/api" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="mx-auto flex max-w-6xl flex-1 px-6 py-10 gap-10">
        <Sidebar />
        <main className="min-w-0 flex-1 prose prose-invert prose-sm max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-a:text-primary prose-pre:bg-muted/30 prose-pre:border
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs">
          {children}
        </main>
      </div>
    </>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="sticky top-20 flex flex-col gap-1 text-sm">
        {SIDEBAR.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors hover:text-foreground",
              pathname === item.href
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
