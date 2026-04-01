import type { ButtonBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, escapeHtml, type BaseBlockFields } from '../utils';

export function normalizeButton(block: Partial<ButtonBlock>, base: BaseBlockFields): ButtonBlock {
  return {
    ...base,
    type: 'button',
    label: block.label || 'Button',
    url: block.url || 'https://example.com',
    align: block.align || 'center',
    widthMode: block.widthMode || 'auto',
    widthPx: block.widthPx ?? 220,
    widthPercent: block.widthPercent ?? 50,
    backgroundColor: block.backgroundColor || '#881c1c',
    textColor: block.textColor || '#ffffff',
    borderRadius: block.borderRadius ?? 8,
  };
}

export function renderButton(block: ButtonBlock, fontFamily: string): string {
  const widthStyle =
    block.widthMode === 'fixed'
      ? `width:${Math.max(40, block.widthPx ?? 220)}px;`
      : block.widthMode === 'percent'
        ? `width:${Math.max(5, Math.min(100, block.widthPercent ?? 50))}%;`
        : '';

  return `<div style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};text-align:${block.align};"><a href="${escapeHtml(block.url)}" style="display:inline-block;box-sizing:border-box;${widthStyle}padding:12px 20px;border-radius:${block.borderRadius}px;background:${block.backgroundColor};color:${block.textColor};text-decoration:none;font-family:${fontFamily};font-size:14px;font-weight:600;">${escapeHtml(block.label)}</a></div>`;
}
