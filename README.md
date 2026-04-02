# block-based

A composable, block-based email builder component for React. Drag-and-drop blocks, multi-column layouts, live preview, and HTML rendering — all in a single dependency.

[![npm version](https://img.shields.io/npm/v/block-based)](https://www.npmjs.com/package/block-based)
[![license](https://img.shields.io/npm/l/block-based)](https://github.com/monokaijs/block-based/blob/main/LICENSE)

**[Documentation](https://blockbased.creaton.dev/docs)** · **[Live Demo](https://blockbased.creaton.dev/example)**

## Features

- **8 block types** — Heading, Paragraph, Button, Image, Divider, Spacer, Menu, HTML
- **Multi-column layouts** — 1 to 4 columns with adjustable widths
- **Drag-and-drop** — Reorder blocks and rows via `@dnd-kit`
- **Live preview** — Desktop, tablet, and mobile viewports
- **HTML rendering** — Generate email-compatible HTML from the document model
- **Color palette** — Semantic token system (shadcn UI conventions) with custom color support
- **Light/dark theme** — `theme="light"` or `theme="dark"` for the editor UI
- **Customizable** — Feature flags, custom sidebar tabs, sample blocks, templates
- **Zero CSS** — All styles are inline; no external stylesheets needed
- **TypeScript** — Fully typed API with exported types

## Installation

```bash
npm install block-based
# or
pnpm add block-based
# or
yarn add block-based
```

### Peer dependencies

`block-based` requires the following peer dependencies:

```bash
npm install react react-dom lucide-react
```

## Quick start

```tsx
import { useState } from "react";
import { EmailBlockEditor, createEmptyDocument } from "block-based";
import type { EmailDocument } from "block-based";

function App() {
  const [doc, setDoc] = useState<EmailDocument>(createEmptyDocument);

  return (
    <EmailBlockEditor
      value={doc}
      onChange={setDoc}
      height="100vh"
    />
  );
}
```

## Rendering to HTML

```tsx
import { renderEmailDocument } from "block-based";

const html = renderEmailDocument(doc);
// → Full email-compatible HTML string
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `EmailDocument` | — | Controlled document state |
| `onChange` | `(doc: EmailDocument) => void` | — | Called on every edit |
| `height` | `string \| number` | `'100%'` | Editor container height |
| `theme` | `'light' \| 'dark'` | `'light'` | Editor UI color scheme |
| `defaultPalette` | `Partial<ColorPalette>` | — | Override default color palette tokens |
| `sampleBlocks` | `SampleBlock[]` | — | Extra blocks in the Content tab |
| `templates` | `TemplateDefinition[]` | — | Extra templates in the Templates tab |
| `customTabs` | `CustomTab[]` | — | Custom sidebar tabs |
| `features` | `Partial<EditorFeatures>` | all `true` | Enable/disable editor capabilities |

## Feature flags

Toggle individual editor capabilities via the `features` prop:

```tsx
<EmailBlockEditor
  features={{
    content: true,      // Content palette tab
    rows: true,         // Rows/layouts palette tab
    templates: true,    // Prebuilt section templates tab
    treeView: true,     // Document tree view tab
    json: false,        // Hide the built-in JSON tab
    html: false,        // Hide the built-in HTML tab
    bodySettings: true, // Body settings panel
    preview: true,      // Preview mode toggle
    dragDrop: true,     // Drag-and-drop reordering
    customColors: true, // Custom color management
  }}
/>
```

Use these flags to customize the main sidebar tab bar. Any `customTabs` you provide are appended after the built-in tabs that remain visible.

## Block types

| Type | Description |
|------|-------------|
| `heading` | Heading text with configurable size, weight, color, alignment |
| `paragraph` | Body text with font size, color, alignment |
| `button` | CTA button with URL, colors, border radius, width modes |
| `image` | Image with URL, alt text, width, alignment |
| `divider` | Horizontal rule with color and thickness |
| `spacer` | Empty space with configurable height |
| `menu` | Navigation links with spacing and alignment |
| `html` | Raw HTML block for custom content |

## Document model

```ts
type EmailDocument = {
  version: 1;
  settings: EmailDocumentSettings; // colors, fonts, layout
  sections: EmailSection[];        // rows of content
};

type EmailSection = {
  id: string;
  columns: EmailColumn[];        // 1–4 columns per row
  backgroundColor?: string;
  // padding, margin, border, opacity, borderRadius...
};

type EmailColumn = {
  id: string;
  width: number;                 // percentage width (e.g. 50)
  blocks: EmailBlock[];          // content blocks
};
```

## Development

This is a [Turborepo](https://turbo.build/repo) monorepo using [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

### Structure

```
packages/
  block-builder/     # Core library (published as `block-based`)
apps/
  landing/           # Documentation site & live example
```

## License

[MIT](https://github.com/monokaijs/block-based/blob/main/LICENSE)
