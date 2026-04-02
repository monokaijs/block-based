"use client";

import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Code2,
  Columns3,
  GripVertical,
  Mail,
  MousePointerClick,
  Package,
  Rocket,
  Github,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Blocks,
    title: "Block-based editing",
    desc: "Build emails from composable blocks — headings, paragraphs, buttons, images, menus, dividers, spacers, and raw HTML.",
  },
  {
    icon: MousePointerClick,
    title: "Visual inspector",
    desc: "Click any block to inspect and edit its properties: typography, colours, padding, margins, borders, and alignment.",
  },
  {
    icon: Columns3,
    title: "Multi-column layouts",
    desc: "Arrange blocks in 1–4 column grids with flexible width ratios. Drag to reorder sections and blocks.",
  },
  {
    icon: Mail,
    title: "Email-safe HTML output",
    desc: "Renders table-based, client-compatible HTML that displays correctly across all major email clients.",
  },
  {
    icon: GripVertical,
    title: "Drag & drop",
    desc: "Reorder blocks and sections with fluid drag-and-drop powered by dnd-kit. Move blocks between columns effortlessly.",
  },
  {
    icon: Package,
    title: "Zero config install",
    desc: "One package, zero required configuration. Drop the EmailBlockEditor component into any React project.",
  },
];

const INSTALL_CMD = "npm install block-based";

const CODE_EXAMPLE = `import { EmailBlockEditor, renderEmailDocument, createEmptyDocument } from 'block-based';
import { useState } from 'react';

export function App() {
  const [doc, setDoc] = useState(createEmptyDocument);

  return (
    <>
      <EmailBlockEditor value={doc} onChange={setDoc} height="600px" />
      <button onClick={() => console.log(renderEmailDocument(doc))}>
        Export HTML
      </button>
    </>
  );
}`;

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-16 md:pt-32 md:pb-20 gap-6">
        <Badge variant="secondary" className="gap-1.5">
          <Rocket className="h-3 w-3" />
          Open Source · MIT License
        </Badge>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.08]">
          Email block editor for{" "}
          <span className="text-primary">React</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
          A composable email builder component. Design beautiful, email-client-safe
          HTML emails visually — then export with one function call.
        </p>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link href="/docs" className={cn(buttonVariants({ size: "lg" }))}>
            Get started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <a
            href="https://github.com/monokaijs/block-based"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </a>
        </div>

        {/* Install command */}
        <div className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2.5 font-mono text-sm">
          <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="select-all">{INSTALL_CMD}</span>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-5xl mx-auto flex flex-col gap-14">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Everything you need
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A full-featured email editor in a single React component.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="bg-card/50">
                <CardHeader>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-2">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Code example */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Up and running in minutes
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Install from npm, drop the component in, and start building.
          </p>

          <pre className="w-full text-left rounded-lg border bg-muted/30 p-6 font-mono text-sm leading-relaxed overflow-x-auto">
            <code>{CODE_EXAMPLE}</code>
          </pre>

          <Link href="/docs" className={cn(buttonVariants({ size: "lg" }))}>
            Read the docs <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <Separator />

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-muted-foreground">
        Block Based &mdash; MIT License &mdash;{" "}
        <a
          href="https://github.com/monokaijs/block-based"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          github.com/monokaijs/block-based
        </a>
      </footer>
    </>
  );
}
