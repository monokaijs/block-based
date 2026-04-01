import type { HeadingBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, escapeHtml, type BaseBlockFields } from '../utils';

export function normalizeHeading(block: Partial<HeadingBlock>, base: BaseBlockFields): HeadingBlock {
  return {
    ...base,
    type: 'heading',
    content: block.content || 'New heading',
    align: block.align || 'left',
    color: block.color || '#111827',
    fontSize: block.fontSize ?? 32,
    fontWeight: block.fontWeight ?? 700,
  };
}

export function renderHeading(block: HeadingBlock, fontFamily: string): string {
  return `<h2 style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};font-family:${fontFamily};font-size:${block.fontSize}px;line-height:1.2;font-weight:${block.fontWeight};text-align:${block.align};color:${block.color};">${escapeHtml(block.content)}</h2>`;
}
