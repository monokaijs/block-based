'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Code2,
  Copy,
  Heading1,
  Image,
  Laptop,
  Link,
  Menu as MenuIcon,
  MessageSquare,
  MinusSquare,
  MousePointerClick,
  MoveVertical,
  GripVertical,
  Plus,
  Rows4,
  SeparatorHorizontal,
  Smartphone,
  Trash2,
  type LucideProps,
} from 'lucide-react';
import type {
  EmailBlock,
  EmailBlockType,
  EmailColumn,
  EmailDocument,
  MenuItem,
  EmailSection,
} from './types';
import { createBlock } from './blocks';
import { createEmptyDocument, normalizeDocument } from './document';
import { createSectionTemplate, normalizeSection } from './section';
import { nextId } from './utils';

// ─── Colour tokens ───────────────────────────────────────────────────────────

const C = {
  sidebarBg: '#ffffff',
  sidebarText: '#18181b',
  sidebarMuted: '#71717a',
  sidebarBorder: '#e4e4e7',
  sidebarHover: '#f4f4f5',
  tabActive: '#f4f4f5',
  canvasBg: '#d4d4d8',
  inspectorBg: '#ffffff',
  inspectorBorder: '#e4e4e7',
  inspectorMuted: '#71717a',
  accent: '#2563eb',
  accentHover: '#1d4ed8',
  danger: '#dc2626',
  dangerHover: '#b91c1c',
  blockHover: 'rgba(37,99,235,0.08)',
  blockSelected: '#2563eb',
  sectionHover: 'rgba(37,99,235,0.05)',
};

// ─── Internal types ───────────────────────────────────────────────────────────

type Selection =
  | { type: 'block'; sectionId: string; columnId: string; blockId: string }
  | { type: 'section'; sectionId: string }
  | null;

