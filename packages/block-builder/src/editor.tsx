'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Braces,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  Copy,
  Eye,
  EyeOff,
  FileCode,
  Heading1,
  Image,
  Laptop,
  Layers,
  Link,
  ListTree,
  Menu as MenuIcon,
  MessageSquare,
  MinusSquare,
  Moon,
  MousePointerClick,
  MoveVertical,
  GripVertical,
  Paintbrush,
  Pencil,
  Plus,
  Rows4,
  Search,
  SeparatorHorizontal,
  Smartphone,
  Sun,
  Tablet,
  Trash2,
  Type as TypeIcon,
  X,
  type LucideProps,
} from 'lucide-react';
import type {
  EmailBlock,
  EmailBlockType,
  EmailColumn,
  EmailDocument,
  MenuItem,
  EmailSection,
  ColorPalette,
  CustomColor,
  SampleBlock,
  TemplateDefinition,
  CustomTab,
  EditorFeatures,
  EditorThemeMode,
} from './types';
import { COLOR_PALETTE_KEYS, COLOR_PALETTE_LABELS, DEFAULT_COLOR_PALETTE } from './types';
import { createBlock } from './blocks';
import { createEmptyDocument, normalizeDocument } from './document';
import { createSectionTemplate, normalizeSection } from './section';
import { renderEmailDocument } from './render';
import { nextId } from './utils';

// ─── Theme tokens ────────────────────────────────────────────────────────────

type ThemeTokens = {
  // Surfaces
  bg: string;
  bgSubtle: string;
  bgMuted: string;
  bgHover: string;
  bgAccentSubtle: string;
  canvasBg: string;
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  textOnAccent: string;
  // Borders
  border: string;
  borderSubtle: string;
  // Accent
  accent: string;
  accentHover: string;
  accentBg: string;
  // Danger
  danger: string;
  dangerHover: string;
  dangerBg: string;
  // Block interactions
  blockHover: string;
  blockSelected: string;
  sectionHover: string;
  // Dialog
  dialogOverlay: string;
  dialogShadow: string;
  // Scrollbar (for custom scrollbars if needed)
  scrollbarThumb: string;
};

const LIGHT_THEME: ThemeTokens = {
  bg: '#ffffff',
  bgSubtle: '#fafafa',
  bgMuted: '#f4f4f5',
  bgHover: '#f4f4f5',
  bgAccentSubtle: '#f8faff',
  canvasBg: '#d4d4d8',
  text: '#18181b',
  textSecondary: '#52525b',
  textMuted: '#71717a',
  textFaint: '#a1a1aa',
  textOnAccent: '#ffffff',
  border: '#e4e4e7',
  borderSubtle: '#e5e7eb',
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  accentBg: '#dbeafe',
  danger: '#dc2626',
  dangerHover: '#b91c1c',
  dangerBg: '#fef2f2',
  blockHover: 'rgba(37,99,235,0.08)',
  blockSelected: '#2563eb',
  sectionHover: 'rgba(37,99,235,0.05)',
  dialogOverlay: 'rgba(0,0,0,0.4)',
  dialogShadow: '0 20px 60px rgba(0,0,0,.2)',
  scrollbarThumb: '#d4d4d8',
};

const DARK_THEME: ThemeTokens = {
  bg: '#09090b',
  bgSubtle: '#18181b',
  bgMuted: '#27272a',
  bgHover: '#27272a',
  bgAccentSubtle: '#0f172a',
  canvasBg: '#18181b',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textFaint: '#52525b',
  textOnAccent: '#ffffff',
  border: '#27272a',
  borderSubtle: '#3f3f46',
  accent: '#3b82f6',
  accentHover: '#60a5fa',
  accentBg: '#172554',
  danger: '#f87171',
  dangerHover: '#fca5a5',
  dangerBg: '#450a0a',
  blockHover: 'rgba(59,130,246,0.12)',
  blockSelected: '#3b82f6',
  sectionHover: 'rgba(59,130,246,0.08)',
  dialogOverlay: 'rgba(0,0,0,0.6)',
  dialogShadow: '0 20px 60px rgba(0,0,0,.5)',
  scrollbarThumb: '#3f3f46',
};

function getTheme(mode: EditorThemeMode): ThemeTokens {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}

const ThemeContext = React.createContext<ThemeTokens>(LIGHT_THEME);

function useT(): ThemeTokens {
  return React.useContext(ThemeContext);
}


// ─── Internal types ───────────────────────────────────────────────────────────

type Selection =
  | { type: 'block'; sectionId: string; columnId: string; blockId: string }
  | { type: 'section'; sectionId: string }
  | null;

type SidebarTab = 'blocks' | 'sections' | 'templates' | 'tree' | string;
type ViewMode = 'desktop' | 'tablet' | 'mobile';

const DEFAULT_FEATURES: EditorFeatures = {
  content: true,
  rows: true,
  templates: true,
  treeView: true,
  bodySettings: true,
  preview: true,
  dragDrop: true,
  customColors: true,
};

export interface EmailBlockEditorProps {
  value?: EmailDocument;
  onChange?: (doc: EmailDocument) => void;
  height?: string | number;

  /** Editor UI theme. Defaults to 'light'. */
  theme?: EditorThemeMode;

  /** Override default color palette values. */
  defaultPalette?: Partial<ColorPalette>;

  /** Extra pre-configured blocks shown in the Content tab. */
  sampleBlocks?: SampleBlock[];

  /** Extra templates shown in the Templates tab. */
  templates?: TemplateDefinition[];

  /** User-defined sidebar tabs rendered after built-in tabs. */
  customTabs?: CustomTab[];

  /** Feature flags to enable/disable capabilities (all default true). */
  features?: Partial<EditorFeatures>;

  /** Called when the user toggles the theme from within the editor. */
  onThemeChange?: (theme: EditorThemeMode) => void;
}

// ─── Document update helpers ──────────────────────────────────────────────────

function mapSection(
  doc: EmailDocument,
  sectionId: string,
  fn: (s: EmailSection) => EmailSection,
): EmailDocument {
  return { ...doc, sections: doc.sections.map((s) => (s.id === sectionId ? fn(s) : s)) };
}

function mapBlock(
  doc: EmailDocument,
  sectionId: string,
  columnId: string,
  blockId: string,
  fn: (b: EmailBlock) => EmailBlock,
): EmailDocument {
  return mapSection(doc, sectionId, (s) => ({
    ...s,
    columns: s.columns.map((c) =>
      c.id !== columnId
        ? c
        : { ...c, blocks: c.blocks.map((b) => (b.id === blockId ? fn(b) : b)) },
    ),
  }));
}

function moveItem<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const next = index + dir;
  if (next < 0 || next >= arr.length) return arr;
  const result = [...arr];
  [result[index], result[next]] = [result[next], result[index]];
  return result;
}

function findBlock(
  doc: EmailDocument,
  sectionId: string,
  columnId: string,
  blockId: string,
): EmailBlock | undefined {
  const section = doc.sections.find((s) => s.id === sectionId);
  const column = section?.columns.find((c) => c.id === columnId);
  return column?.blocks.find((b) => b.id === blockId);
}

function findSection(doc: EmailDocument, sectionId: string): EmailSection | undefined {
  return doc.sections.find((s) => s.id === sectionId);
}

/** Creates a block with default colors derived from the document palette. */
function createBlockWithPalette(type: EmailBlockType, palette: ColorPalette): EmailBlock {
  const base = createBlock(type);
  switch (type) {
    case 'heading':
      return { ...base, color: palette.foreground } as EmailBlock;
    case 'paragraph':
      return { ...base, color: palette.mutedForeground } as EmailBlock;
    case 'button':
      return { ...base, backgroundColor: palette.primary, textColor: palette.primaryForeground } as EmailBlock;
    case 'divider':
      return { ...base, color: palette.border } as EmailBlock;
    case 'menu':
      return { ...base, color: palette.foreground } as EmailBlock;
    default:
      return base;
  }
}

const ROW_LAYOUT_OPTIONS: Array<{ label: string; widths: number[] }> = [
  { label: '1 Col', widths: [100] },
  { label: '2 Col', widths: [50, 50] },
  { label: '3 Col', widths: [100 / 3, 100 / 3, 100 / 3] },
  { label: '4 Col', widths: [25, 25, 25, 25] },
  { label: '35 / 65', widths: [35, 65] },
  { label: '65 / 35', widths: [65, 35] },
];

function applyRowLayout(section: EmailSection, widths: number[]): EmailSection {
  const existingColumns = section.columns;
  const overflowBlocks = existingColumns.slice(widths.length).flatMap((column) => column.blocks);
  const columns = widths.map((width, index) => {
    const existingColumn = existingColumns[index];
    const carriedBlocks = existingColumn?.blocks ?? [];
    const mergedBlocks = index === widths.length - 1 ? [...carriedBlocks, ...overflowBlocks] : carriedBlocks;
    return {
      id: existingColumn?.id ?? nextId('col'),
      width,
      blocks: mergedBlocks,
    };
  });

  return {
    ...section,
    columns,
  };
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const C = useT();
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function inputStyle(C: ThemeTokens): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: '5px 7px',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    fontSize: 12,
    background: C.bgSubtle,
    color: C.text,
    outline: 'none',
  };
}

function textareaStyle(C: ThemeTokens): React.CSSProperties {
  return {
    ...inputStyle(C),
    minHeight: 100,
    resize: 'vertical',
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
  };
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const C = useT();
  return <input style={inputStyle(C)} value={value} onChange={(e) => onChange(e.target.value)} />;
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const C = useT();
  return (
    <select
      style={{ ...inputStyle(C), appearance: 'none', cursor: 'pointer' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const C = useT();
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const clamp = useCallback(
    (next: number) => {
      let clamped = next;
      if (typeof min === 'number') clamped = Math.max(min, clamped);
      if (typeof max === 'number') clamped = Math.min(max, clamped);
      return clamped;
    },
    [min, max],
  );

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const applyDelta = useCallback(
    (delta: number) => {
      const nextValue = clamp(valueRef.current + delta);
      valueRef.current = nextValue;
      onChange(nextValue);
    },
    [clamp, onChange],
  );

  const startHold = useCallback(
    (delta: number) => {
      applyDelta(delta);
      stopHold();
      holdTimeoutRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          applyDelta(delta);
        }, 65);
      }, 260);
    },
    [applyDelta, stopHold],
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        style={{ ...inputStyle(C), width: '100%', paddingRight: 40 }}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
      />
      <div style={{ position: 'absolute', top: 2, right: 2, bottom: 2, display: 'flex', gap: 2 }}>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(-1);
          }}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          style={{
            width: 20,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            background: C.bgMuted,
            color: C.textSecondary,
            cursor: 'pointer',
            fontSize: 12,
            lineHeight: '12px',
            padding: 0,
          }}
          aria-label="Decrease value"
        >
          -
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(1);
          }}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          style={{
            width: 20,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            background: C.bgMuted,
            color: C.textSecondary,
            cursor: 'pointer',
            fontSize: 12,
            lineHeight: '12px',
            padding: 0,
          }}
          aria-label="Increase value"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const C = useT();
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 32, height: 32, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', padding: 2, background: 'none' }} />
      <input style={{ ...inputStyle(C), flex: 1, fontFamily: 'monospace' }} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ─── Palette-aware color picker ──────────────────────────────────────────────

const PaletteContext = React.createContext<{
  palette: ColorPalette;
  customColors: CustomColor[];
}>({ palette: DEFAULT_COLOR_PALETTE, customColors: [] });

function PaletteColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const C = useT();
  const { palette, customColors } = React.useContext(PaletteContext);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const paletteGroups: Array<{ label: string; keys: (keyof ColorPalette)[] }> = [
    { label: 'Base', keys: ['background', 'foreground'] },
    { label: 'Card', keys: ['card', 'cardForeground'] },
    { label: 'Primary', keys: ['primary', 'primaryForeground'] },
    { label: 'Secondary', keys: ['secondary', 'secondaryForeground'] },
    { label: 'Accent', keys: ['accent', 'accentForeground'] },
    { label: 'Muted', keys: ['muted', 'mutedForeground'] },
    { label: 'Destructive', keys: ['destructive', 'destructiveForeground'] },
    { label: 'Border', keys: ['border', 'input', 'ring'] },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div
          onClick={() => setOpen(!open)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            background: value,
            cursor: 'pointer',
            flexShrink: 0,
            position: 'relative',
          }}
        />
        <input
          style={{ ...inputStyle(C), flex: 1, fontFamily: 'monospace' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
        />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 200,
            marginTop: 4,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.15)',
            padding: 8,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {paletteGroups.map(({ label, keys }) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 4px' }}>
                {label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {keys.map((key) => {
                  const color = palette[key];
                  const isActive = value.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={key}
                      onClick={() => { onChange(color); setOpen(false); }}
                      title={`${COLOR_PALETTE_LABELS[key]}: ${color}`}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        border: isActive ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                        background: color,
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: isActive ? `0 0 0 1px ${C.accent}` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {customColors.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 4px' }}>
                Custom
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {customColors.map((cc) => {
                  const isActive = value.toLowerCase() === cc.value.toLowerCase();
                  return (
                    <button
                      key={cc.id}
                      onClick={() => { onChange(cc.value); setOpen(false); }}
                      title={`${cc.label}: ${cc.value}`}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        border: isActive ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                        background: cc.value,
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: isActive ? `0 0 0 1px ${C.accent}` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 24, height: 24, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', padding: 1, background: 'none' }}
            />
            <input
              style={{ ...inputStyle(C), flex: 1, fontFamily: 'monospace', fontSize: 11 }}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setOpen(false); }}
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Color Palette Dialog ────────────────────────────────────────────────────

function ColorPaletteSection({
  doc,
  onUpdateSettings,
}: {
  doc: EmailDocument;
  onUpdateSettings: (patch: Partial<EmailDocument['settings']>) => void;
}) {
  const C = useT();
  const [dialogOpen, setDialogOpen] = useState(false);
  const allColors = [
    ...COLOR_PALETTE_KEYS.map((k) => doc.settings.colorPalette[k]),
    ...doc.settings.customColors.map((cc) => cc.value),
  ];
  // Show up to 17 swatches in a compact grid
  const previewColors = allColors.slice(0, 17);
  const extraCount = allColors.length - previewColors.length;

  return (
    <InspectorSection
      title="Color Palette"
      rightSlot={
        <button
          onClick={() => setDialogOpen(true)}
          style={{
            padding: '3px 8px',
            border: `1px solid ${C.border}`,
            borderRadius: 5,
            background: C.bgSubtle,
            color: C.textSecondary,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Pencil size={10} /> Manage
        </button>
      }
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {previewColors.map((color, i) => (
          <div
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              background: color,
              border: `1px solid ${C.border}`,
              cursor: 'pointer',
            }}
            title={color}
            onClick={() => setDialogOpen(true)}
          />
        ))}
        {extraCount > 0 && (
          <div
            onClick={() => setDialogOpen(true)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              border: `1px solid ${C.border}`,
              background: C.bgMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: C.textMuted,
              cursor: 'pointer',
            }}
          >
            +{extraCount}
          </div>
        )}
      </div>
      {dialogOpen && (
        <ColorPaletteDialog
          palette={doc.settings.colorPalette}
          customColors={doc.settings.customColors}
          onUpdatePalette={(p) => onUpdateSettings({ colorPalette: p })}
          onUpdateCustomColors={(c) => onUpdateSettings({ customColors: c })}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </InspectorSection>
  );
}

const PALETTE_GROUPS: Array<{ label: string; keys: (keyof ColorPalette)[] }> = [
  { label: 'Base', keys: ['background', 'foreground'] },
  { label: 'Card', keys: ['card', 'cardForeground'] },
  { label: 'Primary', keys: ['primary', 'primaryForeground'] },
  { label: 'Secondary', keys: ['secondary', 'secondaryForeground'] },
  { label: 'Accent', keys: ['accent', 'accentForeground'] },
  { label: 'Muted', keys: ['muted', 'mutedForeground'] },
  { label: 'Destructive', keys: ['destructive', 'destructiveForeground'] },
  { label: 'Borders', keys: ['border', 'input', 'ring'] },
];

function ColorPaletteDialog({
  palette,
  customColors,
  onUpdatePalette,
  onUpdateCustomColors,
  onClose,
}: {
  palette: ColorPalette;
  customColors: CustomColor[];
  onUpdatePalette: (palette: ColorPalette) => void;
  onUpdateCustomColors: (colors: CustomColor[]) => void;
  onClose: () => void;
}) {
  const C = useT();
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const query = search.toLowerCase().trim();

  const filteredGroups = PALETTE_GROUPS.map((g) => ({
    ...g,
    keys: g.keys.filter((k) => {
      if (!query) return true;
      return (
        COLOR_PALETTE_LABELS[k].toLowerCase().includes(query) ||
        palette[k].toLowerCase().includes(query) ||
        k.toLowerCase().includes(query)
      );
    }),
  })).filter((g) => g.keys.length > 0);

  const filteredCustom = customColors.filter((cc) => {
    if (!query) return true;
    return (
      cc.label.toLowerCase().includes(query) ||
      cc.value.toLowerCase().includes(query)
    );
  });

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: C.dialogOverlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          width: 520,
          maxHeight: '80vh',
          background: C.bg,
          borderRadius: 12,
          boxShadow: C.dialogShadow,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <Paintbrush size={18} style={{ color: C.accent }} />
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.text }}>Color Palette</div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: C.bgMuted, color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px 8px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 32, top: 23, color: C.textFaint, pointerEvents: 'none' }} />
          <input
            style={{ ...inputStyle(C), paddingLeft: 30, width: '100%', fontSize: 13 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colors..."
            autoFocus
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
          {filteredGroups.map(({ label, keys }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
                {keys.map((key) => {
                  const color = palette[key];
                  const name = COLOR_PALETTE_LABELS[key];
                  const isEditing = editingKey === key;
                  const isHovered = hoveredKey === key;
                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setHoveredKey(key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      style={{
                        position: 'relative',
                        borderRadius: 8,
                        border: `1px solid ${isHovered ? C.accent : C.border}`,
                        background: isHovered ? C.bgAccentSubtle : C.bgSubtle,
                        padding: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => setEditingKey(isEditing ? null : key)}
                    >
                      <div style={{
                        width: '100%',
                        height: 32,
                        borderRadius: 5,
                        background: color,
                        border: `1px solid ${C.border}`,
                        marginBottom: 6,
                      }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 10, color: C.textFaint, fontFamily: 'monospace' }}>
                        {color}
                      </div>
                      {isEditing && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => onUpdatePalette({ ...palette, [key]: e.target.value })}
                            style={{ width: 24, height: 24, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', padding: 1, background: 'none', flexShrink: 0 }}
                          />
                          <input
                            style={{ ...inputStyle(C), flex: 1, fontFamily: 'monospace', fontSize: 11 }}
                            value={color}
                            onChange={(e) => onUpdatePalette({ ...palette, [key]: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Colors */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Custom Colors
              </div>
              <button
                onClick={() => {
                  const newColor: CustomColor = { id: nextId('cc'), label: 'Custom', value: '#6366f1' };
                  onUpdateCustomColors([...customColors, newColor]);
                }}
                style={{
                  padding: '3px 8px',
                  border: `1px solid ${C.border}`,
                  borderRadius: 5,
                  background: C.bgSubtle,
                  color: C.textSecondary,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Plus size={11} /> Add
              </button>
            </div>
            {filteredCustom.length === 0 && customColors.length === 0 && (
              <div style={{ fontSize: 12, color: C.textFaint, padding: '12px 0', textAlign: 'center' }}>
                No custom colors yet. Add one to get started.
              </div>
            )}
            {filteredCustom.length === 0 && customColors.length > 0 && query && (
              <div style={{ fontSize: 12, color: C.textFaint, padding: '12px 0', textAlign: 'center' }}>
                No matching custom colors.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
              {filteredCustom.map((cc, idx) => {
                const realIdx = customColors.findIndex((c) => c.id === cc.id);
                const isEditing = editingKey === `custom-${cc.id}`;
                const isHovered = hoveredKey === `custom-${cc.id}`;
                return (
                  <div
                    key={cc.id}
                    onMouseEnter={() => setHoveredKey(`custom-${cc.id}`)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      position: 'relative',
                      borderRadius: 8,
                      border: `1px solid ${isHovered ? C.accent : C.border}`,
                      background: isHovered ? C.bgAccentSubtle : C.bgSubtle,
                      padding: 8,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => setEditingKey(isEditing ? null : `custom-${cc.id}`)}
                  >
                    <div style={{
                      width: '100%',
                      height: 32,
                      borderRadius: 5,
                      background: cc.value,
                      border: `1px solid ${C.border}`,
                      marginBottom: 6,
                    }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cc.label}
                    </div>
                    <div style={{ fontSize: 10, color: C.textFaint, fontFamily: 'monospace' }}>
                      {cc.value}
                    </div>
                    {isEditing && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          style={{ ...inputStyle(C), fontSize: 11 }}
                          value={cc.label}
                          onChange={(e) => {
                            const updated = [...customColors];
                            updated[realIdx] = { ...cc, label: e.target.value };
                            onUpdateCustomColors(updated);
                          }}
                          placeholder="Color name"
                        />
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={cc.value}
                            onChange={(e) => {
                              const updated = [...customColors];
                              updated[realIdx] = { ...cc, value: e.target.value };
                              onUpdateCustomColors(updated);
                            }}
                            style={{ width: 24, height: 24, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', padding: 1, background: 'none', flexShrink: 0 }}
                          />
                          <input
                            style={{ ...inputStyle(C), flex: 1, fontFamily: 'monospace', fontSize: 11 }}
                            value={cc.value}
                            onChange={(e) => {
                              const updated = [...customColors];
                              updated[realIdx] = { ...cc, value: e.target.value };
                              onUpdateCustomColors(updated);
                            }}
                          />
                          <button
                            onClick={() => {
                              const updated = customColors.filter((_, i) => i !== realIdx);
                              onUpdateCustomColors(updated);
                              setEditingKey(null);
                            }}
                            title="Remove"
                            style={{ width: 24, height: 24, border: `1px solid ${C.border}`, borderRadius: 4, background: C.bg, color: C.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlignButtons({ value, onChange }: { value?: string; onChange: (v: 'left' | 'center' | 'right') => void }) {
  const C = useT();
  const opts: Array<{ v: 'left' | 'center' | 'right'; Icon: React.FC<LucideProps> }> = [
    { v: 'left', Icon: AlignLeft },
    { v: 'center', Icon: AlignCenter },
    { v: 'right', Icon: AlignRight },
  ];
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {opts.map(({ v, Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            flex: 1,
            padding: '5px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${value === v ? C.accent : C.border}`,
            borderRadius: 5,
            background: value === v ? C.accent : C.bgSubtle,
            color: value === v ? C.textOnAccent : C.textMuted,
            cursor: 'pointer',
          }}
          title={v}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

type PaddingPatch = {
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
};

type PaddingMode = 'basic' | 'advanced';

type PaddingValue = {
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
};

type BoxKind = 'padding' | 'margin';

function PaddingControls({
  value,
  kind,
  mode,
  onChange,
}: {
  value: PaddingValue;
  kind: BoxKind;
  mode: PaddingMode;
  onChange: (patch: PaddingPatch) => void;
}) {
  const C = useT();
  const top = kind === 'padding' ? value.paddingTop ?? 0 : value.marginTop ?? 0;
  const right = kind === 'padding' ? value.paddingRight ?? 0 : value.marginRight ?? 0;
  const bottom = kind === 'padding' ? value.paddingBottom ?? 0 : value.marginBottom ?? 0;
  const left = kind === 'padding' ? value.paddingLeft ?? 0 : value.marginLeft ?? 0;

  const getPatch = (next: { top?: number; right?: number; bottom?: number; left?: number }): PaddingPatch => {
    const patch: PaddingPatch = {};
    if (kind === 'padding') {
      if (next.top !== undefined) patch.paddingTop = next.top;
      if (next.right !== undefined) patch.paddingRight = next.right;
      if (next.bottom !== undefined) patch.paddingBottom = next.bottom;
      if (next.left !== undefined) patch.paddingLeft = next.left;
      return patch;
    }
    if (next.top !== undefined) patch.marginTop = next.top;
    if (next.right !== undefined) patch.marginRight = next.right;
    if (next.bottom !== undefined) patch.marginBottom = next.bottom;
    if (next.left !== undefined) patch.marginLeft = next.left;
    return patch;
  };

  const vertical = top;
  const horizontal = left;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mode === 'basic' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Field label="Vertical">
              <NumberInput
                value={vertical}
                min={0}
                onChange={(v) => onChange(getPatch({ top: v, bottom: v }))}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Horizontal">
              <NumberInput
                value={horizontal}
                min={0}
                onChange={(v) => onChange(getPatch({ left: v, right: v }))}
              />
            </Field>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <Field label="Top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
                <ArrowUp size={12} />
              </div>
              <div style={{ flex: 1 }}>
                <NumberInput
                  value={top}
                  min={0}
                  onChange={(v) => onChange(getPatch({ top: v }))}
                />
              </div>
            </div>
          </Field>
          <Field label="Right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
                <ArrowRight size={12} />
              </div>
              <div style={{ flex: 1 }}>
                <NumberInput
                  value={right}
                  min={0}
                  onChange={(v) => onChange(getPatch({ right: v }))}
                />
              </div>
            </div>
          </Field>
          <Field label="Bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
                <ArrowDown size={12} />
              </div>
              <div style={{ flex: 1 }}>
                <NumberInput
                  value={bottom}
                  min={0}
                  onChange={(v) => onChange(getPatch({ bottom: v }))}
                />
              </div>
            </div>
          </Field>
          <Field label="Left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted }}>
                <ArrowLeft size={12} />
              </div>
              <div style={{ flex: 1 }}>
                <NumberInput
                  value={left}
                  min={0}
                  onChange={(v) => onChange(getPatch({ left: v }))}
                />
              </div>
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

function InspectorSection({
  title,
  rightSlot,
  children,
}: {
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const C = useT();
  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

function PaddingModeToggle({
  mode,
  onChange,
}: {
  mode: PaddingMode;
  onChange: (mode: PaddingMode) => void;
}) {
  const C = useT();
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 2, borderRadius: 999, border: `1px solid ${C.border}`, background: C.bgSubtle }}>
      <button
        onClick={() => onChange('basic')}
        style={{
          border: 'none',
          borderRadius: 999,
          padding: '2px 7px',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          background: mode === 'basic' ? C.accent : 'transparent',
          color: mode === 'basic' ? C.textOnAccent : C.textMuted,
          cursor: 'pointer',
        }}
      >
        Basic
      </button>
      <button
        onClick={() => onChange('advanced')}
        style={{
          border: 'none',
          borderRadius: 999,
          padding: '2px 7px',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          background: mode === 'advanced' ? C.accent : 'transparent',
          color: mode === 'advanced' ? C.textOnAccent : C.textMuted,
          cursor: 'pointer',
        }}
      >
        Adv
      </button>
    </div>
  );
}

function SpacingSection({
  value,
  onChange,
}: {
  value: PaddingValue;
  onChange: (patch: PaddingPatch) => void;
}) {
  const C = useT();
  const [mode, setMode] = useState<PaddingMode>(() => {
    const vertical = value.paddingTop ?? 0;
    const horizontal = value.paddingLeft ?? 0;
    const isSymmetric =
      (value.paddingBottom ?? 0) === vertical &&
      (value.paddingRight ?? 0) === horizontal;
    return isSymmetric ? 'basic' : 'advanced';
  });

  return (
    <InspectorSection
      title="Position"
      rightSlot={<PaddingModeToggle mode={mode} onChange={setMode} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, background: C.bgSubtle }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 6 }}>Padding</div>
          <PaddingControls value={value} kind="padding" mode={mode} onChange={onChange} />
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, background: C.bgSubtle }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 6 }}>Margin</div>
          <PaddingControls value={value} kind="margin" mode={mode} onChange={onChange} />
        </div>
      </div>
    </InspectorSection>
  );
}

function VisibilitySection({
  value,
  onChange,
  showBorderRadius = false,
}: {
  value: PaddingValue;
  onChange: (patch: PaddingPatch) => void;
  showBorderRadius?: boolean;
}) {
  return (
    <InspectorSection title="Visibility">
      <Field label="Alpha (%)">
        <NumberInput value={value.opacity ?? 100} min={0} max={100} onChange={(v) => onChange({ opacity: v })} />
      </Field>
      {showBorderRadius && (
        <Field label="Border Radius">
          <NumberInput value={value.borderRadius ?? 0} min={0} max={200} onChange={(v) => onChange({ borderRadius: v })} />
        </Field>
      )}
    </InspectorSection>
  );
}

function BorderSection({
  value,
  onChange,
}: {
  value: PaddingValue;
  onChange: (patch: PaddingPatch) => void;
}) {
  const [mode, setMode] = useState<PaddingMode>(() => {
    const top = value.borderTopWidth ?? 0;
    const right = value.borderRightWidth ?? 0;
    const bottom = value.borderBottomWidth ?? 0;
    const left = value.borderLeftWidth ?? 0;
    return top === right && right === bottom && bottom === left ? 'basic' : 'advanced';
  });

  const top = value.borderTopWidth ?? 0;
  const right = value.borderRightWidth ?? 0;
  const bottom = value.borderBottomWidth ?? 0;
  const left = value.borderLeftWidth ?? 0;

  return (
    <InspectorSection title="Border" rightSlot={<PaddingModeToggle mode={mode} onChange={setMode} />}>
      <Field label="Style">
        <SelectInput
          value={value.borderStyle ?? 'solid'}
          options={[
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
          ]}
          onChange={(v) => onChange({ borderStyle: v as 'solid' | 'dashed' | 'dotted' })}
        />
      </Field>
      <Field label="Color">
        <PaletteColorPicker value={value.borderColor ?? '#d1d5db'} onChange={(v) => onChange({ borderColor: v })} />
      </Field>
      {mode === 'basic' ? (
        <Field label="Width (px)">
          <NumberInput
            value={top}
            min={0}
            max={40}
            onChange={(v) => onChange({
              borderTopWidth: v,
              borderRightWidth: v,
              borderBottomWidth: v,
              borderLeftWidth: v,
            })}
          />
        </Field>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <Field label="Top"><NumberInput value={top} min={0} max={40} onChange={(v) => onChange({ borderTopWidth: v })} /></Field>
          <Field label="Right"><NumberInput value={right} min={0} max={40} onChange={(v) => onChange({ borderRightWidth: v })} /></Field>
          <Field label="Bottom"><NumberInput value={bottom} min={0} max={40} onChange={(v) => onChange({ borderBottomWidth: v })} /></Field>
          <Field label="Left"><NumberInput value={left} min={0} max={40} onChange={(v) => onChange({ borderLeftWidth: v })} /></Field>
        </div>
      )}
    </InspectorSection>
  );
}

function DangerButton({ label, onClick }: { label: string; onClick: () => void }) {
  const C = useT();
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        padding: '7px 12px',
        border: `1px solid ${hover ? C.dangerHover : C.danger}`,
        borderRadius: 6,
        background: hover ? C.dangerHover : 'transparent',
        color: hover ? C.textOnAccent : C.danger,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all .15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Trash2 size={14} />
      {label}
    </button>
  );
}

// ─── Block inspectors ─────────────────────────────────────────────────────────

function HeadingInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'heading' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  const fontWeightOptions = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' },
  ];

  return (
    <>
      <InspectorSection title="Content">
        <Field label="Text"><TextInput value={block.content} onChange={(v) => onUpdate({ content: v })} /></Field>
        <Field label="Font Size"><NumberInput value={block.fontSize ?? 32} min={8} max={96} onChange={(v) => onUpdate({ fontSize: v })} /></Field>
        <Field label="Font Weight">
          <SelectInput
            value={String(block.fontWeight ?? 700)}
            options={fontWeightOptions}
            onChange={(v) => onUpdate({ fontWeight: Number(v) })}
          />
        </Field>
        <Field label="Color"><PaletteColorPicker value={block.color ?? '#111827'} onChange={(v) => onUpdate({ color: v })} /></Field>
        <Field label="Align"><AlignButtons value={block.align} onChange={(v) => onUpdate({ align: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function ParagraphInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'paragraph' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  const C = useT();
  return (
    <>
      <InspectorSection title="Content">
        <Field label="Text">
          <textarea style={textareaStyle(C)} value={block.content} onChange={(e) => onUpdate({ content: e.target.value })} />
        </Field>
        <Field label="Font Size"><NumberInput value={block.fontSize ?? 16} min={8} max={48} onChange={(v) => onUpdate({ fontSize: v })} /></Field>
        <Field label="Color"><PaletteColorPicker value={block.color ?? '#4b5563'} onChange={(v) => onUpdate({ color: v })} /></Field>
        <Field label="Align"><AlignButtons value={block.align} onChange={(v) => onUpdate({ align: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function ButtonInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'button' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  return (
    <>
      <InspectorSection title="Content">
        <Field label="Label"><TextInput value={block.label} onChange={(v) => onUpdate({ label: v })} /></Field>
        <Field label="URL"><TextInput value={block.url} onChange={(v) => onUpdate({ url: v })} /></Field>
      </InspectorSection>
      <InspectorSection title="Layout">
        <Field label="Align"><AlignButtons value={block.align} onChange={(v) => onUpdate({ align: v })} /></Field>
        <Field label="Size Mode">
          <SelectInput
            value={block.widthMode ?? 'auto'}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'fixed', label: 'Fixed (px)' },
              { value: 'percent', label: 'By Percentage' },
            ]}
            onChange={(v) => {
              if (v === 'percent') {
                onUpdate({ widthMode: 'percent', widthPercent: 100 });
                return;
              }
              if (v === 'fixed') {
                onUpdate({ widthMode: 'fixed', widthPx: block.widthPx ?? 220 });
                return;
              }
              onUpdate({ widthMode: 'auto' });
            }}
          />
        </Field>
        {(block.widthMode ?? 'auto') === 'fixed' && (
          <Field label="Width (px)"><NumberInput value={block.widthPx ?? 220} min={40} max={1200} onChange={(v) => onUpdate({ widthPx: v })} /></Field>
        )}
        {(block.widthMode ?? 'auto') === 'percent' && (
          <Field label="Width (%)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={block.widthPercent ?? 50}
                onChange={(e) => onUpdate({ widthPercent: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <div style={{ width: 56 }}>
                <NumberInput value={block.widthPercent ?? 50} min={5} max={100} onChange={(v) => onUpdate({ widthPercent: v })} />
              </div>
            </div>
          </Field>
        )}
      </InspectorSection>
      <InspectorSection title="Style">
        <Field label="Background"><PaletteColorPicker value={block.backgroundColor ?? '#881c1c'} onChange={(v) => onUpdate({ backgroundColor: v })} /></Field>
        <Field label="Text Color"><PaletteColorPicker value={block.textColor ?? '#ffffff'} onChange={(v) => onUpdate({ textColor: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} showBorderRadius />
    </>
  );
}

function ImageInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'image' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  return (
    <>
      <InspectorSection title="Content">
        <Field label="URL"><TextInput value={block.src} onChange={(v) => onUpdate({ src: v })} /></Field>
        <Field label="Alt Text"><TextInput value={block.alt ?? ''} onChange={(v) => onUpdate({ alt: v })} /></Field>
        <Field label="Width (px)"><NumberInput value={block.width ?? 320} min={40} max={1200} onChange={(v) => onUpdate({ width: v })} /></Field>
        <Field label="Align"><AlignButtons value={block.align} onChange={(v) => onUpdate({ align: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function DividerInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'divider' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  return (
    <>
      <InspectorSection title="Style">
        <Field label="Color"><PaletteColorPicker value={block.color ?? '#e5e7eb'} onChange={(v) => onUpdate({ color: v })} /></Field>
        <Field label="Thickness (px)"><NumberInput value={block.thickness ?? 1} min={1} max={20} onChange={(v) => onUpdate({ thickness: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function SpacerInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'spacer' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  return (
    <>
      <InspectorSection title="Style">
        <Field label="Label"><TextInput value={block.label ?? 'Spacer'} onChange={(v) => onUpdate({ label: v || 'Spacer' })} /></Field>
        <Field label="Height (px)"><NumberInput value={block.height ?? 32} min={4} max={400} onChange={(v) => onUpdate({ height: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function MenuInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'menu' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  const C = useT();
  const updateItem = (index: number, patch: Partial<MenuItem>) => {
    const items = block.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onUpdate({ items });
  };

  const removeItem = (index: number) => {
    const items = block.items.filter((_, itemIndex) => itemIndex !== index);
    onUpdate({ items: items.length > 0 ? items : [{ label: 'Menu Item', url: 'https://example.com' }] });
  };

  const addItem = () => {
    onUpdate({ items: [...block.items, { label: `Item ${block.items.length + 1}`, url: 'https://example.com' }] });
  };

  return (
    <>
      <InspectorSection title="Menu Items">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {block.items.map((item, index) => (
            <div key={index} style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: 8, background: C.bgSubtle }}>
              <Field label={`Label ${index + 1}`}>
                <TextInput value={item.label} onChange={(v) => updateItem(index, { label: v })} />
              </Field>
              <Field label="URL">
                <TextInput value={item.url} onChange={(v) => updateItem(index, { url: v })} />
              </Field>
              <button
                onClick={() => removeItem(index)}
                style={{
                  marginTop: 4,
                  width: '100%',
                  padding: '6px 8px',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  background: C.bg,
                  color: C.textSecondary,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Remove item
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            style={{
              width: '100%',
              padding: '7px 8px',
              border: `1px dashed ${C.border}`,
              borderRadius: 6,
              background: C.bg,
              color: C.textSecondary,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Add menu item
          </button>
        </div>
      </InspectorSection>
      <InspectorSection title="Style">
        <Field label="Align"><AlignButtons value={block.align} onChange={(v) => onUpdate({ align: v })} /></Field>
        <Field label="Color"><PaletteColorPicker value={block.color ?? '#374151'} onChange={(v) => onUpdate({ color: v })} /></Field>
        <Field label="Font Size"><NumberInput value={block.fontSize ?? 14} min={8} max={28} onChange={(v) => onUpdate({ fontSize: v })} /></Field>
        <Field label="Item Spacing"><NumberInput value={block.itemSpacing ?? 14} min={0} max={60} onChange={(v) => onUpdate({ itemSpacing: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function HtmlInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'html' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  const C = useT();
  return (
    <>
      <InspectorSection title="Content">
        <Field label="HTML">
          <textarea style={textareaStyle(C)} value={block.content} onChange={(e) => onUpdate({ content: e.target.value })} />
        </Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function BlockInspectorPanel({
  block,
  onUpdate,
  onDelete,
  onClose,
}: {
  block: EmailBlock;
  onUpdate: (patch: Partial<EmailBlock>) => void;
  onDelete: () => void;
  onClose?: () => void;
}) {
  const C = useT();
  const label: Record<EmailBlockType, string> = {
    heading: 'Heading',
    paragraph: 'Paragraph',
    button: 'Button',
    image: 'Image',
    divider: 'Divider',
    spacer: 'Spacer',
    menu: 'Menu',
    html: 'HTML',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 13, color: C.text, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>{label[block.type]} Block</span>
        {onClose && (
          <button onClick={onClose} title="Close" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: `1px solid ${C.border}`, borderRadius: 4, background: C.bg, color: C.textMuted, cursor: 'pointer', flexShrink: 0 }}>
            <X size={12} />
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {block.type === 'heading' && <HeadingInspector block={block} onUpdate={onUpdate as any} />}
        {block.type === 'paragraph' && <ParagraphInspector block={block} onUpdate={onUpdate as any} />}
        {block.type === 'button' && <ButtonInspector block={block} onUpdate={onUpdate as any} />}
        {block.type === 'image' && <ImageInspector block={block} onUpdate={onUpdate as any} />}
        {block.type === 'divider' && <DividerInspector block={block} onUpdate={onUpdate as any} />}
        {block.type === 'spacer' && <SpacerInspector block={block} onUpdate={onUpdate as any} />}
        {block.type === 'menu' && <MenuInspector block={block} onUpdate={onUpdate as any} />}
        {block.type === 'html' && <HtmlInspector block={block} onUpdate={onUpdate as any} />}
      </div>
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
        <DangerButton label="Delete Block" onClick={onDelete} />
      </div>
    </div>
  );
}

function SectionInspectorPanel({
  section,
  onUpdate,
  onDelete,
  onClose,
}: {
  section: EmailSection;
  onUpdate: (patch: Partial<EmailSection>) => void;
  onDelete: () => void;
  onClose?: () => void;
}) {
  const C = useT();
  const currentLayout = section.columns.map((column) => Math.round(column.width));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>Row</span>
        {onClose && (
          <button onClick={onClose} title="Close" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: `1px solid ${C.border}`, borderRadius: 4, background: C.bg, color: C.textMuted, cursor: 'pointer', flexShrink: 0 }}>
            <X size={12} />
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <InspectorSection title="Columns">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {ROW_LAYOUT_OPTIONS.map((option) => {
              const active = option.widths.length === currentLayout.length && option.widths.every((width, index) => Math.round(width) === currentLayout[index]);
              return (
                <button
                  key={option.label}
                  onClick={() => onUpdate(applyRowLayout(section, option.widths))}
                  title={option.label}
                  style={{
                    padding: '7px',
                    border: `1px solid ${active ? C.accent : C.border}`,
                    borderRadius: 6,
                    background: active ? `${C.accent}0d` : C.bgSubtle,
                    cursor: 'pointer',
                    height: 56,
                  }}
                >
                  <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: option.widths.map((width) => `${width}fr`).join(' '), border: `1px solid ${active ? '#93c5fd' : C.canvasBg}`, borderRadius: 4, overflow: 'hidden', background: C.bg }}>
                    {option.widths.map((_, index) => (
                      <div key={index} style={{ borderLeft: index === 0 ? 'none' : `1px solid ${active ? '#93c5fd' : C.canvasBg}` }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </InspectorSection>
        <InspectorSection title="Style">
          <Field label="Background"><PaletteColorPicker value={section.backgroundColor ?? '#ffffff'} onChange={(v) => onUpdate({ backgroundColor: v })} /></Field>
        </InspectorSection>
        <SpacingSection value={section} onChange={onUpdate} />
        <BorderSection value={section} onChange={onUpdate} />
        <VisibilitySection value={section} onChange={onUpdate} showBorderRadius />
      </div>
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
        <DangerButton label="Delete Row" onClick={onDelete} />
      </div>
    </div>
  );
}

function Inspector({
  selection,
  doc,
  onUpdateBlock,
  onDeleteBlock,
  onUpdateSection,
  onDeleteSection,
}: {
  selection: Selection;
  doc: EmailDocument;
  onUpdateBlock: (sId: string, cId: string, bId: string, patch: Partial<EmailBlock>) => void;
  onDeleteBlock: (sId: string, cId: string, bId: string) => void;
  onUpdateSection: (sId: string, patch: Partial<EmailSection>) => void;
  onDeleteSection: (sId: string) => void;
}) {
  const C = useT();
  return (
    <div style={{ width: 280, background: C.bg, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      {!selection && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 13, gap: 6 }}>
          <MousePointerClick size={28} strokeWidth={1.5} />
          <span>Click a block or section</span>
        </div>
      )}
      {selection?.type === 'block' && (() => {
        const block = findBlock(doc, selection.sectionId, selection.columnId, selection.blockId);
        if (!block) return null;
        return (
          <BlockInspectorPanel
            block={block}
            onUpdate={(patch) => onUpdateBlock(selection.sectionId, selection.columnId, selection.blockId, patch)}
            onDelete={() => onDeleteBlock(selection.sectionId, selection.columnId, selection.blockId)}
          />
        );
      })()}
      {selection?.type === 'section' && (() => {
        const section = findSection(doc, selection.sectionId);
        if (!section) return null;
        return (
          <SectionInspectorPanel
            section={section}
            onUpdate={(patch) => onUpdateSection(selection.sectionId, patch)}
            onDelete={() => onDeleteSection(selection.sectionId)}
          />
        );
      })()}
    </div>
  );
}

// ─── Block preview (canvas rendering) ────────────────────────────────────────

function BlockPreview({
  block,
  fontFamily,
  isSelected,
  onClick,
  dimmed = false,
}: {
  block: EmailBlock;
  fontFamily: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  dimmed?: boolean;
}) {
  const C = useT();
  const [hover, setHover] = useState(false);
  const ringColor = isSelected ? C.blockSelected : hover ? `${C.accent}66` : 'transparent';
  const wrapStyle: React.CSSProperties = {
    position: 'relative',
    cursor: 'grab',
    boxShadow: `inset 0 0 0 2px ${ringColor}`,
    borderRadius: 2,
    background: isSelected ? `${C.blockSelected}08` : hover ? C.blockHover : 'transparent',
    padding: `${block.paddingTop ?? 0}px ${block.paddingRight ?? 0}px ${block.paddingBottom ?? 0}px ${block.paddingLeft ?? 0}px`,
    margin: `${block.marginTop ?? 0}px ${block.marginRight ?? 0}px ${block.marginBottom ?? 0}px ${block.marginLeft ?? 0}px`,
    borderStyle: block.borderStyle ?? 'solid',
    borderColor: block.borderColor ?? '#d1d5db',
    borderTopWidth: block.borderTopWidth ?? 0,
    borderRightWidth: block.borderRightWidth ?? 0,
    borderBottomWidth: block.borderBottomWidth ?? 0,
    borderLeftWidth: block.borderLeftWidth ?? 0,
    opacity: Math.max(0, Math.min(100, block.opacity ?? 100)) / 100,
    transition: 'box-shadow .1s, background .1s',
  };

  if (dimmed) {
    wrapStyle.opacity = 0.28;
  }

  return (
    <div
      style={wrapStyle}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {block.type === 'heading' && (
        <div style={{ fontFamily, fontSize: block.fontSize, fontWeight: block.fontWeight, textAlign: block.align, color: block.color, lineHeight: 1.2 }}>
          {block.content}
        </div>
      )}
      {block.type === 'paragraph' && (
        <div style={{ fontFamily, fontSize: block.fontSize, textAlign: block.align, color: block.color, lineHeight: 1.7 }}>
          {block.content.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
        </div>
      )}
      {block.type === 'button' && (
        <div style={{ textAlign: block.align }}>
          <span style={{
            display: 'inline-block',
            boxSizing: 'border-box',
            width: block.widthMode === 'fixed'
              ? Math.max(40, block.widthPx ?? 220)
              : block.widthMode === 'percent'
                ? `${Math.max(5, Math.min(100, block.widthPercent ?? 50))}%`
                : undefined,
            padding: '12px 20px',
            borderRadius: block.borderRadius,
            background: block.backgroundColor,
            color: block.textColor,
            fontFamily,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'default',
          }}>
            {block.label}
          </span>
        </div>
      )}
      {block.type === 'image' && (
        block.src
          ? <div style={{ textAlign: block.align }}><img src={block.src} alt={block.alt} style={{ maxWidth: '100%', width: block.width, height: 'auto', display: 'inline-block' }} /></div>
          : <div style={{ border: '2px dashed #d1d5db', borderRadius: 6, padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontFamily }}>Image — add a URL in the inspector</div>
      )}
      {block.type === 'divider' && (
        <hr style={{ border: 'none', borderTop: `${block.thickness}px solid ${block.color}`, margin: 0 }} />
      )}
      {block.type === 'spacer' && (
        <div style={{ height: block.height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, borderTop: '1px dashed #d1d5db' }} />
            <span style={{ color: '#9ca3af', fontSize: 11, whiteSpace: 'nowrap' }}>
              {block.label ?? 'Spacer'}
            </span>
            <div style={{ flex: 1, borderTop: '1px dashed #d1d5db' }} />
          </div>
        </div>
      )}
      {block.type === 'menu' && (
        <div style={{ textAlign: block.align, fontFamily, fontSize: block.fontSize, color: block.color, lineHeight: 1.4 }}>
          {block.items.map((item, i) => (
            <span key={i}>
              <span>{item.label}</span>
              {i < block.items.length - 1 && <span style={{ display: 'inline-block', width: block.itemSpacing }} />}
            </span>
          ))}
        </div>
      )}
      {block.type === 'html' && (
        <div dangerouslySetInnerHTML={{ __html: block.content }} />
      )}
    </div>
  );
}

function SortableBlockItem({
  block,
  sectionId,
  columnId,
  fontFamily,
  isSelected,
  isDimmed,
  onSelect,
  onContextMenu,
}: {
  block: EmailBlock;
  sectionId: string;
  columnId: string;
  fontFamily: string;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: {
      kind: 'block',
      sectionId,
      columnId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-block-id={block.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
    >
      <BlockPreview
        block={block}
        fontFamily={fontFamily}
        isSelected={isSelected}
        dimmed={isDimmed && !isDragging}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />
    </div>
  );
}

// ─── Section card (canvas) ───────────────────────────────────────────────────

function ControlBtn({ icon, onClick, title }: { icon: React.ReactElement; onClick: (e: React.MouseEvent) => void; title?: string }) {
  const C = useT();
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: 'none', borderRadius: 4, background: hover ? '#27272a' : '#18181b', color: '#d4d4d8', cursor: 'pointer' }}
    >
      {icon}
    </button>
  );
}

function AddBlockMenu({
  onAdd,
  onClose,
}: {
  onAdd: (type: EmailBlockType) => void;
  onClose: () => void;
}) {
  const C = useT();
  const types: Array<{ type: EmailBlockType; label: string; Icon: React.FC<LucideProps> }> = [
    { type: 'heading',   label: 'Heading',   Icon: Heading1 },
    { type: 'paragraph', label: 'Paragraph', Icon: MessageSquare },
    { type: 'button',    label: 'Button',    Icon: MousePointerClick },
    { type: 'image',     label: 'Image',     Icon: Image },
    { type: 'divider',   label: 'Divider',   Icon: SeparatorHorizontal },
    { type: 'spacer',    label: 'Spacer',    Icon: MoveVertical },
    { type: 'html',      label: 'HTML',      Icon: Code2 },
  ];

  return (
    <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 100, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.15)', padding: 6, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, minWidth: 220 }}>
      {types.map(({ type, label, Icon }) => (
        <button
          key={type}
          onClick={(e) => { e.stopPropagation(); onAdd(type); onClose(); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', border: `1px solid ${C.border}`, borderRadius: 6, background: C.bgSubtle, cursor: 'pointer', fontSize: 11, color: C.textSecondary }}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Drag & drop ──────────────────────────────────────────────────────────────

const BLOCK_DRAG_TYPE = 'application/x-email-block-type';
const BLOCK_INSTANCE_DRAG_TYPE = 'application/x-email-block-instance';
const ROW_DRAG_TYPE = 'application/x-email-row-layout';
const SECTION_DRAG_TYPE = 'application/x-email-section-id';

type BlockDragPayload = {
  sectionId: string;
  columnId: string;
  blockId: string;
};

type BlockSnapTarget = {
  sectionId: string;
  columnId: string;
  index: number;
};

function moveBlockToTarget(
  doc: EmailDocument,
  payload: BlockDragPayload,
  targetSectionId: string,
  targetColumnId: string,
  targetIndex: number,
): EmailDocument {
  let sourceIndex = -1;
  let movingBlock: EmailBlock | undefined;

  const withoutSource = mapSection(doc, payload.sectionId, (section) => ({
    ...section,
    columns: section.columns.map((column) => {
      if (column.id !== payload.columnId) return column;
      sourceIndex = column.blocks.findIndex((block) => block.id === payload.blockId);
      if (sourceIndex === -1) return column;
      movingBlock = column.blocks[sourceIndex];
      return {
        ...column,
        blocks: column.blocks.filter((block) => block.id !== payload.blockId),
      };
    }),
  }));

  if (!movingBlock) return doc;

  const adjustedIndex =
    payload.sectionId === targetSectionId &&
    payload.columnId === targetColumnId &&
    sourceIndex !== -1 &&
    sourceIndex < targetIndex
      ? targetIndex - 1
      : targetIndex;

  return mapSection(withoutSource, targetSectionId, (section) => ({
    ...section,
    columns: section.columns.map((column) => {
      if (column.id !== targetColumnId) return column;
      const blocks = [...column.blocks];
      const insertionIndex = Math.max(0, Math.min(adjustedIndex, blocks.length));
      blocks.splice(insertionIndex, 0, movingBlock!);
      return { ...column, blocks };
    }),
  }));
}

function createRowFromWidths(widths: number[]): EmailSection {
  return normalizeSection({
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    opacity: 100,
    borderRadius: 0,
    columns: widths.map((width) => ({
      id: nextId('col'),
      width,
      blocks: [],
    })),
  });
}

function DropZone({
  onDropType,
  onDropBlock,
  onMoveHoverChange,
  isEmpty = false,
  isDragging = false,
}: {
  onDropType: (type: EmailBlockType) => void;
  onDropBlock: (payload: BlockDragPayload) => void;
  onMoveHoverChange?: (hovering: boolean) => void;
  isEmpty?: boolean;
  isDragging?: boolean;
}) {
  const C = useT();
  const [over, setOver] = useState(false);
  const [dropMode, setDropMode] = useState<'new' | 'move' | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const resetState = () => {
    clearLeaveTimer();
    setOver(false);
    setDropMode(null);
    onMoveHoverChange?.(false);
  };

  const scheduleReset = () => {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setOver(false);
      setDropMode(null);
      onMoveHoverChange?.(false);
      leaveTimerRef.current = null;
    }, 80);
  };

  useEffect(() => {
    if (!isDragging) {
      resetState();
    }
  }, [isDragging]);

  useEffect(() => {
    return () => {
      clearLeaveTimer();
    };
  }, []);

  const onZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const isNewBlock = e.dataTransfer.types.includes(BLOCK_DRAG_TYPE);
    const isExistingBlock = e.dataTransfer.types.includes(BLOCK_INSTANCE_DRAG_TYPE);
    if (!isNewBlock && !isExistingBlock) return;

    e.preventDefault();
    e.stopPropagation();
    clearLeaveTimer();
    setOver(true);
    setDropMode(isExistingBlock ? 'move' : 'new');
    onMoveHoverChange?.(isExistingBlock);
  };

  const onZoneDragLeave = () => {
    // Drag leave often fires transiently when crossing tiny hit boundaries.
    // Delay reset slightly so snap preview stays stable near zone edges.
    scheduleReset();
  };

  const onZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resetState();

    const payload = e.dataTransfer.getData(BLOCK_INSTANCE_DRAG_TYPE);
    if (payload) {
      try {
        onDropBlock(JSON.parse(payload) as BlockDragPayload);
        return;
      } catch {
        return;
      }
    }

    const type = e.dataTransfer.getData(BLOCK_DRAG_TYPE) as EmailBlockType;
    if (type) onDropType(type);
  };

  if (isEmpty) {
    const showMoveIndicator = over && dropMode !== 'move';
    return (
      <div
        onDragOver={onZoneDragOver}
        onDragLeave={onZoneDragLeave}
        onDrop={onZoneDrop}
        style={{
          height: showMoveIndicator ? 34 : 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2px 0',
          borderRadius: 6,
          border: showMoveIndicator ? `2px dashed ${C.accent}` : `2px dashed #d4d4d8`,
          background: showMoveIndicator
            ? `repeating-linear-gradient(135deg, ${C.accent}12 0 10px, ${C.accent}22 10px 20px)`
            : 'transparent',
          color: showMoveIndicator ? C.accent : C.textFaint,
          fontSize: 12,
          fontWeight: 600,
          transition: 'height .12s, border-color .1s, background .1s, color .1s',
          cursor: 'default',
          boxSizing: 'border-box',
        }}
      >
        {showMoveIndicator ? <span style={{ pointerEvents: 'none' }}>Drop block here</span> : <span style={{ pointerEvents: 'none' }}>Drag a block here</span>}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 0,
        overflow: 'visible',
        pointerEvents: isDragging ? 'auto' : 'none',
      }}
    >
      {/* Invisible large hit area — ensures dragOver fires even before hover highlights */}
      <div
        onDragOver={onZoneDragOver}
        onDragLeave={onZoneDragLeave}
        onDrop={onZoneDrop}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: -12,
          height: 24,
          zIndex: 10,
        }}
      />
      {/* Visual indicator — only visible when hovering */}
      {over && dropMode !== 'move' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -1,
            height: 2,
            background: C.accent,
            pointerEvents: 'none',
            zIndex: 9,
          }}
        >
          <span style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: C.accent,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
            padding: '3px 8px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            Place here
          </span>
        </div>
      )}
    </div>
  );
}

function RowDropZone({
  onDropRow,
  onDropSection,
  empty = false,
  position = 'between',
  isDragging = false,
}: {
  onDropRow: (widths: number[]) => void;
  onDropSection: (sectionId: string) => void;
  empty?: boolean;
  position?: 'edge' | 'between';
  isDragging?: boolean;
}) {
  const C = useT();
  const [over, setOver] = useState(false);
  const [dropLabel, setDropLabel] = useState<'row' | 'section' | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const scheduleLeave = () => {
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setOver(false);
      setDropLabel(null);
      leaveTimerRef.current = null;
    }, 80);
  };

  useEffect(() => {
    if (!isDragging) {
      clearLeaveTimer();
      setOver(false);
      setDropLabel(null);
    }
  }, [isDragging]);

  // Collapsed to zero when not dragging and not the empty placeholder
  const collapsed = !isDragging && !empty;
  const idleHeight = 8;
  const activeHeight = position === 'edge' ? 24 : 20;

  return (
    <div
      onDragOver={(e) => {
        const isRow = e.dataTransfer.types.includes(ROW_DRAG_TYPE);
        const isSection = e.dataTransfer.types.includes(SECTION_DRAG_TYPE);
        if (!isRow && !isSection) return;
        e.preventDefault();
        e.stopPropagation();
        clearLeaveTimer();
        setOver(true);
        setDropLabel(isSection ? 'section' : 'row');
      }}
      onDragLeave={() => {
        // Drag leave events can fire momentarily around rounded corners.
        scheduleLeave();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        clearLeaveTimer();
        setOver(false);
        setDropLabel(null);
        const sectionId = e.dataTransfer.getData(SECTION_DRAG_TYPE);
        if (sectionId) {
          onDropSection(sectionId);
          return;
        }
        const payload = e.dataTransfer.getData(ROW_DRAG_TYPE);
        if (!payload) return;
        onDropRow(JSON.parse(payload) as number[]);
      }}
      style={{
        height: collapsed ? 0 : undefined,
        minHeight: collapsed ? 0 : empty ? 72 : over ? activeHeight : idleHeight,
        overflow: collapsed ? 'hidden' : undefined,
        pointerEvents: collapsed ? 'none' : undefined,
        margin: collapsed ? 0 : empty ? '24px 0' : over ? '4px 0' : '2px 0',
        borderRadius: 6,
        border: collapsed ? 'none' : `2px dashed ${over ? C.accent : (isDragging || empty) ? C.border : 'transparent'}`,
        background: over
          ? `repeating-linear-gradient(135deg, ${C.accent}10 0 10px, ${C.accent}20 10px 20px)`
          : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: over ? C.accent : C.textFaint,
        fontSize: 12,
        fontWeight: over ? 600 : 500,
        transition: 'background .12s, border-color .12s, color .12s, min-height .15s, height .15s',
      }}
    >
      {(over || empty) && <span>{empty ? 'Drag a row here' : dropLabel === 'section' ? 'Move row here' : 'Drop row here'}</span>}
    </div>
  );
}

function ColumnCard({
  column,
  section,
  selection,
  fontFamily,
  draggingPayload,
  paletteDropTarget,
  onSelectBlock,
  onAddBlock,
  showBlockDelete = false,
  selectedBlockId,
  onDeleteBlock,
  onBlockContextMenu,
}: {
  column: EmailColumn;
  section: EmailSection;
  selection: Selection;
  fontFamily: string;
  draggingPayload: BlockDragPayload | null;
  paletteDropTarget: { sectionId: string; columnId: string; index: number } | null;
  onSelectBlock: (sel: Selection) => void;
  onAddBlock: (sectionId: string, columnId: string, type: EmailBlockType, atIndex?: number) => void;
  showBlockDelete?: boolean;
  selectedBlockId?: string;
  onDeleteBlock?: (sId: string, cId: string, bId: string) => void;
  onBlockContextMenu?: (e: React.MouseEvent, sectionId: string, columnId: string, blockId: string, blockIndex: number, totalBlocks: number, currentAlign?: string) => void;
}) {
  const C = useT();
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${section.id}:${column.id}`,
    data: {
      kind: 'column',
      sectionId: section.id,
      columnId: column.id,
    },
  });

  const isTargetColumn = paletteDropTarget?.sectionId === section.id && paletteDropTarget?.columnId === column.id;
  const placeholderIndex = isTargetColumn ? paletteDropTarget!.index : -1;

  const placeholder = (
    <div
      key="__palette-placeholder__"
      style={{
        height: 4,
        borderRadius: 2,
        background: C.accent,
        margin: '4px 0',
        transition: 'all .15s ease',
      }}
    />
  );

  return (
    <div
      ref={setNodeRef}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(BLOCK_DRAG_TYPE)) return;
        e.preventDefault();
      }}
      onDrop={(e) => {
        const type = e.dataTransfer.getData(BLOCK_DRAG_TYPE) as EmailBlockType;
        if (!type) return;
        e.preventDefault();
        e.stopPropagation();
        onAddBlock(section.id, column.id, type, column.blocks.length);
      }}
      style={{
        flex: `0 0 ${column.width}%`,
        maxWidth: `${column.width}%`,
        padding: '0 8px',
        boxSizing: 'border-box',
        position: 'relative',
        minHeight: 28,
        borderRadius: 6,
        background: isOver ? `${C.accent}12` : 'transparent',
      }}
    >
      <SortableContext items={column.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
        {column.blocks.map((block, blockIndex) => {
          const isBlockSelected = selection?.type === 'block' && selection.blockId === block.id;
          return (
            <React.Fragment key={block.id}>
              {placeholderIndex === blockIndex && placeholder}
              <div style={{ position: 'relative' }}>
                <SortableBlockItem
                  block={block}
                  sectionId={section.id}
                  columnId={column.id}
                  fontFamily={fontFamily}
                  isSelected={isBlockSelected}
                  isDimmed={
                    Boolean(
                      draggingPayload &&
                      draggingPayload.sectionId === section.id &&
                      draggingPayload.columnId === column.id &&
                      draggingPayload.blockId === block.id,
                    )
                  }
                  onSelect={() => onSelectBlock({ type: 'block', sectionId: section.id, columnId: column.id, blockId: block.id })}
                  onContextMenu={onBlockContextMenu ? (e) => onBlockContextMenu(e, section.id, column.id, block.id, blockIndex, column.blocks.length, (block as any).align) : undefined}
                />
                {showBlockDelete && isBlockSelected && selectedBlockId === block.id && onDeleteBlock && (
                  <FloatingDeleteButton onClick={() => onDeleteBlock(section.id, column.id, block.id)} />
                )}
              </div>
            </React.Fragment>
          );
        })}
        {placeholderIndex >= column.blocks.length && placeholder}
      </SortableContext>
      {column.blocks.length === 0 && (
        <div
          style={{
            height: 40,
            border: `2px dashed ${isOver ? C.accent : C.canvasBg}`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isOver ? C.accent : C.textFaint,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Drag block here
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  index,
  total,
  selection,
  contentWidth,
  fontFamily,
  draggingPayload,
  paletteDropTarget,
  onSelectBlock,
  onSelectSection,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddBlock,
  previewEnabled = false,
  showBlockDelete = false,
  selectedBlockId,
  onDeleteBlock,
  onBlockContextMenu,
  onSectionContextMenu,
}: {
  section: EmailSection;
  index: number;
  total: number;
  selection: Selection;
  contentWidth: number;
  fontFamily: string;
  draggingPayload: BlockDragPayload | null;
  paletteDropTarget: { sectionId: string; columnId: string; index: number } | null;
  onSelectBlock: (sel: Selection) => void;
  onSelectSection: (sectionId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBlock: (sectionId: string, columnId: string, type: EmailBlockType, atIndex?: number) => void;
  previewEnabled?: boolean;
  showBlockDelete?: boolean;
  selectedBlockId?: string;
  onDeleteBlock?: (sId: string, cId: string, bId: string) => void;
  onBlockContextMenu?: (e: React.MouseEvent, sectionId: string, columnId: string, blockId: string, blockIndex: number, totalBlocks: number, currentAlign?: string) => void;
  onSectionContextMenu?: (e: React.MouseEvent) => void;
}) {
  const C = useT();
  const [hovered, setHovered] = useState(false);
  const isSectionSelected = selection?.type === 'section' && selection.sectionId === section.id;

  return (
    <div
      style={{
        position: 'relative',
        background: section.backgroundColor,
        boxShadow: isSectionSelected ? `inset 3px 0 0 ${C.accent}` : 'none',
        borderStyle: section.borderStyle ?? 'solid',
        borderColor: section.borderColor ?? '#d1d5db',
        borderTopWidth: section.borderTopWidth ?? 0,
        borderRightWidth: section.borderRightWidth ?? 0,
        borderBottomWidth: section.borderBottomWidth ?? 0,
        borderLeftWidth: section.borderLeftWidth ?? 0,
        borderRadius: section.borderRadius ?? 0,
        opacity: Math.max(0, Math.min(100, section.opacity ?? 100)) / 100,
        margin: `${section.marginTop ?? 0}px ${section.marginRight ?? 0}px ${section.marginBottom ?? 0}px ${section.marginLeft ?? 0}px`,
        transition: 'box-shadow .15s, border-color .15s',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelectSection(section.id); }}
      onContextMenu={!previewEnabled ? onSectionContextMenu : undefined}
    >
      {/* Section toolbar */}
      {!previewEnabled && (hovered || isSectionSelected) && (
        <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 20, display: 'flex', gap: 4 }}>
          {index > 0 && <ControlBtn icon={<ChevronUp size={13} />} title="Move up" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} />}
          {index < total - 1 && <ControlBtn icon={<ChevronDown size={13} />} title="Move down" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} />}
          <button
            draggable
            data-drag-kind="section"
            title="Drag to sort rows"
            onDragStart={(e) => {
              e.dataTransfer.setData(SECTION_DRAG_TYPE, section.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: 'none', borderRadius: 4, background: '#18181b', color: '#d4d4d8', cursor: 'grab' }}
          >
            <GripVertical size={13} />
          </button>
          <ControlBtn icon={<Copy size={13} />} title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} />
          <ControlBtn icon={<Trash2 size={13} />} title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} />
        </div>
      )}

      <div style={{ width: '100%', maxWidth: contentWidth, margin: '0 auto', padding: `${section.paddingTop ?? 0}px ${section.paddingRight ?? 0}px ${section.paddingBottom ?? 0}px ${section.paddingLeft ?? 0}px`, boxSizing: 'border-box', display: 'flex' }}>
        {section.columns.map((column) => (
          <ColumnCard
            key={column.id}
            column={column}
            section={section}
            selection={selection}
            fontFamily={fontFamily}
            draggingPayload={draggingPayload}
            paletteDropTarget={paletteDropTarget}
            onSelectBlock={onSelectBlock}
            onAddBlock={onAddBlock}
            showBlockDelete={showBlockDelete}
            selectedBlockId={selectedBlockId}
            onDeleteBlock={onDeleteBlock}
            onBlockContextMenu={onBlockContextMenu}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Left sidebar ─────────────────────────────────────────────────────────────

const BLOCK_PALETTE: Array<{ type: EmailBlockType; label: string; Icon: React.FC<LucideProps>; desc: string }> = [
  { type: 'heading',   label: 'Heading',   Icon: Heading1,          desc: 'Title text' },
  { type: 'paragraph', label: 'Paragraph', Icon: MessageSquare,     desc: 'Body copy' },
  { type: 'button',    label: 'Button',    Icon: MousePointerClick, desc: 'Call to action' },
  { type: 'image',     label: 'Image',     Icon: Image,             desc: 'Photo or graphic' },
  { type: 'divider',   label: 'Divider',   Icon: SeparatorHorizontal, desc: 'Horizontal rule' },
  { type: 'spacer',    label: 'Spacer',    Icon: MoveVertical,      desc: 'Empty space' },
  { type: 'menu',      label: 'Menu',      Icon: MenuIcon,          desc: 'Navigation links' },
  { type: 'html',      label: 'HTML',      Icon: Code2,             desc: 'Custom markup' },
];

const ROW_PALETTE: Array<{ label: string; Icon: React.FC<LucideProps>; desc: string; columns: number[] }> = [
  { label: 'Columns', Icon: MinusSquare, desc: 'Single column row', columns: [100] },
];

const SECTION_TEMPLATES: Array<{ type: 'blank' | 'hero' | 'two-column' | 'cta'; label: string; desc: string; Icon: React.FC<LucideProps> }> = [
  { type: 'hero',       label: 'Hero',        desc: 'Heading + paragraph + button', Icon: Rows4 },
  { type: 'two-column', label: 'Two Column',  desc: 'Side-by-side columns',          Icon: MinusSquare },
  { type: 'cta',        label: 'CTA',         desc: 'Centered call to action',       Icon: Link },
  { type: 'blank',      label: 'Blank',       desc: 'Empty section',                 Icon: Plus },
];

const BLOCK_LAYOUTS: Array<{ id: string; columns: number[] }> = [
  { id: 'full', columns: [100] },
  { id: 'halves', columns: [50, 50] },
  { id: 'thirds', columns: [100 / 3, 100 / 3, 100 / 3] },
  { id: 'quarters', columns: [25, 25, 25, 25] },
  { id: 'sidebar-right', columns: [35, 65] },
  { id: 'sidebar-left', columns: [65, 35] },
  { id: 'triple-focus', columns: [20, 30, 50] },
  { id: 'split-focus', columns: [40, 20, 40] },
];

// ─── Prebuilt section templates ───────────────────────────────────────────────

type PrebuiltTemplate = {
  id: string;
  label: string;
  desc: string;
  Icon: React.FC<LucideProps>;
  create: () => EmailSection;
};

const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  {
    id: 'hero-banner',
    label: 'Hero Banner',
    desc: 'Heading + paragraph + CTA button',
    Icon: Rows4,
    create: () =>
      normalizeSection({
        backgroundColor: '#ffffff',
        paddingTop: 40,
        paddingBottom: 40,
        paddingLeft: 24,
        paddingRight: 24,
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'heading', content: 'Welcome to Our Newsletter', fontSize: 36, fontWeight: 700, align: 'center', color: '#111827' },
              { type: 'paragraph', content: 'Stay updated with the latest news, tips, and exclusive offers delivered straight to your inbox.', fontSize: 16, align: 'center', color: '#6b7280' },
              { type: 'button', label: 'Get Started', url: '#', align: 'center', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 8 },
            ],
          },
        ],
      }),
  },
  {
    id: 'image-text',
    label: 'Image + Text',
    desc: 'Image left, content right',
    Icon: MinusSquare,
    create: () =>
      normalizeSection({
        backgroundColor: '#ffffff',
        paddingTop: 24,
        paddingBottom: 24,
        columns: [
          {
            width: 40,
            blocks: [
              { type: 'image', src: '', alt: 'Feature image', width: 280, align: 'center' },
            ],
          },
          {
            width: 60,
            blocks: [
              { type: 'heading', content: 'Feature Highlight', fontSize: 24, fontWeight: 600 },
              { type: 'paragraph', content: 'Describe your feature or product benefit here. Keep it concise and compelling.' },
              { type: 'button', label: 'Learn More', url: '#', backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: 6 },
            ],
          },
        ],
      }),
  },
  {
    id: 'feature-grid',
    label: 'Feature Grid',
    desc: '3-column feature layout',
    Icon: MinusSquare,
    create: () =>
      normalizeSection({
        backgroundColor: '#f9fafb',
        paddingTop: 32,
        paddingBottom: 32,
        paddingLeft: 16,
        paddingRight: 16,
        columns: [
          {
            width: 100 / 3,
            blocks: [
              { type: 'heading', content: 'Feature One', fontSize: 20, fontWeight: 600, align: 'center' },
              { type: 'paragraph', content: 'Brief description of your first feature or benefit.', fontSize: 14, align: 'center', color: '#6b7280' },
            ],
          },
          {
            width: 100 / 3,
            blocks: [
              { type: 'heading', content: 'Feature Two', fontSize: 20, fontWeight: 600, align: 'center' },
              { type: 'paragraph', content: 'Brief description of your second feature or benefit.', fontSize: 14, align: 'center', color: '#6b7280' },
            ],
          },
          {
            width: 100 / 3,
            blocks: [
              { type: 'heading', content: 'Feature Three', fontSize: 20, fontWeight: 600, align: 'center' },
              { type: 'paragraph', content: 'Brief description of your third feature or benefit.', fontSize: 14, align: 'center', color: '#6b7280' },
            ],
          },
        ],
      }),
  },
  {
    id: 'cta-banner',
    label: 'CTA Banner',
    desc: 'Call to action on accent background',
    Icon: Link,
    create: () =>
      normalizeSection({
        backgroundColor: '#2563eb',
        paddingTop: 40,
        paddingBottom: 40,
        paddingLeft: 24,
        paddingRight: 24,
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'heading', content: 'Ready to get started?', fontSize: 28, fontWeight: 700, align: 'center', color: '#ffffff' },
              { type: 'paragraph', content: 'Join thousands of happy customers today.', fontSize: 16, align: 'center', color: '#dbeafe' },
              { type: 'button', label: 'Sign Up Now', url: '#', align: 'center', backgroundColor: '#ffffff', textColor: '#2563eb', borderRadius: 8 },
            ],
          },
        ],
      }),
  },
  {
    id: 'nav-header',
    label: 'Navigation',
    desc: 'Logo area + menu links',
    Icon: MenuIcon,
    create: () =>
      normalizeSection({
        backgroundColor: '#ffffff',
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 24,
        paddingRight: 24,
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'menu', items: [{ label: 'Home', url: '#' }, { label: 'About', url: '#' }, { label: 'Blog', url: '#' }, { label: 'Contact', url: '#' }], align: 'center', fontSize: 14, color: '#374151', itemSpacing: 24 },
              { type: 'divider', color: '#e5e7eb', thickness: 1 },
            ],
          },
        ],
      }),
  },
  {
    id: 'testimonial',
    label: 'Testimonial',
    desc: 'Quote with attribution',
    Icon: MessageSquare,
    create: () =>
      normalizeSection({
        backgroundColor: '#f9fafb',
        paddingTop: 32,
        paddingBottom: 32,
        paddingLeft: 40,
        paddingRight: 40,
        borderRadius: 8,
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'paragraph', content: '"This product has completely transformed the way we work. I can\'t imagine going back to our old tools."', fontSize: 18, align: 'center', color: '#374151' },
              { type: 'paragraph', content: '— Jane Smith, CEO at Company', fontSize: 14, align: 'center', color: '#9ca3af' },
            ],
          },
        ],
      }),
  },
  {
    id: 'footer',
    label: 'Footer',
    desc: 'Links + copyright',
    Icon: Code2,
    create: () =>
      normalizeSection({
        backgroundColor: '#1f2937',
        paddingTop: 32,
        paddingBottom: 32,
        paddingLeft: 24,
        paddingRight: 24,
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'menu', items: [{ label: 'Privacy', url: '#' }, { label: 'Terms', url: '#' }, { label: 'Unsubscribe', url: '#' }], align: 'center', fontSize: 13, color: '#9ca3af', itemSpacing: 20 },
              { type: 'paragraph', content: '© 2026 Your Company. All rights reserved.\n123 Main St, City, Country', fontSize: 12, align: 'center', color: '#6b7280' },
            ],
          },
        ],
      }),
  },
  {
    id: 'image-banner',
    label: 'Image Banner',
    desc: 'Full-width image section',
    Icon: Image,
    create: () =>
      normalizeSection({
        backgroundColor: '#ffffff',
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'image', src: '', alt: 'Banner image', width: 640, align: 'center' },
            ],
          },
        ],
      }),
  },
];

// ─── TreeView component ───────────────────────────────────────────────────────

function TreeNode({
  label,
  icon,
  depth,
  active,
  onClick,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  depth: number;
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const C = useT();
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Boolean(children);

  return (
    <div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 8px',
          paddingLeft: 8 + depth * 16,
          cursor: 'pointer',
          borderRadius: 4,
          background: active ? `${C.accent}12` : 'transparent',
          color: active ? C.accent : '#3f3f46',
          fontSize: 12,
          fontWeight: active ? 600 : 400,
          userSelect: 'none',
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'inherit',
              flexShrink: 0,
            }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      {hasChildren && expanded && children}
    </div>
  );
}

function TreeView({
  doc,
  selection,
  onSelectSection,
  onSelectBlock,
}: {
  doc: EmailDocument;
  selection: Selection;
  onSelectSection: (sectionId: string) => void;
  onSelectBlock: (sectionId: string, columnId: string, blockId: string) => void;
}) {
  const C = useT();
  const blockLabel: Record<EmailBlockType, string> = {
    heading: 'Heading',
    paragraph: 'Paragraph',
    button: 'Button',
    image: 'Image',
    divider: 'Divider',
    spacer: 'Spacer',
    menu: 'Menu',
    html: 'HTML',
  };

  const blockIcon: Record<EmailBlockType, React.ReactNode> = {
    heading: <Heading1 size={12} />,
    paragraph: <MessageSquare size={12} />,
    button: <MousePointerClick size={12} />,
    image: <Image size={12} />,
    divider: <SeparatorHorizontal size={12} />,
    spacer: <MoveVertical size={12} />,
    menu: <MenuIcon size={12} />,
    html: <Code2 size={12} />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {doc.sections.length === 0 && (
        <div style={{ padding: 16, color: C.textFaint, fontSize: 12, textAlign: 'center' }}>
          No rows yet
        </div>
      )}
      {doc.sections.map((section, sIndex) => (
        <TreeNode
          key={section.id}
          label={`Row ${sIndex + 1}`}
          icon={<Rows4 size={12} />}
          depth={0}
          active={selection?.type === 'section' && selection.sectionId === section.id}
          onClick={() => onSelectSection(section.id)}
        >
          {section.columns.map((column, cIndex) => (
            <TreeNode
              key={column.id}
              label={`Column ${cIndex + 1} (${Math.round(column.width)}%)`}
              icon={<MinusSquare size={12} />}
              depth={1}
              active={false}
              onClick={() => onSelectSection(section.id)}
            >
              {column.blocks.map((block) => {
                const preview = block.type === 'heading'
                  ? (block as any).content?.slice(0, 20) || 'Heading'
                  : block.type === 'paragraph'
                  ? (block as any).content?.slice(0, 20) || 'Paragraph'
                  : block.type === 'button'
                  ? (block as any).label?.slice(0, 20) || 'Button'
                  : blockLabel[block.type];

                return (
                  <TreeNode
                    key={block.id}
                    label={preview}
                    icon={blockIcon[block.type]}
                    depth={2}
                    active={selection?.type === 'block' && selection.blockId === block.id}
                    onClick={() => onSelectBlock(section.id, column.id, block.id)}
                  />
                );
              })}
            </TreeNode>
          ))}
        </TreeNode>
      ))}
    </div>
  );
}

function DraggablePaletteBlock({
  type,
  label,
  Icon,
  desc,
}: {
  type: EmailBlockType;
  label: string;
  Icon: React.FC<LucideProps>;
  desc: string;
}) {
  const C = useT();
  const id = `palette-block:${type}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { kind: 'palette-block', blockType: type },
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={`${desc} — drag into a row column`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        minHeight: 82,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        background: C.bg,
        color: C.textSecondary,
        cursor: 'grab',
        fontSize: 10,
        boxShadow: '0 1px 1px rgba(0,0,0,.04)',
        padding: '8px 6px',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
    >
      <Icon size={20} strokeWidth={1.9} />
      <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
    </button>
  );
}

function DraggablePaletteRow({
  label,
  Icon,
  desc,
  columns,
}: {
  label: string;
  Icon: React.FC<LucideProps>;
  desc: string;
  columns: number[];
}) {
  const C = useT();
  const id = `palette-row:${label}:${JSON.stringify(columns)}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { kind: 'palette-row', columns },
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={`${desc} — drag into canvas`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        minHeight: 82,
        border: `1px solid ${C.border}`,
        borderRadius: 2,
        background: C.bg,
        color: C.textSecondary,
        cursor: 'grab',
        fontSize: 10,
        boxShadow: '0 1px 1px rgba(0,0,0,.04)',
        padding: '8px 6px',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
    >
      <Icon size={20} strokeWidth={1.9} />
      <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
    </button>
  );
}

function DraggableLayoutRowPreview({ columns, layoutId }: { columns: number[]; layoutId: string }) {
  const C = useT();
  const id = `palette-layout:${layoutId}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { kind: 'palette-row', columns },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: columns.map((width) => `${width}fr`).join(' '), gap: 0, border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden', minHeight: 64, background: C.bg }}>
        {columns.map((_, index) => (
          <div
            key={index}
            style={{
              borderLeft: index === 0 ? 'none' : `1px solid ${C.border}`,
              background: C.bg,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RailItem({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: React.FC<LucideProps>;
  active: boolean;
  onClick: () => void;
}) {
  const C = useT();
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: '100%',
        minHeight: 76,
        padding: '12px 8px',
        border: 'none',
        borderBottom: `1px solid ${C.border}`,
        background: active ? C.bg : C.bgSubtle,
        color: active ? C.text : C.textSecondary,
        cursor: 'pointer',
        fontSize: 10,
        fontWeight: active ? 700 : 600,
        textAlign: 'center',
      }}
    >
      {active && (
        <div
          style={{
            position: 'absolute',
            right: -8,
            top: '50%',
            width: 12,
            height: 12,
            background: C.bg,
            borderTop: `1px solid ${C.border}`,
            borderRight: `1px solid ${C.border}`,
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 2,
          }}
        />
      )}
      <Icon size={18} strokeWidth={2} />
      <span style={{ position: 'relative', zIndex: 3 }}>{label}</span>
    </button>
  );
}

// ─── Built-in output tabs ────────────────────────────────────────────────────

// Catppuccin Mocha–inspired palette for syntax highlighting
const SYN = {
  bg: '#1e1e2e',
  fg: '#cdd6f4',
  string: '#a6e3a1',
  number: '#fab387',
  boolean: '#f38ba8',
  null: '#f5c2e7',
  key: '#89b4fa',
  punctuation: '#9399b2',
  tag: '#cba6f7',
  attrName: '#89dceb',
  attrValue: '#a6e3a1',
  comment: '#6c7086',
  doctype: '#f5c2e7',
  entity: '#fab387',
};

type SynToken = { text: string; color?: string };

function highlightJson(src: string): SynToken[] {
  const tokens: SynToken[] = [];
  const re = /("(?:\\.|[^"\\])*")\s*(:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}\[\],:])|(\s+)/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) tokens.push({ text: src.slice(last, m.index) });
    if (m[1] !== undefined) {
      // key + colon
      tokens.push({ text: m[1], color: SYN.key });
      tokens.push({ text: m[2], color: SYN.punctuation });
    } else if (m[3] !== undefined) {
      tokens.push({ text: m[3], color: SYN.string });
    } else if (m[4] !== undefined) {
      tokens.push({ text: m[4], color: SYN.number });
    } else if (m[5] !== undefined) {
      tokens.push({ text: m[5], color: SYN.boolean });
    } else if (m[6] !== undefined) {
      tokens.push({ text: m[6], color: SYN.null });
    } else if (m[7] !== undefined) {
      tokens.push({ text: m[7], color: SYN.punctuation });
    } else if (m[8] !== undefined) {
      tokens.push({ text: m[8] });
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) tokens.push({ text: src.slice(last) });
  return tokens;
}

function highlightHtml(src: string): SynToken[] {
  const tokens: SynToken[] = [];
  // Match tags, comments, doctype, entities, and plain text
  const re = /(<!--[\s\S]*?-->)|(<!DOCTYPE[^>]*>)|(<\/?)(\w[\w-]*)(\s[^>]*)?(\/?>)|(&\w+;|&#\d+;|&#x[\da-fA-F]+;)/gi;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) tokens.push({ text: src.slice(last, m.index), color: SYN.fg });
    if (m[1] !== undefined) {
      // comment
      tokens.push({ text: m[1], color: SYN.comment });
    } else if (m[2] !== undefined) {
      // doctype
      tokens.push({ text: m[2], color: SYN.doctype });
    } else if (m[4] !== undefined) {
      // tag
      tokens.push({ text: m[3], color: SYN.punctuation }); // <  or </
      tokens.push({ text: m[4], color: SYN.tag }); // tag name
      if (m[5]) {
        // attributes
        const attrSrc = m[5];
        const attrRe = /([\w-]+)(=)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([\w-]+)(=)(\S+)|([\w-]+)|(\s+)/g;
        let am: RegExpExecArray | null;
        let aLast = 0;
        while ((am = attrRe.exec(attrSrc)) !== null) {
          if (am.index > aLast) tokens.push({ text: attrSrc.slice(aLast, am.index) });
          if (am[1] !== undefined) {
            tokens.push({ text: am[1], color: SYN.attrName });
            tokens.push({ text: am[2], color: SYN.punctuation });
            tokens.push({ text: am[3], color: SYN.attrValue });
          } else if (am[4] !== undefined) {
            tokens.push({ text: am[4], color: SYN.attrName });
            tokens.push({ text: am[5], color: SYN.punctuation });
            tokens.push({ text: am[6], color: SYN.attrValue });
          } else if (am[7] !== undefined) {
            tokens.push({ text: am[7], color: SYN.attrName });
          } else if (am[8] !== undefined) {
            tokens.push({ text: am[8] });
          }
          aLast = am.index + am[0].length;
        }
        if (aLast < attrSrc.length) tokens.push({ text: attrSrc.slice(aLast) });
      }
      tokens.push({ text: m[6], color: SYN.punctuation }); // > or />
    } else if (m[7] !== undefined) {
      // entity
      tokens.push({ text: m[7], color: SYN.entity });
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) tokens.push({ text: src.slice(last), color: SYN.fg });
  return tokens;
}

const codeBlockStyle: React.CSSProperties = {
  fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
  fontSize: 11,
  lineHeight: 1.5,
  background: SYN.bg,
  color: SYN.fg,
  padding: 16,
  borderRadius: 8,
  margin: 0,
  overflow: 'auto',
  whiteSpace: 'pre',
  maxHeight: '100%',
  tabSize: 2,
};

const copyBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  padding: '4px 8px',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  background: 'rgba(30,30,46,0.85)',
  backdropFilter: 'blur(4px)',
  color: '#cdd6f4',
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  zIndex: 5,
  transition: 'background 0.15s, border-color 0.15s',
};

function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: 'json' | 'html';
}) {
  const [copied, setCopied] = useState(false);
  const tokens = language === 'json' ? highlightJson(code) : highlightHtml(code);

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        style={{
          ...copyBtnStyle,
          background: copied ? 'rgba(166,227,161,0.2)' : copyBtnStyle.background,
          borderColor: copied ? 'rgba(166,227,161,0.4)' : copyBtnStyle.borderColor,
          color: copied ? SYN.string : copyBtnStyle.color,
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.background = copyBtnStyle.background as string; }}
      >
        <Copy size={10} /> {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre style={{ ...codeBlockStyle, flex: 1 }}>
        {tokens.map((t, i) =>
          t.color ? (
            <span key={i} style={{ color: t.color }}>{t.text}</span>
          ) : (
            t.text
          ),
        )}
      </pre>
    </div>
  );
}

function JsonViewerPanel({ doc }: { doc: EmailDocument }) {
  const C = useT();
  const json = JSON.stringify(doc, null, 2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <span style={{ fontSize: 10, color: C.textFaint }}>
        {(json.length / 1024).toFixed(1)} KB
      </span>
      <CodeBlock code={json} language="json" />
    </div>
  );
}

function HtmlOutputPanel({ doc }: { doc: EmailDocument }) {
  const C = useT();
  const html = renderEmailDocument(doc);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <span style={{ fontSize: 10, color: C.textFaint }}>
        {(html.length / 1024).toFixed(1)} KB
      </span>
      <CodeBlock code={html} language="html" />
    </div>
  );
}

// ─── Resizable sidebar wrapper ───────────────────────────────────────────────

function ResizablePanel({
  children,
  defaultWidth,
  minWidth,
  maxWidth,
  side,
}: {
  children: React.ReactNode;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: 'left' | 'right';
}) {
  const C = useT();
  const [width, setWidth] = useState(defaultWidth);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const onMouseMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const delta = side === 'left'
          ? ev.clientX - startXRef.current
          : startXRef.current - ev.clientX;
        const next = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta));
        setWidth(next);
      };

      const onMouseUp = () => {
        draggingRef.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width, minWidth, maxWidth, side],
  );

  const handleSide = side === 'left' ? 'right' : 'left';

  return (
    <div style={{ width, flexShrink: 0, position: 'relative', display: 'flex' }}>
      {children}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute',
          [handleSide]: -3,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
          zIndex: 50,
        }}
      >
        <div
          style={{
            position: 'absolute',
            [handleSide]: 2,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'transparent',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget.style.background) = C.accent; }}
          onMouseLeave={(e) => { if (!draggingRef.current) e.currentTarget.style.background = 'transparent'; }}
        />
      </div>
    </div>
  );
}

function Sidebar({
  activeTab,
  onTabChange,
  doc,
  onAddBlock,
  onAddSection,
  onAddLayout,
  onUpdateSettings,
  onAddPrebuilt,
  selection,
  onSelectSection,
  onSelectBlock,
  sampleBlocks,
  userTemplates,
  customTabs,
  features,
  themeMode,
  onThemeChange,
}: {
  activeTab: SidebarTab;
  onTabChange: (t: SidebarTab) => void;
  doc: EmailDocument;
  onAddBlock: (type: EmailBlockType) => void;
  onAddSection: (type: 'blank' | 'hero' | 'two-column' | 'cta') => void;
  onAddLayout: (widths: number[]) => void;
  onUpdateSettings: (patch: Partial<EmailDocument['settings']>) => void;
  onAddPrebuilt: (section: EmailSection) => void;
  selection: Selection;
  onSelectSection: (sectionId: string) => void;
  onSelectBlock: (sectionId: string, columnId: string, blockId: string) => void;
  sampleBlocks?: SampleBlock[];
  userTemplates?: TemplateDefinition[];
  customTabs?: CustomTab[];
  features: EditorFeatures;
  themeMode: EditorThemeMode;
  onThemeChange?: (theme: EditorThemeMode) => void;
}) {
  const C = useT();
  const shellStyle: React.CSSProperties = {
    width: '100%',
    background: C.bgMuted,
    borderRight: `1px solid ${C.border}`,
    display: 'flex',
    flexShrink: 0,
    overflow: 'hidden',
  };

  const railStyle: React.CSSProperties = {
    width: 74,
    background: C.bgSubtle,
    borderRight: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  };

  const contentPanelStyle: React.CSSProperties = {
    flex: 1,
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const panelHeaderStyle: React.CSSProperties = {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    borderBottom: `1px solid ${C.border}`,
    flexShrink: 0,
  };

  const panelBodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
  };

  const navItems: Array<{ id: SidebarTab; label: string; Icon: React.FC<LucideProps> }> = [
    ...(features.content ? [{ id: 'blocks' as SidebarTab, label: 'Content', Icon: Rows4 }] : []),
    ...(features.rows ? [{ id: 'sections' as SidebarTab, label: 'Rows', Icon: MinusSquare }] : []),
    ...(features.templates ? [{ id: 'templates' as SidebarTab, label: 'Templates', Icon: Layers }] : []),
    ...(features.treeView ? [{ id: 'tree' as SidebarTab, label: 'Tree', Icon: ListTree }] : []),
    { id: 'json' as SidebarTab, label: 'JSON', Icon: Braces },
    { id: 'html' as SidebarTab, label: 'HTML', Icon: FileCode },
    ...(customTabs ?? []).map((tab) => ({
      id: tab.id as SidebarTab,
      label: tab.label,
      Icon: tab.icon as React.FC<LucideProps>,
    })),
  ];

  const renderShell = (title: string, body: React.ReactNode) => (
    <div style={shellStyle}>
      <div style={railStyle}>
        <div style={{ flex: 1 }}>
          {navItems.map((item) => (
            <RailItem
              key={item.id}
              label={item.label}
              Icon={item.Icon}
              active={activeTab === item.id}
              onClick={() => {
                onTabChange(item.id);
              }}
            />
          ))}
        </div>
        {onThemeChange && (
          <button
            onClick={() => onThemeChange(themeMode === 'light' ? 'dark' : 'light')}
            title={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              minHeight: 76,
              padding: '12px 8px',
              border: 'none',
              borderTop: `1px solid ${C.border}`,
              background: C.bgSubtle,
              color: C.textSecondary,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {themeMode === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
            <span>{themeMode === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        )}
      </div>
      <div style={contentPanelStyle}>
        <div style={panelHeaderStyle}>
          <span style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, color: C.text }}>{title}</span>
        </div>
        <div style={panelBodyStyle}>{body}</div>
      </div>
    </div>
  );

  if (activeTab === 'sections') {
    return renderShell(
      'Rows',
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.textSecondary, marginBottom: 10 }}>Drag row layout</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BLOCK_LAYOUTS.map((layout) => (
            <DraggableLayoutRowPreview
              key={layout.id}
              columns={layout.columns}
              layoutId={layout.id}
            />
          ))}
        </div>
      </div>,
    );
  }



  if (activeTab === 'tree') {
    return renderShell(
      'Tree View',
      <TreeView
        doc={doc}
        selection={selection}
        onSelectSection={onSelectSection}
        onSelectBlock={onSelectBlock}
      />,
    );
  }

  if (activeTab === 'templates') {
    const allTemplates = [
      ...PREBUILT_TEMPLATES.map((t) => ({
        id: t.id,
        label: t.label,
        desc: t.desc,
        icon: t.Icon,
        create: t.create as () => EmailSection | EmailSection[],
      })),
      ...(userTemplates ?? []),
    ];
    return renderShell(
      'Templates',
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => {
                const result = template.create();
                const sections = Array.isArray(result) ? result : [result];
                sections.forEach((s) => onAddPrebuilt(s));
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                background: C.bg,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.textSecondary }}>
                {Icon ? <Icon size={18} /> : <Layers size={18} />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{template.label}</div>
                {template.desc && <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.3 }}>{template.desc}</div>}
              </div>
            </button>
          );
        })}
      </div>,
    );
  }

  // ── JSON Viewer tab ─────────────────────────────────────────────────────────
  if (activeTab === 'json') {
    return renderShell(
      'JSON Viewer',
      <JsonViewerPanel doc={doc} />,
    );
  }

  // ── HTML Output tab ────────────────────────────────────────────────────────
  if (activeTab === 'html') {
    return renderShell(
      'HTML Output',
      <HtmlOutputPanel doc={doc} />,
    );
  }

  // ── Custom tabs ─────────────────────────────────────────────────────────────
  const customTab = (customTabs ?? []).find((t) => t.id === activeTab);
  if (customTab) {
    return renderShell(
      customTab.label,
      <>{customTab.render({ doc, selection, updateSettings: onUpdateSettings })}</>,
    );
  }

  return renderShell(
    'Content',
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {ROW_PALETTE.map(({ label, Icon, desc, columns }) => (
          <DraggablePaletteRow
            key={label}
            label={label}
            Icon={Icon}
            desc={desc}
            columns={columns}
          />
        ))}
        {BLOCK_PALETTE.map(({ type, label, Icon, desc }) => (
          <DraggablePaletteBlock
            key={type}
            type={type}
            label={label}
            Icon={Icon}
            desc={desc}
          />
        ))}
      </div>
      {sampleBlocks && sampleBlocks.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Sample Blocks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sampleBlocks.map((sb) => {
              const SbIcon = sb.icon;
              return (
                <button
                  key={sb.id}
                  onClick={() => {
                    const block = sb.create();
                    // Insert via addBlock pathway
                    onAddBlock(block.type);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    background: C.bg,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.textSecondary }}>
                    {SbIcon ? <SbIcon size={14} /> : <Layers size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{sb.label}</div>
                    {sb.desc && <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.3 }}>{sb.desc}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>,
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  previewEnabled,
  onTogglePreview,
}: {
  previewEnabled: boolean;
  onTogglePreview: () => void;
}) {
  const C = useT();
  return (
    <div style={{ height: 44, background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>Block Builder</span>
      <button
        onClick={onTogglePreview}
        title={previewEnabled ? 'Exit Preview' : 'Preview Mode'}
        style={{
          padding: '5px 12px',
          border: `1px solid ${previewEnabled ? C.accent : C.border}`,
          borderRadius: 6,
          background: previewEnabled ? C.accent : 'transparent',
          color: previewEnabled ? C.textOnAccent : C.textSecondary,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {previewEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
        {previewEnabled ? 'Exit Preview' : 'Preview'}
      </button>
    </div>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function DeviceToggle({
  viewMode,
  onViewMode,
}: {
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
}) {
  const C = useT();
  const modes: Array<{ mode: ViewMode; Icon: React.FC<LucideProps>; title: string }> = [
    { mode: 'desktop', Icon: Laptop, title: 'Desktop' },
    { mode: 'tablet', Icon: Tablet, title: 'Tablet' },
    { mode: 'mobile', Icon: Smartphone, title: 'Mobile' },
  ];

  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      {modes.map(({ mode, Icon, title }) => (
        <button
          key={mode}
          onClick={() => onViewMode(mode)}
          title={title}
          style={{
            width: 32,
            height: 28,
            border: 'none',
            borderRadius: 6,
            background: viewMode === mode ? C.accent : 'transparent',
            color: viewMode === mode ? C.textOnAccent : C.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}

// ─── Context menu ─────────────────────────────────────────────────────────────

type ContextMenuAction =
  | { kind: 'delete' }
  | { kind: 'moveUp' }
  | { kind: 'moveDown' }
  | { kind: 'align'; value: 'left' | 'center' | 'right' };

type ContextMenuState = {
  x: number;
  y: number;
  target:
    | { type: 'block'; sectionId: string; columnId: string; blockId: string; blockIndex: number; totalBlocks: number; currentAlign?: string }
    | { type: 'section'; sectionId: string; sectionIndex: number; totalSections: number };
} | null;

function ContextMenuOverlay({
  menu,
  onAction,
  onClose,
}: {
  menu: NonNullable<ContextMenuState>;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}) {
  const C = useT();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const isBlock = menu.target.type === 'block';
  const canMoveUp = menu.target.type === 'block' ? menu.target.blockIndex > 0 : menu.target.sectionIndex > 0;
  const canMoveDown = menu.target.type === 'block'
    ? menu.target.blockIndex < menu.target.totalBlocks - 1
    : menu.target.type === 'section' ? menu.target.sectionIndex < menu.target.totalSections - 1 : false;
  const currentAlign = menu.target.type === 'block' ? menu.target.currentAlign : undefined;

  const itemStyle = (disabled = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    color: disabled ? C.canvasBg : '#27272a',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'left',
    borderRadius: 4,
  });

  const dangerItemStyle: React.CSSProperties = {
    ...itemStyle(),
    color: C.danger,
  };

  const alignBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: `1px solid ${active ? C.accent : C.border}`,
    borderRadius: 4,
    background: active ? `${C.accent}14` : '#fff',
    color: active ? C.accent : C.textSecondary,
    cursor: 'pointer',
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left: menu.x,
          top: menu.y,
          minWidth: 180,
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,.14)',
          padding: 4,
          zIndex: 10000,
        }}
      >
        <button
          style={itemStyle(!canMoveUp)}
          disabled={!canMoveUp}
          onMouseEnter={(e) => { if (canMoveUp) (e.currentTarget.style.background = C.bgHover); }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          onClick={() => { if (canMoveUp) onAction({ kind: 'moveUp' }); }}
        >
          <ChevronUp size={14} /> Move Up
        </button>
        <button
          style={itemStyle(!canMoveDown)}
          disabled={!canMoveDown}
          onMouseEnter={(e) => { if (canMoveDown) (e.currentTarget.style.background = C.bgHover); }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          onClick={() => { if (canMoveDown) onAction({ kind: 'moveDown' }); }}
        >
          <ChevronDown size={14} /> Move Down
        </button>

        {isBlock && (
          <>
            <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
            <div style={{ padding: '4px 12px', fontSize: 11, color: C.textFaint, fontWeight: 600 }}>Alignment</div>
            <div style={{ display: 'flex', gap: 4, padding: '4px 12px' }}>
              <button
                style={alignBtnStyle(currentAlign === 'left')}
                title="Align Left"
                onClick={() => onAction({ kind: 'align', value: 'left' })}
              >
                <AlignLeft size={14} />
              </button>
              <button
                style={alignBtnStyle(currentAlign === 'center')}
                title="Align Center"
                onClick={() => onAction({ kind: 'align', value: 'center' })}
              >
                <AlignCenter size={14} />
              </button>
              <button
                style={alignBtnStyle(currentAlign === 'right')}
                title="Align Right"
                onClick={() => onAction({ kind: 'align', value: 'right' })}
              >
                <AlignRight size={14} />
              </button>
            </div>
          </>
        )}

        <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
        <button
          style={dangerItemStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          onClick={() => onAction({ kind: 'delete' })}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

function FloatingDeleteButton({ onClick }: { onClick: () => void }) {
  const C = useT();
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Delete block"
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 30,
        width: 28,
        height: 28,
        border: 'none',
        borderRadius: 6,
        background: hover ? C.dangerHover : C.danger,
        color: C.textOnAccent,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        transition: 'background .15s',
      }}
    >
      <Trash2 size={14} />
    </button>
  );
}

function AddRowButton({ position, onClick }: { position: 'top' | 'bottom'; onClick: () => void }) {
  const C = useT();
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={position === 'top' ? 'Add row above' : 'Add row below'}
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(position === 'top' ? { top: -14 } : { bottom: -14 }),
        zIndex: 30,
        width: 28,
        height: 28,
        border: `2px solid ${hover ? C.accentHover : C.accent}`,
        borderRadius: '50%',
        background: hover ? C.accent : C.bg,
        color: hover ? C.textOnAccent : C.accent,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,.14)',
        transition: 'all .15s',
      }}
    >
      <Plus size={14} />
    </button>
  );
}

function Canvas({
  doc,
  selection,
  viewMode,
  onViewMode,
  previewEnabled,
  draggingPayload,
  isRowDragging,
  paletteDropTarget,
  onSelectBlock,
  onSelectSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onDeleteBlock,
  onAddBlock,
  onAddRowAt,
  onMoveSectionToIndex,
  onClearSelection,
  onBlockContextMenu,
  onSectionContextMenu,
}: {
  doc: EmailDocument;
  selection: Selection;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
  previewEnabled: boolean;
  draggingPayload: BlockDragPayload | null;
  isRowDragging: boolean;
  paletteDropTarget: { sectionId: string; columnId: string; index: number } | null;
  onSelectBlock: (sel: Selection) => void;
  onSelectSection: (sId: string) => void;
  onMoveSection: (sId: string, dir: -1 | 1) => void;
  onDuplicateSection: (sId: string) => void;
  onDeleteSection: (sId: string) => void;
  onDeleteBlock: (sId: string, cId: string, bId: string) => void;
  onAddBlock: (sId: string, cId: string, type: EmailBlockType, atIndex?: number) => void;
  onAddRowAt: (index: number, widths: number[]) => void;
  onMoveSectionToIndex: (sectionId: string, toIndex: number) => void;
  onClearSelection: () => void;
  onBlockContextMenu: (e: React.MouseEvent, sectionId: string, columnId: string, blockId: string, blockIndex: number, totalBlocks: number, currentAlign?: string) => void;
  onSectionContextMenu: (e: React.MouseEvent, sectionId: string, sectionIndex: number, totalSections: number) => void;
}) {
  const C = useT();
  const isMobilePreview = viewMode === 'mobile';
  const isTabletPreview = viewMode === 'tablet';
  const rowContentWidth = isMobilePreview ? 375 : isTabletPreview ? 768 : doc.settings.contentWidth;
  const canvasWidth: React.CSSProperties['width'] = isMobilePreview ? 375 : isTabletPreview ? 768 : '100%';

  return (
    <div
      style={{ flex: 1, overflowY: 'auto', background: C.canvasBg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, position: 'relative' }}
      onClick={previewEnabled ? undefined : onClearSelection}
    >
      {/* Device toggle at top center */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, marginBottom: 16 }}>
        <DeviceToggle viewMode={viewMode} onViewMode={onViewMode} />
      </div>

      <div
        style={{
          width: canvasWidth,
          maxWidth: isMobilePreview ? 375 : isTabletPreview ? 768 : '100%',
          minHeight: '100%',
          background: C.bg,
          boxShadow: '0 4px 24px rgba(0,0,0,.12)',
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'all .25s ease',
          pointerEvents: previewEnabled ? 'none' : 'auto',
        }}
      >
        {!previewEnabled && doc.sections.length === 0 && (
          <RowDropZone empty onDropRow={(widths) => onAddRowAt(0, widths)} onDropSection={() => {}} />
        )}
        {!previewEnabled && doc.sections.length > 0 && (
          <RowDropZone
            position="edge"
            isDragging={isRowDragging}
            onDropRow={(widths) => onAddRowAt(0, widths)}
            onDropSection={(sectionId) => onMoveSectionToIndex(sectionId, 0)}
          />
        )}
        {doc.sections.map((section, index) => {
          const isSectionSelected = !previewEnabled && selection?.type === 'section' && selection.sectionId === section.id;

          return (
            <React.Fragment key={section.id}>
              <div style={{ position: 'relative' }}>
                <SectionCard
                  section={section}
                  index={index}
                  total={doc.sections.length}
                  selection={previewEnabled ? null : selection}
                  contentWidth={rowContentWidth}
                  fontFamily={doc.settings.fontFamily}
                  draggingPayload={previewEnabled ? null : draggingPayload}
                  paletteDropTarget={previewEnabled ? null : paletteDropTarget}
                  onSelectBlock={previewEnabled ? () => {} : onSelectBlock}
                  onSelectSection={previewEnabled ? () => {} : onSelectSection}
                  onMoveUp={() => onMoveSection(section.id, -1)}
                  onMoveDown={() => onMoveSection(section.id, 1)}
                  onDuplicate={() => onDuplicateSection(section.id)}
                  onDelete={() => onDeleteSection(section.id)}
                  onAddBlock={onAddBlock}
                  previewEnabled={previewEnabled}
                  showBlockDelete={!previewEnabled && selection?.type === 'block' && selection.sectionId === section.id}
                  selectedBlockId={selection?.type === 'block' ? selection.blockId : undefined}
                  onDeleteBlock={onDeleteBlock}
                  onBlockContextMenu={!previewEnabled ? onBlockContextMenu : undefined}
                  onSectionContextMenu={!previewEnabled ? (e: React.MouseEvent) => onSectionContextMenu(e, section.id, index, doc.sections.length) : undefined}
                />
                {/* Add row buttons on selected row */}
                {isSectionSelected && (
                  <>
                    <AddRowButton position="top" onClick={() => onAddRowAt(index, [100])} />
                    <AddRowButton position="bottom" onClick={() => onAddRowAt(index + 1, [100])} />
                  </>
                )}
              </div>
              {!previewEnabled && index < doc.sections.length - 1 && (
                <RowDropZone
                  position="between"
                  isDragging={isRowDragging}
                  onDropRow={(widths) => onAddRowAt(index + 1, widths)}
                  onDropSection={(sectionId) => onMoveSectionToIndex(sectionId, index + 1)}
                />
              )}
            </React.Fragment>
          );
        })}
        {!previewEnabled && doc.sections.length > 0 && (
          <RowDropZone
            position="edge"
            isDragging={isRowDragging}
            onDropRow={(widths) => onAddRowAt(doc.sections.length, widths)}
            onDropSection={(sectionId) => onMoveSectionToIndex(sectionId, doc.sections.length)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Right inspector panel ───────────────────────────────────────────────────

function BodySettingsPanel({
  doc,
  onUpdateSettings,
}: {
  doc: EmailDocument;
  onUpdateSettings: (patch: Partial<EmailDocument['settings']>) => void;
}) {
  const C = useT();
  const fontFamilyOptions = [
    { value: "'Inter', 'Helvetica Neue', Arial, sans-serif", label: 'Inter' },
    { value: "'Georgia', serif", label: 'Georgia' },
    { value: "'Courier New', monospace", label: 'Courier New' },
    { value: "'Arial', 'Helvetica', sans-serif", label: 'Arial' },
    { value: "'Verdana', sans-serif", label: 'Verdana' },
    { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: "'Roboto', 'Helvetica Neue', Arial, sans-serif", label: 'Roboto' },
  ];

  const fontWeightOptions = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <InspectorSection title="Typography">
          <Field label="Font Family">
            <SelectInput value={doc.settings.fontFamily} options={fontFamilyOptions} onChange={(v) => onUpdateSettings({ fontFamily: v })} />
          </Field>
          <Field label="Base Font Size">
            <NumberInput value={doc.settings.fontSize} min={10} max={32} onChange={(v) => onUpdateSettings({ fontSize: v })} />
          </Field>
          <Field label="Font Weight">
            <SelectInput value={String(doc.settings.fontWeight)} options={fontWeightOptions} onChange={(v) => onUpdateSettings({ fontWeight: Number(v) })} />
          </Field>
          <Field label="Text Color">
            <PaletteColorPicker value={doc.settings.bodyTextColor} onChange={(v) => onUpdateSettings({ bodyTextColor: v })} />
          </Field>
          <Field label="Link Color">
            <PaletteColorPicker value={doc.settings.linkColor} onChange={(v) => onUpdateSettings({ linkColor: v })} />
          </Field>
          <Field label="Underline Links">
            <button
              onClick={() => onUpdateSettings({ linkUnderline: !doc.settings.linkUnderline })}
              style={{
                padding: '5px 12px',
                border: `1px solid ${doc.settings.linkUnderline ? C.accent : C.border}`,
                borderRadius: 6,
                background: doc.settings.linkUnderline ? `${C.accent}12` : C.bgSubtle,
                color: doc.settings.linkUnderline ? C.accent : C.textMuted,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {doc.settings.linkUnderline ? 'Yes' : 'No'}
            </button>
          </Field>
        </InspectorSection>

        <ColorPaletteSection
          doc={doc}
          onUpdateSettings={onUpdateSettings}
        />

        <InspectorSection title="Layout">
          <Field label="Background Color">
            <PaletteColorPicker value={doc.settings.backgroundColor} onChange={(v) => onUpdateSettings({ backgroundColor: v })} />
          </Field>
          <Field label="Content Background">
            <PaletteColorPicker value={doc.settings.contentBackgroundColor} onChange={(v) => onUpdateSettings({ contentBackgroundColor: v })} />
          </Field>
          <Field label="Content Width (px)">
            <NumberInput value={doc.settings.contentWidth} min={320} max={1200} onChange={(v) => onUpdateSettings({ contentWidth: v })} />
          </Field>
          <Field label="Content Align">
            <AlignButtons value={doc.settings.contentAlign} onChange={(v) => onUpdateSettings({ contentAlign: v })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            <Field label="Pad Top">
              <NumberInput value={doc.settings.contentPaddingTop} min={0} max={100} onChange={(v) => onUpdateSettings({ contentPaddingTop: v })} />
            </Field>
            <Field label="Pad Right">
              <NumberInput value={doc.settings.contentPaddingRight} min={0} max={100} onChange={(v) => onUpdateSettings({ contentPaddingRight: v })} />
            </Field>
            <Field label="Pad Bottom">
              <NumberInput value={doc.settings.contentPaddingBottom} min={0} max={100} onChange={(v) => onUpdateSettings({ contentPaddingBottom: v })} />
            </Field>
            <Field label="Pad Left">
              <NumberInput value={doc.settings.contentPaddingLeft} min={0} max={100} onChange={(v) => onUpdateSettings({ contentPaddingLeft: v })} />
            </Field>
          </div>
        </InspectorSection>

        <InspectorSection title="Meta">
          <Field label="Preheader Text">
            <textarea
              style={{ ...textareaStyle(C), minHeight: 60 }}
              value={doc.settings.preheaderText}
              onChange={(e) => onUpdateSettings({ preheaderText: e.target.value })}
              placeholder="Preview text shown in inbox..."
            />
          </Field>
        </InspectorSection>
      </div>
    </div>
  );
}

function RightInspector({
  doc,
  selection,
  onUpdateBlock,
  onDeleteBlock,
  onUpdateSection,
  onDeleteSection,
  onClearSelection,
  onUpdateSettings,
}: {
  doc: EmailDocument;
  selection: Selection;
  onUpdateBlock: (sId: string, cId: string, bId: string, patch: Partial<EmailBlock>) => void;
  onDeleteBlock: (sId: string, cId: string, bId: string) => void;
  onUpdateSection: (sId: string, patch: Partial<EmailSection>) => void;
  onDeleteSection: (sId: string) => void;
  onClearSelection: () => void;
  onUpdateSettings: (patch: Partial<EmailDocument['settings']>) => void;
}) {
  const C = useT();
  let content: React.ReactNode = <BodySettingsPanel doc={doc} onUpdateSettings={onUpdateSettings} />;

  if (selection) {
    content = null;
    if (selection.type === 'block') {
      const block = findBlock(doc, selection.sectionId, selection.columnId, selection.blockId);
      if (block) {
        content = (
          <BlockInspectorPanel
            block={block}
            onUpdate={(patch) => onUpdateBlock(selection.sectionId, selection.columnId, selection.blockId, patch)}
            onDelete={() => onDeleteBlock(selection.sectionId, selection.columnId, selection.blockId)}
            onClose={onClearSelection}
          />
        );
      }
    } else if (selection.type === 'section') {
      const section = findSection(doc, selection.sectionId);
      if (section) {
        content = (
          <SectionInspectorPanel
            section={section}
            onUpdate={(patch) => onUpdateSection(selection.sectionId, patch)}
            onDelete={() => onDeleteSection(selection.sectionId)}
            onClose={onClearSelection}
          />
        );
      }
    }
    if (!content) {
      content = <BodySettingsPanel doc={doc} onUpdateSettings={onUpdateSettings} />;
    }
  }

  return (
    <div
      style={{
        width: '100%',
        background: C.bg,
        borderLeft: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {content}
    </div>
  );
}

// ─── Main editor component ────────────────────────────────────────────────────

export function EmailBlockEditor({
  value,
  onChange,
  height = '100%',
  theme: themeMode = 'light',
  defaultPalette,
  sampleBlocks,
  templates: userTemplates,
  customTabs,
  features: featureOverrides,
  onThemeChange,
}: EmailBlockEditorProps) {
  const themeTokens = getTheme(themeMode);
  const features: EditorFeatures = { ...DEFAULT_FEATURES, ...featureOverrides };
  const [doc, setDoc] = useState<EmailDocument>(() => {
    const base = value ? normalizeDocument(value) : createEmptyDocument();
    if (defaultPalette) {
      return { ...base, settings: { ...base.settings, colorPalette: { ...base.settings.colorPalette, ...defaultPalette } } };
    }
    return base;
  });
  const [selection, setSelection] = useState<Selection>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('blocks');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  // ── Drag state (lifted from Canvas) ────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [dragKind, setDragKind] = useState<'row' | 'section' | null>(null);
  const [draggingPayload, setDraggingPayload] = useState<BlockDragPayload | null>(null);
  const isRowDragging = isDragging && (dragKind === 'row' || dragKind === 'section');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeBlockOverlayWidth, setActiveBlockOverlayWidth] = useState<number | null>(null);
  const [activePaletteBlock, setActivePaletteBlock] = useState<EmailBlock | null>(null);
  const [activePaletteRow, setActivePaletteRow] = useState<number[] | null>(null);
  const [paletteDropTarget, setPaletteDropTarget] = useState<{ sectionId: string; columnId: string; index: number } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Custom collision detection: prefer pointerWithin (respects full block rect)
  // and prioritise block-level droppables over column-level ones.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const within = pointerWithin(args);
    if (within.length > 0) {
      // Prefer block hits over column hits
      const blockHit = within.find((c) => {
        const d = c.data?.droppableContainer?.data?.current as Record<string, unknown> | undefined;
        return d?.kind === 'block';
      });
      if (blockHit) return [blockHit];
      return within;
    }
    return closestCenter(args);
  }, []);

  const update = useCallback(
    (next: EmailDocument) => {
      setDoc(next);
      onChange?.(next);
    },
    [onChange],
  );

  // ── Section operations ─────────────────────────────────────────────────────

  const addSection = useCallback(
    (type: 'blank' | 'hero' | 'two-column' | 'cta') => {
      const section = createSectionTemplate(type);
      update({ ...doc, sections: [...doc.sections, section] });
      setSelection({ type: 'section', sectionId: section.id });
    },
    [doc, update],
  );

  const addSectionLayout = useCallback(
    (widths: number[]) => {
      const section = createRowFromWidths(widths);
      update({ ...doc, sections: [...doc.sections, section] });
      setSelection({ type: 'section', sectionId: section.id });
    },
    [doc, update],
  );

  const addPrebuiltSection = useCallback(
    (section: EmailSection) => {
      update({ ...doc, sections: [...doc.sections, section] });
      setSelection({ type: 'section', sectionId: section.id });
    },
    [doc, update],
  );

  const addRowAt = useCallback(
    (index: number, widths: number[]) => {
      const row = createRowFromWidths(widths);
      const sections = [...doc.sections];
      sections.splice(index, 0, row);
      update({ ...doc, sections });
      setSelection({ type: 'section', sectionId: row.id });
    },
    [doc, update],
  );

  const moveSection = useCallback(
    (sectionId: string, dir: -1 | 1) => {
      const index = doc.sections.findIndex((s) => s.id === sectionId);
      update({ ...doc, sections: moveItem(doc.sections, index, dir) });
    },
    [doc, update],
  );

  const moveSectionToIndex = useCallback(
    (sectionId: string, toIndex: number) => {
      const fromIndex = doc.sections.findIndex((s) => s.id === sectionId);
      if (fromIndex === -1) return;

      let normalizedTarget = toIndex;
      if (toIndex > fromIndex) normalizedTarget = toIndex - 1;
      if (normalizedTarget === fromIndex) return;

      const sections = [...doc.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(Math.max(0, Math.min(normalizedTarget, sections.length)), 0, moved);
      update({ ...doc, sections });
      setSelection({ type: 'section', sectionId: moved.id });
    },
    [doc, update],
  );

  const duplicateSection = useCallback(
    (sectionId: string) => {
      const section = findSection(doc, sectionId);
      if (!section) return;
      const copy = normalizeSection({ ...section, id: undefined });
      const index = doc.sections.findIndex((s) => s.id === sectionId);
      const sections = [...doc.sections];
      sections.splice(index + 1, 0, copy);
      update({ ...doc, sections });
      setSelection({ type: 'section', sectionId: copy.id });
    },
    [doc, update],
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      update({ ...doc, sections: doc.sections.filter((s) => s.id !== sectionId) });
      setSelection(null);
    },
    [doc, update],
  );

  const updateSection = useCallback(
    (sectionId: string, patch: Partial<EmailSection>) => {
      update(mapSection(doc, sectionId, (s) => ({ ...s, ...patch })));
    },
    [doc, update],
  );

  // ── Block operations ───────────────────────────────────────────────────────

  /** Adds a block to the first column of the selected/last section. */
  const addBlockToSection = useCallback(
    (type: EmailBlockType) => {
      let sectionId: string;
      let columnId: string;

      if (selection?.type === 'section') {
        sectionId = selection.sectionId;
        const section = findSection(doc, sectionId)!;
        columnId = section.columns[0].id;
      } else if (selection?.type === 'block') {
        sectionId = selection.sectionId;
        columnId = selection.columnId;
      } else if (doc.sections.length > 0) {
        const section = doc.sections[doc.sections.length - 1];
        sectionId = section.id;
        columnId = section.columns[0].id;
      } else {
        const section = createSectionTemplate('blank');
        const block = createBlockWithPalette(type, doc.settings.colorPalette);
        const updated: EmailDocument = {
          ...doc,
          sections: [
            { ...section, columns: [{ ...section.columns[0], blocks: [block] }] },
          ],
        };
        update(updated);
        setSelection({ type: 'block', sectionId: section.id, columnId: section.columns[0].id, blockId: block.id });
        return;
      }

      const block = createBlockWithPalette(type, doc.settings.colorPalette);
      update(
        mapSection(doc, sectionId, (s) => ({
          ...s,
          columns: s.columns.map((c) =>
            c.id !== columnId ? c : { ...c, blocks: [...c.blocks, block] },
          ),
        })),
      );
      setSelection({ type: 'block', sectionId, columnId, blockId: block.id });
    },
    [doc, selection, update],
  );

  const addBlockToColumn = useCallback(
    (sectionId: string, columnId: string, type: EmailBlockType, atIndex?: number) => {
      const block = createBlockWithPalette(type, doc.settings.colorPalette);
      update(
        mapSection(doc, sectionId, (s) => ({
          ...s,
          columns: s.columns.map((c) => {
            if (c.id !== columnId) return c;
            const blocks = [...c.blocks];
            if (atIndex === undefined) blocks.push(block);
            else blocks.splice(atIndex, 0, block);
            return { ...c, blocks };
          }),
        })),
      );
      setSelection({ type: 'block', sectionId, columnId, blockId: block.id });
    },
    [doc, update],
  );

  const updateBlock = useCallback(
    (sectionId: string, columnId: string, blockId: string, patch: Partial<EmailBlock>) => {
      update(mapBlock(doc, sectionId, columnId, blockId, (b) => ({ ...b, ...patch } as EmailBlock)));
    },
    [doc, update],
  );

  const moveBlock = useCallback(
    (payload: BlockDragPayload, targetSectionId: string, targetColumnId: string, atIndex: number) => {
      const nextDoc = moveBlockToTarget(doc, payload, targetSectionId, targetColumnId, atIndex);
      if (nextDoc === doc) return;

      update(nextDoc);
      setSelection({
        type: 'block',
        sectionId: targetSectionId,
        columnId: targetColumnId,
        blockId: payload.blockId,
      });
    },
    [doc, update],
  );

  const deleteBlock = useCallback(
    (sectionId: string, columnId: string, blockId: string) => {
      update(
        mapSection(doc, sectionId, (s) => ({
          ...s,
          columns: s.columns.map((c) =>
            c.id !== columnId ? c : { ...c, blocks: c.blocks.filter((b) => b.id !== blockId) },
          ),
        })),
      );
      setSelection(null);
    },
    [doc, update],
  );

  const updateSettings = useCallback(
    (patch: Partial<EmailDocument['settings']>) => {
      update({ ...doc, settings: { ...doc.settings, ...patch } });
    },
    [doc, update],
  );

  // ── Context menu handlers ──────────────────────────────────────────────────

  const handleBlockContextMenu = useCallback(
    (e: React.MouseEvent, sectionId: string, columnId: string, blockId: string, blockIndex: number, totalBlocks: number, currentAlign?: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'block', sectionId, columnId, blockId, blockIndex, totalBlocks, currentAlign } });
    },
    [],
  );

  const handleSectionContextMenu = useCallback(
    (e: React.MouseEvent, sectionId: string, sectionIndex: number, totalSections: number) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'section', sectionId, sectionIndex, totalSections } });
    },
    [],
  );

  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextMenu) return;
      const target = contextMenu.target;

      if (target.type === 'block') {
        const { sectionId, columnId, blockId, blockIndex } = target;
        if (action.kind === 'delete') {
          deleteBlock(sectionId, columnId, blockId);
        } else if (action.kind === 'moveUp' && blockIndex > 0) {
          update(
            mapSection(doc, sectionId, (s) => ({
              ...s,
              columns: s.columns.map((c) => {
                if (c.id !== columnId) return c;
                const blocks = [...c.blocks];
                [blocks[blockIndex - 1], blocks[blockIndex]] = [blocks[blockIndex], blocks[blockIndex - 1]];
                return { ...c, blocks };
              }),
            })),
          );
        } else if (action.kind === 'moveDown' && blockIndex < target.totalBlocks - 1) {
          update(
            mapSection(doc, sectionId, (s) => ({
              ...s,
              columns: s.columns.map((c) => {
                if (c.id !== columnId) return c;
                const blocks = [...c.blocks];
                [blocks[blockIndex], blocks[blockIndex + 1]] = [blocks[blockIndex + 1], blocks[blockIndex]];
                return { ...c, blocks };
              }),
            })),
          );
        } else if (action.kind === 'align') {
          updateBlock(sectionId, columnId, blockId, { align: action.value } as Partial<EmailBlock>);
        }
      } else {
        const { sectionId, sectionIndex } = target;
        if (action.kind === 'delete') {
          deleteSection(sectionId);
        } else if (action.kind === 'moveUp' && sectionIndex > 0) {
          moveSection(sectionId, -1);
        } else if (action.kind === 'moveDown' && sectionIndex < target.totalSections - 1) {
          moveSection(sectionId, 1);
        }
      }

      setContextMenu(null);
    },
    [contextMenu, doc, update, deleteBlock, deleteSection, moveSection, updateBlock],
  );

  // ── Drag helpers (lifted from Canvas) ──────────────────────────────────────

  const findBlockLocation = useCallback(
    (blockId: string) => {
      for (const section of doc.sections) {
        for (const column of section.columns) {
          const index = column.blocks.findIndex((block) => block.id === blockId);
          if (index !== -1) {
            return { sectionId: section.id, columnId: column.id, index };
          }
        }
      }
      return null;
    },
    [doc.sections],
  );

  const activeBlock = activeBlockId
    ? doc.sections
        .flatMap((section) => section.columns)
        .flatMap((column) => column.blocks)
        .find((block) => block.id === activeBlockId) ?? null
    : null;

  const resolveDropTarget = useCallback(
    (over: DragEndEvent['over'] | DragOverEvent['over'], pointerY?: number) => {
      if (!over) return null;
      const overData = over.data.current as
        | { kind?: 'block'; sectionId?: string; columnId?: string }
        | { kind?: 'column'; sectionId?: string; columnId?: string }
        | undefined;

      if (overData?.kind === 'column' && overData.sectionId && overData.columnId) {
        const section = doc.sections.find((item) => item.id === overData.sectionId);
        const column = section?.columns.find((item) => item.id === overData.columnId);
        if (!column) return null;
        return { sectionId: overData.sectionId, columnId: overData.columnId, index: column.blocks.length };
      }

      const blockLocation = findBlockLocation(String(over.id));
      if (!blockLocation) return null;

      // If we have a pointer Y, decide whether to insert before or after the
      // hovered block based on which half the pointer is in.
      if (typeof pointerY === 'number') {
        const el = document.querySelector<HTMLElement>(`[data-block-id="${over.id}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (pointerY > rect.top + rect.height / 2) {
            return { ...blockLocation, index: blockLocation.index + 1 };
          }
        }
      }

      return blockLocation;
    },
    [doc.sections, findBlockLocation],
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as Record<string, unknown> | undefined;
      const kind = data?.kind as string | undefined;

      if (kind === 'palette-block') {
        const blockType = data!.blockType as EmailBlockType;
        const block = createBlockWithPalette(blockType, doc.settings.colorPalette);
        setActivePaletteBlock(block);
        setActiveBlockOverlayWidth(320);
        return;
      }

      if (kind === 'palette-row') {
        const columns = data!.columns as number[];
        setActivePaletteRow(columns);
        return;
      }

      // Existing block reorder
      const blockId = String(event.active.id);
      const location = findBlockLocation(blockId);
      if (!location) return;
      const dragElement = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
      const measuredWidth =
        dragElement?.getBoundingClientRect().width ??
        event.active.rect.current.initial?.width ??
        null;
      setActiveBlockOverlayWidth(typeof measuredWidth === 'number' ? measuredWidth : null);
      setActiveBlockId(blockId);
      setDraggingPayload({
        sectionId: location.sectionId,
        columnId: location.columnId,
        blockId,
      });
    },
    [findBlockLocation],
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      if (!event.over) return;
      const data = event.active.data.current as Record<string, unknown> | undefined;
      const kind = data?.kind as string | undefined;

      // Track palette drop target for placeholder rendering
      if (kind === 'palette-block') {
        const pointerY = (event.activatorEvent as PointerEvent).clientY + event.delta.y;
        const target = resolveDropTarget(event.over, pointerY);
        setPaletteDropTarget(target);
        return;
      }
      if (kind === 'palette-row') return;

      const activeId = String(event.active.id);
      const source = findBlockLocation(activeId);
      const target = resolveDropTarget(event.over);
      if (!source || !target) return;

      const isSameColumn = source.sectionId === target.sectionId && source.columnId === target.columnId;
      if (isSameColumn) return;

      moveBlock(
        { sectionId: source.sectionId, columnId: source.columnId, blockId: activeId },
        target.sectionId,
        target.columnId,
        target.index,
      );
    },
    [findBlockLocation, moveBlock, resolveDropTarget],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const data = event.active.data.current as Record<string, unknown> | undefined;
      const kind = data?.kind as string | undefined;

      if (kind === 'palette-block' && activePaletteBlock) {
        const target = paletteDropTarget ?? resolveDropTarget(event.over);
        if (target) {
          addBlockToColumn(target.sectionId, target.columnId, activePaletteBlock.type, target.index);
        }
        setActivePaletteBlock(null);
        setActiveBlockOverlayWidth(null);
        setPaletteDropTarget(null);
        return;
      }

      if (kind === 'palette-row' && activePaletteRow) {
        // For now, palette rows add to the end
        // TODO: Could detect a row-drop-zone target
        setActivePaletteRow(null);
        setPaletteDropTarget(null);
        return;
      }

      // Existing block reorder
      const activeId = String(event.active.id);
      const source = findBlockLocation(activeId);
      const target = resolveDropTarget(event.over);

      if (source && target) {
        const isSameColumn = source.sectionId === target.sectionId && source.columnId === target.columnId;
        let targetIndex = target.index;
        if (isSameColumn && source.index < target.index) {
          targetIndex = target.index + 1;
        }

        moveBlock(
          { sectionId: source.sectionId, columnId: source.columnId, blockId: activeId },
          target.sectionId,
          target.columnId,
          targetIndex,
        );
      }

      setActiveBlockId(null);
      setActiveBlockOverlayWidth(null);
      setDraggingPayload(null);
    },
    [activePaletteBlock, activePaletteRow, addBlockToColumn, findBlockLocation, moveBlock, resolveDropTarget],
  );

  const onDragCancel = useCallback(() => {
    setActiveBlockId(null);
    setActiveBlockOverlayWidth(null);
    setDraggingPayload(null);
    setActivePaletteBlock(null);
    setActivePaletteRow(null);
    setPaletteDropTarget(null);
  }, []);

  // ── Native HTML5 drag detection for row/section drag (RowDropZones still use HTML5) ──
  useEffect(() => {
    const getDragKind = (e: DragEvent): 'row' | 'section' | null => {
      const targetElement = e.target instanceof Element
        ? e.target
        : e.target instanceof Node
          ? e.target.parentElement
          : null;
      const target = targetElement?.closest('[data-drag-kind]') ?? null;
      const attrKind = target?.getAttribute('data-drag-kind');
      if (attrKind === 'row' || attrKind === 'section') {
        return attrKind;
      }

      if (e.dataTransfer?.types.includes(SECTION_DRAG_TYPE)) return 'section';
      if (e.dataTransfer?.types.includes(ROW_DRAG_TYPE)) return 'row';
      return null;
    };

    const onStart = (e: DragEvent) => {
      const kind = getDragKind(e);
      if (!kind) return;
      setDragKind(kind);
      setIsDragging(true);
    };
    const onEnd = () => {
      setIsDragging(false);
      setDragKind(null);
    };
    window.addEventListener('dragstart', onStart, true);
    window.addEventListener('dragend', onEnd, true);
    window.addEventListener('drop', onEnd, true);
    return () => {
      window.removeEventListener('dragstart', onStart, true);
      window.removeEventListener('dragend', onEnd, true);
      window.removeEventListener('drop', onEnd, true);
    };
  }, []);

  // Determine overlay block to show
  const overlayBlock = activeBlock ?? activePaletteBlock;

  return (
    <ThemeContext.Provider value={themeTokens}>
    <PaletteContext.Provider value={{ palette: doc.settings.colorPalette, customColors: doc.settings.customColors }}>
    <div style={{ display: 'flex', flexDirection: 'column', height, width: '100%', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 13, position: 'relative' }}>
      <Toolbar
        previewEnabled={previewEnabled}
        onTogglePreview={() => {
          setPreviewEnabled(!previewEnabled);
          if (!previewEnabled) setSelection(null);
        }}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!previewEnabled && (
          <ResizablePanel defaultWidth={380} minWidth={300} maxWidth={600} side="left">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            doc={doc}
            onAddBlock={addBlockToSection}
            onAddSection={addSection}
            onAddLayout={addSectionLayout}
            onUpdateSettings={updateSettings}
            onAddPrebuilt={addPrebuiltSection}
            selection={selection}
            onSelectSection={(sId) => setSelection({ type: 'section', sectionId: sId })}
            onSelectBlock={(sId, cId, bId) => setSelection({ type: 'block', sectionId: sId, columnId: cId, blockId: bId })}
            sampleBlocks={sampleBlocks}
            userTemplates={userTemplates}
            customTabs={customTabs}
            features={features}
            themeMode={themeMode}
            onThemeChange={onThemeChange}
          />
          </ResizablePanel>
        )}
        <Canvas
          doc={doc}
          selection={selection}
          viewMode={viewMode}
          onViewMode={setViewMode}
          previewEnabled={previewEnabled}
          draggingPayload={draggingPayload}
          isRowDragging={isRowDragging}
          paletteDropTarget={paletteDropTarget}
          onSelectBlock={setSelection}
          onSelectSection={(sId) => setSelection({ type: 'section', sectionId: sId })}
          onMoveSection={moveSection}
          onDuplicateSection={duplicateSection}
          onDeleteSection={deleteSection}
          onDeleteBlock={deleteBlock}
          onAddBlock={addBlockToColumn}
          onAddRowAt={addRowAt}
          onMoveSectionToIndex={moveSectionToIndex}
          onClearSelection={() => setSelection(null)}
          onBlockContextMenu={handleBlockContextMenu}
          onSectionContextMenu={handleSectionContextMenu}
        />
        {!previewEnabled && (
          <ResizablePanel defaultWidth={320} minWidth={260} maxWidth={500} side="right">
            <RightInspector
              doc={doc}
              selection={selection}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onUpdateSection={updateSection}
              onDeleteSection={deleteSection}
              onClearSelection={() => setSelection(null)}
              onUpdateSettings={updateSettings}
            />
          </ResizablePanel>
        )}
      </div>
      <DragOverlay>
        {overlayBlock ? (
          <div style={{ width: activeBlockOverlayWidth ?? undefined, pointerEvents: 'none' }}>
            <BlockPreview
              block={overlayBlock}
              fontFamily={doc.settings.fontFamily}
              isSelected={false}
              onClick={() => {}}
            />
          </div>
        ) : activePaletteRow ? (
          <div
            style={{
              width: 220,
              display: 'grid',
              gridTemplateColumns: activePaletteRow.map((w) => `${w}fr`).join(' '),
              border: `1px solid ${themeTokens.border}`,
              borderRadius: 6,
              overflow: 'hidden',
              background: themeTokens.bg,
              minHeight: 58,
              boxShadow: '0 4px 18px rgba(0,0,0,.14)',
            }}
          >
            {activePaletteRow.map((_, index) => (
              <div key={index} style={{ borderLeft: index === 0 ? 'none' : `1px solid ${themeTokens.border}` }} />
            ))}
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>
      {contextMenu && (
        <ContextMenuOverlay
          menu={contextMenu}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
    </PaletteContext.Provider>
    </ThemeContext.Provider>
  );
}
