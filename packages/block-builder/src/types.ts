export type EmailBlockType =
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'menu'
  | 'html';

export type MenuItem = {
  label: string;
  url: string;
};

// ─── Color palette system (shadcn UI naming) ─────────────────────────────────

/**
 * Semantic color palette following shadcn UI conventions.
 * Each token maps to a specific design role.
 */
export type ColorPalette = {
  background: string;            // page / body background
  foreground: string;            // default text color
  card: string;                  // content card / section background
  cardForeground: string;        // text on cards
  primary: string;               // primary brand color (buttons, links, CTAs)
  primaryForeground: string;     // text on primary surfaces
  secondary: string;             // secondary brand / info color
  secondaryForeground: string;   // text on secondary surfaces
  accent: string;                // highlight / accent color
  accentForeground: string;      // text on accent surfaces
  muted: string;                 // subtle backgrounds (grey areas)
  mutedForeground: string;       // captions, descriptions, subtle text
  destructive: string;           // error, delete, danger
  destructiveForeground: string; // text on destructive surfaces
  border: string;                // borders, dividers
  input: string;                 // input field borders
  ring: string;                  // focus ring color
};

/**
 * User-defined custom color with a name.
 */
export type CustomColor = {
  id: string;
  label: string;
  value: string;
};

// ─── Color palette token names ───────────────────────────────────────────────

export const COLOR_PALETTE_KEYS: (keyof ColorPalette)[] = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'accent',
  'accentForeground',
  'muted',
  'mutedForeground',
  'destructive',
  'destructiveForeground',
  'border',
  'input',
  'ring',
];

/**
 * Human-readable labels for palette tokens.
 */
export const COLOR_PALETTE_LABELS: Record<keyof ColorPalette, string> = {
  background: 'Background',
  foreground: 'Foreground',
  card: 'Card',
  cardForeground: 'Card Text',
  primary: 'Primary',
  primaryForeground: 'Primary Text',
  secondary: 'Secondary',
  secondaryForeground: 'Secondary Text',
  accent: 'Accent',
  accentForeground: 'Accent Text',
  muted: 'Muted',
  mutedForeground: 'Muted Text',
  destructive: 'Destructive',
  destructiveForeground: 'Destructive Text',
  border: 'Border',
  input: 'Input',
  ring: 'Ring',
};

// ─── Default palette ─────────────────────────────────────────────────────────

export const DEFAULT_COLOR_PALETTE: ColorPalette = {
  background: '#f5f5f4',
  foreground: '#1f2937',
  card: '#ffffff',
  cardForeground: '#111827',
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  secondary: '#7c3aed',
  secondaryForeground: '#ffffff',
  accent: '#f59e0b',
  accentForeground: '#ffffff',
  muted: '#f3f4f6',
  mutedForeground: '#6b7280',
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  border: '#e5e7eb',
  input: '#d1d5db',
  ring: '#2563eb',
};

type BaseBlock<T extends EmailBlockType> = {
  id: string;
  type: T;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
};

export type HeadingBlock = BaseBlock<'heading'> & {
  content: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: number;
  fontWeight?: number;
};

export type ParagraphBlock = BaseBlock<'paragraph'> & {
  content: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: number;
};

export type ButtonBlock = BaseBlock<'button'> & {
  label: string;
  url: string;
  align?: 'left' | 'center' | 'right';
  widthMode?: 'auto' | 'fixed' | 'percent';
  widthPx?: number;
  widthPercent?: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
};

export type ImageBlock = BaseBlock<'image'> & {
  src: string;
  alt?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
};

export type DividerBlock = BaseBlock<'divider'> & {
  color?: string;
  thickness?: number;
};

export type SpacerBlock = BaseBlock<'spacer'> & {
  height?: number;
  label?: string;
};

export type MenuBlock = BaseBlock<'menu'> & {
  items: MenuItem[];
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: number;
  itemSpacing?: number;
};

export type HtmlBlock = BaseBlock<'html'> & {
  content: string;
};

export type EmailBlock =
  | HeadingBlock
  | ParagraphBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | MenuBlock
  | HtmlBlock;

export type EmailColumn = {
  id: string;
  width: number;
  blocks: EmailBlock[];
};

export type EmailSection = {
  id: string;
  backgroundColor?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  borderRadius?: number;
  columns: EmailColumn[];
};

export type EmailDocumentSettings = {
  backgroundColor: string;
  contentBackgroundColor: string;
  contentWidth: number;
  contentAlign: 'left' | 'center' | 'right';
  contentPaddingTop: number;
  contentPaddingRight: number;
  contentPaddingBottom: number;
  contentPaddingLeft: number;
  bodyTextColor: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  preheaderText: string;
  linkColor: string;
  linkUnderline: boolean;

  /** Semantic color palette (shadcn UI convention). */
  colorPalette: ColorPalette;

  /** User-defined named custom colors. */
  customColors: CustomColor[];
};

// ─── Editor customization types ──────────────────────────────────────────────

/**
 * A pre-configured block item that shows up in the sidebar content palette.
 */
export type SampleBlock = {
  id: string;
  label: string;
  desc?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  create: () => EmailBlock;
};

/**
 * A template that adds one or more sections to the document.
 */
export type TemplateDefinition = {
  id: string;
  label: string;
  desc?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  create: () => EmailSection | EmailSection[];
};

/**
 * A user-defined sidebar tab with custom rendering.
 */
export type CustomTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  render: (context: CustomTabContext) => React.ReactNode;
};

export type CustomTabContext = {
  doc: EmailDocument;
  selection: {
    type: 'block' | 'section';
    sectionId: string;
    columnId?: string;
    blockId?: string;
  } | null;
  updateSettings: (patch: Partial<EmailDocumentSettings>) => void;
};

/**
 * Feature flags to enable/disable editor capabilities.
 * All default to `true` unless explicitly set to `false`.
 */
export type EditorFeatures = {
  /** Content palette tab (block dragging). */
  content: boolean;
  /** Rows palette tab (layouts). */
  rows: boolean;
  /** Prebuilt section templates tab. */
  templates: boolean;
  /** Document tree view tab. */
  treeView: boolean;
  /** JSON document viewer tab. */
  json: boolean;
  /** HTML output viewer tab. */
  html: boolean;
  /** Body settings tab. */
  bodySettings: boolean;
  /** Preview mode toggle. */
  preview: boolean;
  /** Drag-and-drop block reordering. */
  dragDrop: boolean;
  /** Custom color management in palette. */
  customColors: boolean;
};

export type EditorThemeMode = 'light' | 'dark';

export type EmailDocument = {
  version: 1;
  settings: EmailDocumentSettings;
  sections: EmailSection[];
};