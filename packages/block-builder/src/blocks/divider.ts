import type { DividerBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, type BaseBlockFields } from '../utils';

export function normalizeDivider(block: Partial<DividerBlock>, base: BaseBlockFields): DividerBlock {
  return {
    ...base,
    type: 'divider',
    color: block.color || '#e5e7eb',
    thickness: block.thickness ?? 1,
  };
}

export function renderDivider(block: DividerBlock): string {
  return `<div style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};"><hr style="border:none;border-top:${block.thickness}px solid ${block.color};margin:0;" /></div>`;
}
