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
          prose-a:text-primary
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs
          [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:p-4
          [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:leading-relaxed
          [&_pre>code]:bg-transparent [&_pre>code]:p-0 [&_pre>code]:text-inherit
          [&_[data-rehype-pretty-code-figure]]:my-4
          [&_[data-rehype-pretty-code-figure]_pre]:bg-[#0d1117]
          prose-table:border-collapse prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:bg-muted
          prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2">
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
