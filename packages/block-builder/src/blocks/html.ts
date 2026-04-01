import type { HtmlBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, type BaseBlockFields } from '../utils';

export function normalizeHtml(block: Partial<HtmlBlock>, base: BaseBlockFields): HtmlBlock {
  return {
    ...base,
    type: 'html',
    content: block.content || '<p>Custom HTML block</p>',
  };
}

export function renderHtml(block: HtmlBlock): string {
  return `<div style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};">${block.content}</div>`;
}
