import type { EmailBlock } from './types';

export type BaseBlockFields = {
  id: string;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  borderTopWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
};

export function nextId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function blockPadding(
  block: Pick<EmailBlock, 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'>,
): string {
  return `${block.paddingTop ?? 0}px ${block.paddingRight ?? 0}px ${block.paddingBottom ?? 0}px ${block.paddingLeft ?? 0}px`;
}

export function blockMargin(
  block: Pick<EmailBlock, 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft'>,
): string {
  return `${block.marginTop ?? 0}px ${block.marginRight ?? 0}px ${block.marginBottom ?? 0}px ${block.marginLeft ?? 0}px`;
}

export function alpha(opacity?: number): number {
  return Math.max(0, Math.min(100, opacity ?? 100)) / 100;
}

type BorderValue = Pick<EmailBlock,
  | 'borderTopWidth'
  | 'borderRightWidth'
  | 'borderBottomWidth'
  | 'borderLeftWidth'
  | 'borderColor'
  | 'borderStyle'
>;

export function blockBorder(block: BorderValue): string {
  const top = block.borderTopWidth ?? 0;
  const right = block.borderRightWidth ?? 0;
  const bottom = block.borderBottomWidth ?? 0;
  const left = block.borderLeftWidth ?? 0;
  const color = block.borderColor ?? '#d1d5db';
  const style = block.borderStyle ?? 'solid';
  return `border-style:${style};border-color:${color};border-width:${top}px ${right}px ${bottom}px ${left}px;`;
}