export interface EmailBlockEditorProps {
  value?: EmailDocument;
  onChange?: (doc: EmailDocument) => void;
  height?: string | number;
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
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.inspectorMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '5px 7px',
  border: `1px solid ${C.inspectorBorder}`,
  borderRadius: 6,
  fontSize: 12,
  background: '#fafafa',
  color: '#18181b',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: 'vertical',
  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
};

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} />;
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
  return (
    <select
      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
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
        style={{ ...inputStyle, width: '100%', paddingRight: 40 }}
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
            border: `1px solid ${C.inspectorBorder}`,
            borderRadius: 4,
            background: '#f4f4f5',
            color: '#52525b',
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
            border: `1px solid ${C.inspectorBorder}`,
            borderRadius: 4,
            background: '#f4f4f5',
            color: '#52525b',
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
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 32, height: 32, border: `1px solid ${C.inspectorBorder}`, borderRadius: 4, cursor: 'pointer', padding: 2, background: 'none' }} />
      <input style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AlignButtons({ value, onChange }: { value?: string; onChange: (v: 'left' | 'center' | 'right') => void }) {
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
            border: `1px solid ${value === v ? C.accent : C.inspectorBorder}`,
            borderRadius: 5,
            background: value === v ? C.accent : '#fafafa',
            color: value === v ? '#fff' : '#71717a',
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
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.inspectorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inspectorMuted }}>
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
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.inspectorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inspectorMuted }}>
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
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.inspectorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inspectorMuted }}>
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
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `1px solid ${C.inspectorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inspectorMuted }}>
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
  return (
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.inspectorBorder}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.inspectorMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
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
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 2, borderRadius: 999, border: `1px solid ${C.inspectorBorder}`, background: '#fafafa' }}>
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
          color: mode === 'basic' ? '#fff' : '#71717a',
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
          color: mode === 'advanced' ? '#fff' : '#71717a',
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
        <div style={{ border: `1px solid ${C.inspectorBorder}`, borderRadius: 8, padding: 8, background: '#fafafa' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.inspectorMuted, marginBottom: 6 }}>Padding</div>
          <PaddingControls value={value} kind="padding" mode={mode} onChange={onChange} />
        </div>
        <div style={{ border: `1px solid ${C.inspectorBorder}`, borderRadius: 8, padding: 8, background: '#fafafa' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.inspectorMuted, marginBottom: 6 }}>Margin</div>
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
        <ColorInput value={value.borderColor ?? '#d1d5db'} onChange={(v) => onChange({ borderColor: v })} />
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
        color: hover ? '#fff' : C.danger,
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
        <Field label="Color"><ColorInput value={block.color ?? '#111827'} onChange={(v) => onUpdate({ color: v })} /></Field>
        <Field label="Align"><AlignButtons value={block.align} onChange={(v) => onUpdate({ align: v })} /></Field>
      </InspectorSection>
      <SpacingSection value={block} onChange={onUpdate} />
      <BorderSection value={block} onChange={onUpdate} />
      <VisibilitySection value={block} onChange={onUpdate} />
    </>
  );
}

function ParagraphInspector({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'paragraph' }>; onUpdate: (patch: Partial<typeof block>) => void }) {
  return (
    <>
      <InspectorSection title="Content">
        <Field label="Text">
          <textarea style={textareaStyle} value={block.content} onChange={(e) => onUpdate({ content: e.target.value })} />
        </Field>
        <Field label="Font Size"><NumberInput value={block.fontSize ?? 16} min={8} max={48} onChange={(v) => onUpdate({ fontSize: v })} /></Field>
        <Field label="Color"><ColorInput value={block.color ?? '#4b5563'} onChange={(v) => onUpdate({ color: v })} /></Field>
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
        <Field label="Background"><ColorInput value={block.backgroundColor ?? '#881c1c'} onChange={(v) => onUpdate({ backgroundColor: v })} /></Field>
        <Field label="Text Color"><ColorInput value={block.textColor ?? '#ffffff'} onChange={(v) => onUpdate({ textColor: v })} /></Field>
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
        <Field label="Color"><ColorInput value={block.color ?? '#e5e7eb'} onChange={(v) => onUpdate({ color: v })} /></Field>
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
            <div key={index} style={{ border: `1px solid ${C.inspectorBorder}`, borderRadius: 6, padding: 8, background: '#fafafa' }}>
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
                  border: `1px solid ${C.inspectorBorder}`,
                  borderRadius: 6,
                  background: '#ffffff',
                  color: '#52525b',
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
              border: `1px dashed ${C.inspectorBorder}`,
              borderRadius: 6,
              background: '#ffffff',
              color: '#52525b',
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
        <Field label="Color"><ColorInput value={block.color ?? '#374151'} onChange={(v) => onUpdate({ color: v })} /></Field>
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
  return (
    <>
      <InspectorSection title="Content">
        <Field label="HTML">
          <textarea style={textareaStyle} value={block.content} onChange={(e) => onUpdate({ content: e.target.value })} />
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
}: {
  block: EmailBlock;
  onUpdate: (patch: Partial<EmailBlock>) => void;
  onDelete: () => void;
}) {
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
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.inspectorBorder}`, fontWeight: 600, fontSize: 13, color: '#18181b' }}>
        {label[block.type]} Block
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
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.inspectorBorder}` }}>
        <DangerButton label="Delete Block" onClick={onDelete} />
      </div>
    </div>
  );
}

function SectionInspectorPanel({
  section,
  onUpdate,
  onDelete,
}: {
  section: EmailSection;
  onUpdate: (patch: Partial<EmailSection>) => void;
  onDelete: () => void;
}) {
  const currentLayout = section.columns.map((column) => Math.round(column.width));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.inspectorBorder}`, fontWeight: 600, fontSize: 13 }}>
        Row
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
                    border: `1px solid ${active ? C.accent : C.inspectorBorder}`,
                    borderRadius: 6,
                    background: active ? `${C.accent}0d` : '#fafafa',
                    cursor: 'pointer',
                    height: 56,
                  }}
                >
                  <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: option.widths.map((width) => `${width}fr`).join(' '), border: `1px solid ${active ? '#93c5fd' : '#d4d4d8'}`, borderRadius: 4, overflow: 'hidden', background: '#ffffff' }}>
                    {option.widths.map((_, index) => (
                      <div key={index} style={{ borderLeft: index === 0 ? 'none' : `1px solid ${active ? '#93c5fd' : '#d4d4d8'}` }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </InspectorSection>
        <InspectorSection title="Style">
          <Field label="Background"><ColorInput value={section.backgroundColor ?? '#ffffff'} onChange={(v) => onUpdate({ backgroundColor: v })} /></Field>
        </InspectorSection>
        <SpacingSection value={section} onChange={onUpdate} />
        <BorderSection value={section} onChange={onUpdate} />
        <VisibilitySection value={section} onChange={onUpdate} showBorderRadius />
      </div>
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.inspectorBorder}` }}>
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
  return (
    <div style={{ width: 280, background: C.inspectorBg, borderLeft: `1px solid ${C.inspectorBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      {!selection && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.inspectorMuted, fontSize: 13, gap: 6 }}>
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
  onDragStart,
  onClick,
  dimmed = false,
}: {
  block: EmailBlock;
  fontFamily: string;
  isSelected: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  dimmed?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const ringColor = isSelected ? C.blockSelected : hover ? `${C.accent}66` : 'transparent';
  const wrapStyle: React.CSSProperties = {
    position: 'relative',
    cursor: onDragStart ? 'grab' : 'pointer',
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
      draggable={Boolean(onDragStart)}
      data-drag-kind={onDragStart ? 'block' : undefined}
      onDragStart={onDragStart}
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

// ─── Section card (canvas) ───────────────────────────────────────────────────

function ControlBtn({ icon, onClick, title }: { icon: React.ReactElement; onClick: (e: React.MouseEvent) => void; title?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: 'none', borderRadius: 4, background: hover ? '#27272a' : '#18181b', color: '#e4e4e7', cursor: 'pointer' }}
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
    <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 100, background: '#fff', border: `1px solid ${C.inspectorBorder}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.15)', padding: 6, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, minWidth: 220 }}>
      {types.map(({ type, label, Icon }) => (
        <button
          key={type}
          onClick={(e) => { e.stopPropagation(); onAdd(type); onClose(); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', border: `1px solid ${C.inspectorBorder}`, borderRadius: 6, background: '#fafafa', cursor: 'pointer', fontSize: 11, color: '#52525b' }}
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
          color: showMoveIndicator ? C.accent : '#a1a1aa',
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
        border: collapsed ? 'none' : `2px dashed ${over ? C.accent : (isDragging || empty) ? '#e4e4e7' : 'transparent'}`,
        background: over
          ? `repeating-linear-gradient(135deg, ${C.accent}10 0 10px, ${C.accent}20 10px 20px)`
          : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: over ? C.accent : '#a1a1aa',
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
  snapTarget,
  draggingBlock,
  draggingPayload,
  onBlockDragStart,
  onSelectBlock,
  onAddBlock,
  onMoveBlock,
  onSetSnapTarget,
  isDragging = false,
}: {
  column: EmailColumn;
  section: EmailSection;
  selection: Selection;
  fontFamily: string;
  snapTarget: BlockSnapTarget | null;
  draggingBlock: EmailBlock | null;
  draggingPayload: BlockDragPayload | null;
  onBlockDragStart: (payload: BlockDragPayload, block: EmailBlock) => void;
  onSelectBlock: (sel: Selection) => void;
  onAddBlock: (sectionId: string, columnId: string, type: EmailBlockType, atIndex?: number) => void;
  onMoveBlock: (payload: BlockDragPayload, targetSectionId: string, targetColumnId: string, atIndex: number) => void;
  onSetSnapTarget: (target: BlockSnapTarget | null) => void;
  isDragging?: boolean;
}) {
  const blockRefs = useRef<Array<HTMLDivElement | null>>([]);

  const isSnapTarget = (index: number) =>
    Boolean(
      snapTarget &&
      snapTarget.sectionId === section.id &&
      snapTarget.columnId === column.id &&
      snapTarget.index === index,
    );

  const activeSnapIndex =
    snapTarget &&
    snapTarget.sectionId === section.id &&
    snapTarget.columnId === column.id
      ? snapTarget.index
      : null;

  const sourceIndex =
    draggingPayload &&
    draggingPayload.sectionId === section.id &&
    draggingPayload.columnId === column.id
      ? column.blocks.findIndex((block) => block.id === draggingPayload.blockId)
      : -1;

  const setCandidateSnapTarget = (index: number, hovering: boolean) => {
    if (!hovering) {
      onSetSnapTarget(null);
      return;
    }

    const isNoOpTarget =
      sourceIndex !== -1 &&
      (index === sourceIndex || index === sourceIndex + 1);

    if (isNoOpTarget) {
      onSetSnapTarget(null);
      return;
    }

    onSetSnapTarget({ sectionId: section.id, columnId: column.id, index });
  };

  const getOverlayTop = () => {
    if (activeSnapIndex === null) return 0;
    if (activeSnapIndex <= 0) return 0;

    const previousBlock = blockRefs.current[activeSnapIndex - 1];
    if (previousBlock) {
      return previousBlock.offsetTop + previousBlock.offsetHeight;
    }

    return 0;
  };

  return (
    <div style={{ flex: `0 0 ${column.width}%`, maxWidth: `${column.width}%`, padding: '0 8px', boxSizing: 'border-box', position: 'relative' }}>
      {column.blocks.map((block, i) => (
        <React.Fragment key={block.id}>
          <DropZone
            isDragging={isDragging}
            onDropType={(type) => onAddBlock(section.id, column.id, type, i)}
            onDropBlock={(payload) => onMoveBlock(payload, section.id, column.id, i)}
            onMoveHoverChange={(hovering) => setCandidateSnapTarget(i, hovering)}
          />
          <div ref={(el) => { blockRefs.current[i] = el; }}>
            <BlockPreview
              block={block}
              fontFamily={fontFamily}
              isSelected={selection?.type === 'block' && selection.blockId === block.id}
              dimmed={
                Boolean(
                  draggingPayload &&
                  draggingPayload.sectionId === section.id &&
                  draggingPayload.columnId === column.id &&
                  draggingPayload.blockId === block.id,
                )
              }
              onDragStart={(e) => {
                e.stopPropagation();
                const payload = { sectionId: section.id, columnId: column.id, blockId: block.id };
                onBlockDragStart(payload, block);
                e.dataTransfer.setData(
                  BLOCK_INSTANCE_DRAG_TYPE,
                  JSON.stringify(payload),
                );
                e.dataTransfer.effectAllowed = 'move';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlock({ type: 'block', sectionId: section.id, columnId: column.id, blockId: block.id });
              }}
            />
          </div>
        </React.Fragment>
      ))}
      <DropZone
        isEmpty={column.blocks.length === 0}
        isDragging={isDragging}
        onDropType={(type) => onAddBlock(section.id, column.id, type, column.blocks.length)}
        onDropBlock={(payload) => onMoveBlock(payload, section.id, column.id, column.blocks.length)}
        onMoveHoverChange={(hovering) => setCandidateSnapTarget(column.blocks.length, hovering)}
      />
      {activeSnapIndex !== null && draggingBlock && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: getOverlayTop(),
            borderRadius: 3,
            boxShadow: `0 0 0 2px ${C.accent}`,
            background: `${C.accent}08`,
            pointerEvents: 'none',
            zIndex: 30,
          }}
        >
          <BlockPreview
            block={draggingBlock}
            fontFamily={fontFamily}
            isSelected={false}
            onClick={() => {}}
          />
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
  snapTarget,
  draggingBlock,
  draggingPayload,
  onBlockDragStart,
  onSelectBlock,
  onSelectSection,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddBlock,
  onMoveBlock,
  onSetSnapTarget,
  isDragging = false,
}: {
  section: EmailSection;
  index: number;
  total: number;
  selection: Selection;
  contentWidth: number;
  fontFamily: string;
  snapTarget: BlockSnapTarget | null;
  draggingBlock: EmailBlock | null;
  draggingPayload: BlockDragPayload | null;
  onBlockDragStart: (payload: BlockDragPayload, block: EmailBlock) => void;
  onSelectBlock: (sel: Selection) => void;
  onSelectSection: (sectionId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBlock: (sectionId: string, columnId: string, type: EmailBlockType, atIndex?: number) => void;
  onMoveBlock: (payload: BlockDragPayload, targetSectionId: string, targetColumnId: string, atIndex: number) => void;
  onSetSnapTarget: (target: BlockSnapTarget | null) => void;
  isDragging?: boolean;
}) {
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
    >
      {/* Section toolbar */}
      {(hovered || isSectionSelected) && (
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: 'none', borderRadius: 4, background: '#18181b', color: '#e4e4e7', cursor: 'grab' }}
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
            snapTarget={snapTarget}
            draggingBlock={draggingBlock}
            draggingPayload={draggingPayload}
            onBlockDragStart={onBlockDragStart}
            onSelectBlock={onSelectBlock}
            onAddBlock={onAddBlock}
            onMoveBlock={onMoveBlock}
            onSetSnapTarget={onSetSnapTarget}
            isDragging={isDragging}
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
        borderBottom: `1px solid ${C.sidebarBorder}`,
        background: active ? '#ffffff' : '#fafafa',
        color: active ? '#18181b' : '#52525b',
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
            background: '#ffffff',
            borderTop: `1px solid ${C.sidebarBorder}`,
            borderRight: `1px solid ${C.sidebarBorder}`,
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

function LayoutRowPreview({ columns }: { columns: number[] }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(ROW_DRAG_TYPE, JSON.stringify(columns));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'grab',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: columns.map((width) => `${width}fr`).join(' '), gap: 0, border: `1px solid #d4d4d8`, borderRadius: 3, overflow: 'hidden', minHeight: 64, background: '#ffffff' }}>
        {columns.map((_, index) => (
          <div
            key={index}
            style={{
              borderLeft: index === 0 ? 'none' : `1px solid #d4d4d8`,
              background: '#ffffff',
            }}
          />
        ))}
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
  selection,
  onUpdateBlock,
  onDeleteBlock,
  onUpdateSection,
  onDeleteSection,
  onClearSelection,
}: {
  activeTab: 'blocks' | 'sections' | 'settings';
  onTabChange: (t: 'blocks' | 'sections' | 'settings') => void;
  doc: EmailDocument;
  onAddBlock: (type: EmailBlockType) => void;
  onAddSection: (type: 'blank' | 'hero' | 'two-column' | 'cta') => void;
  onAddLayout: (widths: number[]) => void;
  onUpdateSettings: (patch: Partial<EmailDocument['settings']>) => void;
  selection: Selection;
  onUpdateBlock: (sId: string, cId: string, bId: string, patch: Partial<EmailBlock>) => void;
  onDeleteBlock: (sId: string, cId: string, bId: string) => void;
  onUpdateSection: (sId: string, patch: Partial<EmailSection>) => void;
  onDeleteSection: (sId: string) => void;
  onClearSelection: () => void;
}) {
  const shellStyle: React.CSSProperties = {
    width: 380,
    background: '#f5f5f4',
    borderRight: `1px solid ${C.sidebarBorder}`,
    display: 'flex',
    flexShrink: 0,
    overflow: 'hidden',
  };

  const railStyle: React.CSSProperties = {
    width: 74,
    background: '#fafaf9',
    borderRight: `1px solid ${C.sidebarBorder}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  };

  const contentPanelStyle: React.CSSProperties = {
    flex: 1,
    background: '#ffffff',
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
    borderBottom: `1px solid ${C.sidebarBorder}`,
    flexShrink: 0,
  };

  const panelBodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
  };

  const navItems: Array<{ id: 'blocks' | 'sections' | 'settings'; label: string; Icon: React.FC<LucideProps> }> = [
    { id: 'blocks', label: 'Content', Icon: Rows4 },
    { id: 'sections', label: 'Rows', Icon: MinusSquare },
    { id: 'settings', label: 'Body', Icon: Image },
  ];

  const renderShell = (title: string, body: React.ReactNode, showBack = false, backLabel = 'Back', hideRail = false) => (
    <div style={shellStyle}>
      {!hideRail && (
        <div style={railStyle}>
          {navItems.map((item) => (
            <RailItem
              key={item.id}
              label={item.label}
              Icon={item.Icon}
              active={activeTab === item.id}
              onClick={() => {
                onClearSelection();
                onTabChange(item.id);
              }}
            />
          ))}
        </div>
      )}
      <div style={contentPanelStyle}>
        <div style={panelHeaderStyle}>
          {showBack && (
            <button
              onClick={onClearSelection}
              title={backLabel}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: `1px solid ${C.sidebarBorder}`, borderRadius: 4, background: '#ffffff', color: '#18181b', cursor: 'pointer', flexShrink: 0 }}
            >
              <ChevronLeft size={12} />
            </button>
          )}
          <span style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, color: '#09090b' }}>{title}</span>
        </div>
        <div style={panelBodyStyle}>{body}</div>
      </div>
    </div>
  );

  // ── Block selected → show block inspector ──────────────────────────────────
  if (selection?.type === 'block') {
    const block = findBlock(doc, selection.sectionId, selection.columnId, selection.blockId);
    return renderShell(
      'Edit Block',
      block ? (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '-14px' }}>
          <BlockInspectorPanel
            block={block}
            onUpdate={(patch) => onUpdateBlock(selection.sectionId, selection.columnId, selection.blockId, patch)}
            onDelete={() => onDeleteBlock(selection.sectionId, selection.columnId, selection.blockId)}
          />
        </div>
      ) : null,
      true,
      'Back to panel',
      true,
    );
  }

  // ── Section selected → show section inspector ──────────────────────────────
  if (selection?.type === 'section') {
    const section = findSection(doc, selection.sectionId);
    return renderShell(
      'Edit Row',
      section ? (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '-14px' }}>
          <SectionInspectorPanel
            section={section}
            onUpdate={(patch) => onUpdateSection(selection.sectionId, patch)}
            onDelete={() => onDeleteSection(selection.sectionId)}
          />
        </div>
      ) : null,
      true,
    );
  }

  if (activeTab === 'sections') {
    return renderShell(
      'Rows',
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#3f3f46', marginBottom: 10 }}>Drag row layout</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BLOCK_LAYOUTS.map((layout) => (
            <LayoutRowPreview
              key={layout.id}
              columns={layout.columns}
            />
          ))}
        </div>
      </div>,
    );
  }

  if (activeTab === 'settings') {
    return renderShell(
      'Body',
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="Background Color">
          <ColorInput value={doc.settings.backgroundColor} onChange={(v) => onUpdateSettings({ backgroundColor: v })} />
        </Field>
        <Field label="Content Width (px)">
          <NumberInput value={doc.settings.contentWidth} min={320} max={1200} onChange={(v) => onUpdateSettings({ contentWidth: v })} />
        </Field>
        <Field label="Text Color">
          <ColorInput value={doc.settings.bodyTextColor} onChange={(v) => onUpdateSettings({ bodyTextColor: v })} />
        </Field>
      </div>,
    );
  }

  return renderShell(
    'Content',
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
      {ROW_PALETTE.map(({ label, Icon, desc, columns }) => (
        <button
          key={label}
          draggable
          data-drag-kind="row"
          onDragStart={(e) => { e.dataTransfer.setData(ROW_DRAG_TYPE, JSON.stringify(columns)); e.dataTransfer.effectAllowed = 'copy'; }}
          title={`${desc} — drag into canvas`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            minHeight: 82,
            border: `1px solid #d4d4d8`,
            borderRadius: 2,
            background: '#ffffff',
            color: '#3f3f46',
            cursor: 'grab',
            fontSize: 10,
            boxShadow: '0 1px 1px rgba(0,0,0,.04)',
            padding: '8px 6px',
          }}
        >
          <Icon size={20} strokeWidth={1.9} />
          <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
        </button>
      ))}
      {BLOCK_PALETTE.map(({ type, label, Icon, desc }) => (
        <button
          key={type}
          draggable
          data-drag-kind="block"
          onDragStart={(e) => { e.dataTransfer.setData(BLOCK_DRAG_TYPE, type); e.dataTransfer.effectAllowed = 'copy'; }}
          title={`${desc} — drag into a row column`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            minHeight: 82,
            border: `1px solid #d4d4d8`,
            borderRadius: 2,
            background: '#ffffff',
            color: '#3f3f46',
            cursor: 'grab',
            fontSize: 10,
            boxShadow: '0 1px 1px rgba(0,0,0,.04)',
            padding: '8px 6px',
          }}
        >
          <Icon size={20} strokeWidth={1.9} />
          <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
        </button>
      ))}
    </div>,
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  previewMode,
  onPreviewMode,
}: {
  previewMode: 'desktop' | 'mobile';
  onPreviewMode: (m: 'desktop' | 'mobile') => void;
}) {
  return (
    <div style={{ height: 44, background: '#fff', borderBottom: `1px solid ${C.inspectorBorder}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#18181b', marginRight: 'auto' }}>Block Builder</span>
      {(['desktop', 'mobile'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onPreviewMode(mode)}
          style={{
            padding: '5px 12px',
            border: `1px solid ${previewMode === mode ? C.accent : C.inspectorBorder}`,
            borderRadius: 6,
            background: previewMode === mode ? C.accent : 'transparent',
            color: previewMode === mode ? '#fff' : '#52525b',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {mode === 'desktop' ? <Laptop size={14} /> : <Smartphone size={14} />}
          {mode === 'desktop' ? 'Desktop' : 'Mobile'}
        </button>
      ))}
    </div>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function Canvas({
  doc,
  selection,
  previewMode,
  onSelectBlock,
  onSelectSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onAddBlock,
  onAddRowAt,
  onMoveSectionToIndex,
  onMoveBlock,
  onClearSelection,
}: {
  doc: EmailDocument;
  selection: Selection;
  previewMode: 'desktop' | 'mobile';
  onSelectBlock: (sel: Selection) => void;
  onSelectSection: (sId: string) => void;
  onMoveSection: (sId: string, dir: -1 | 1) => void;
  onDuplicateSection: (sId: string) => void;
  onDeleteSection: (sId: string) => void;
  onAddBlock: (sId: string, cId: string, type: EmailBlockType, atIndex?: number) => void;
  onAddRowAt: (index: number, widths: number[]) => void;
  onMoveSectionToIndex: (sectionId: string, toIndex: number) => void;
  onMoveBlock: (payload: BlockDragPayload, targetSectionId: string, targetColumnId: string, atIndex: number) => void;
  onClearSelection: () => void;
}) {
  const isMobilePreview = previewMode === 'mobile';
  const rowContentWidth = isMobilePreview ? 375 : doc.settings.contentWidth;
  const canvasWidth: React.CSSProperties['width'] = isMobilePreview ? 375 : '100%';

  const [isDragging, setIsDragging] = useState(false);
  const [dragKind, setDragKind] = useState<'block' | 'row' | 'section' | null>(null);
  const [snapTarget, setSnapTarget] = useState<BlockSnapTarget | null>(null);
  const [draggingPayload, setDraggingPayload] = useState<BlockDragPayload | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<EmailBlock | null>(null);
  const isBlockDragging = isDragging && dragKind === 'block';
  const isRowDragging = isDragging && (dragKind === 'row' || dragKind === 'section');

  useEffect(() => {
    const getDragKind = (e: DragEvent): 'block' | 'row' | 'section' | null => {
      const targetElement = e.target instanceof Element
        ? e.target
        : e.target instanceof Node
          ? e.target.parentElement
          : null;
      const target = targetElement?.closest('[data-drag-kind]') ?? null;
      const attrKind = target?.getAttribute('data-drag-kind');
      if (attrKind === 'block' || attrKind === 'row' || attrKind === 'section') {
        return attrKind;
      }

      if (e.dataTransfer?.types.includes(SECTION_DRAG_TYPE)) return 'section';
      if (e.dataTransfer?.types.includes(ROW_DRAG_TYPE)) return 'row';
      if (
        e.dataTransfer?.types.includes(BLOCK_DRAG_TYPE) ||
        e.dataTransfer?.types.includes(BLOCK_INSTANCE_DRAG_TYPE)
      ) {
        return 'block';
      }

      return null;
    };

    const onStart = (e: DragEvent) => {
      const kind = getDragKind(e);
      setDragKind(kind ?? 'block');
      setIsDragging(true);
    };
    const onEnd = () => {
      setIsDragging(false);
      setDragKind(null);
      setSnapTarget(null);
      setDraggingPayload(null);
      setDraggingBlock(null);
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

  return (
    <div
      style={{ flex: 1, overflowY: 'auto', background: C.canvasBg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}
      onClick={onClearSelection}
    >
      <div
        style={{
          width: canvasWidth,
          maxWidth: isMobilePreview ? 375 : '100%',
          minHeight: '100%',
          background: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,.12)',
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'all .25s ease',
        }}
      >
        {doc.sections.length === 0 && (
          <RowDropZone empty onDropRow={(widths) => onAddRowAt(0, widths)} onDropSection={() => {}} />
        )}
        {doc.sections.length > 0 && (
          <RowDropZone
            position="edge"
            isDragging={isRowDragging}
            onDropRow={(widths) => onAddRowAt(0, widths)}
            onDropSection={(sectionId) => onMoveSectionToIndex(sectionId, 0)}
          />
        )}
        {doc.sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <SectionCard
              section={section}
              index={index}
              total={doc.sections.length}
              selection={selection}
              contentWidth={rowContentWidth}
              fontFamily={doc.settings.fontFamily}
              snapTarget={snapTarget}
              draggingBlock={draggingBlock}
              draggingPayload={draggingPayload}
              onBlockDragStart={(payload, block) => {
                setDraggingPayload(payload);
                setDraggingBlock(block);
              }}
              onSelectBlock={onSelectBlock}
              onSelectSection={onSelectSection}
              onMoveUp={() => onMoveSection(section.id, -1)}
              onMoveDown={() => onMoveSection(section.id, 1)}
              onDuplicate={() => onDuplicateSection(section.id)}
              onDelete={() => onDeleteSection(section.id)}
              onAddBlock={onAddBlock}
              onMoveBlock={onMoveBlock}
              onSetSnapTarget={(target) => {
                if (!isBlockDragging) return;
                setSnapTarget(target);
              }}
              isDragging={isBlockDragging}
            />
            {index < doc.sections.length - 1 && (
              <RowDropZone
                position="between"
                isDragging={isRowDragging}
                onDropRow={(widths) => onAddRowAt(index + 1, widths)}
                onDropSection={(sectionId) => onMoveSectionToIndex(sectionId, index + 1)}
              />
            )}
          </React.Fragment>
        ))}
        {doc.sections.length > 0 && (
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

// ─── Main editor component ────────────────────────────────────────────────────

export function EmailBlockEditor({ value, onChange, height = '100%' }: EmailBlockEditorProps) {
  const [doc, setDoc] = useState<EmailDocument>(() =>
    value ? normalizeDocument(value) : createEmptyDocument(),
  );
  const [selection, setSelection] = useState<Selection>(null);
  const [activeTab, setActiveTab] = useState<'blocks' | 'sections' | 'settings'>('blocks');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

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
        const block = createBlock(type);
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

      const block = createBlock(type);
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
      const block = createBlock(type);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, width: '100%', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: 13 }}>
      <Toolbar previewMode={previewMode} onPreviewMode={setPreviewMode} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          doc={doc}
          onAddBlock={addBlockToSection}
          onAddSection={addSection}
          onAddLayout={addSectionLayout}
          onUpdateSettings={updateSettings}
          selection={selection}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onUpdateSection={updateSection}
          onDeleteSection={deleteSection}
          onClearSelection={() => setSelection(null)}
        />
        <Canvas
          doc={doc}
          selection={selection}
          previewMode={previewMode}
          onSelectBlock={setSelection}
          onSelectSection={(sId) => setSelection({ type: 'section', sectionId: sId })}
          onMoveSection={moveSection}
          onDuplicateSection={duplicateSection}
          onDeleteSection={deleteSection}
          onAddBlock={addBlockToColumn}
          onAddRowAt={addRowAt}
          onMoveSectionToIndex={moveSectionToIndex}
          onMoveBlock={moveBlock}
          onClearSelection={() => setSelection(null)}
        />
      </div>
    </div>
  );
}
