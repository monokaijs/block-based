import type { ParagraphBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, escapeHtml, type BaseBlockFields } from '../utils';

export function normalizeParagraph(block: Partial<ParagraphBlock>, base: BaseBlockFields): ParagraphBlock {
  return {
    ...base,
    type: 'paragraph',
    content: block.content || 'Write supporting copy here.',
    align: block.align || 'left',
    color: block.color || '#4b5563',
    fontSize: block.fontSize ?? 16,
  };
}

export function renderParagraph(block: ParagraphBlock, fontFamily: string): string {
  return `<p style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};font-family:${fontFamily};font-size:${block.fontSize}px;line-height:1.7;text-align:${block.align};color:${block.color};">${escapeHtml(block.content).replace(/\n/g, '<br />')}</p>`;
}
