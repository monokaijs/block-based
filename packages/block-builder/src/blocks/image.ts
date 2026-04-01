import type { ImageBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, escapeHtml, type BaseBlockFields } from '../utils';

export function normalizeImage(block: Partial<ImageBlock>, base: BaseBlockFields): ImageBlock {
  return {
    ...base,
    type: 'image',
    src: block.src || '',
    alt: block.alt || '',
    width: block.width ?? 320,
    align: block.align || 'center',
  };
}

export function renderImage(block: ImageBlock, fontFamily: string): string {
  if (block.src) {
    return `<div style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};text-align:${block.align};"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || '')}" width="${block.width}" style="display:inline-block;max-width:100%;height:auto;border:0;" /></div>`;
  }
  return `<div style="margin:${blockMargin(block)};padding:24px;${blockBorder(block)}opacity:${alpha(block.opacity)};font-family:${fontFamily};font-size:13px;color:#9ca3af;border:1px dashed #d1d5db;text-align:center;">Add an image URL</div>`;
}
