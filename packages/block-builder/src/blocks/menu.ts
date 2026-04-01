import type { MenuBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, escapeHtml, type BaseBlockFields } from '../utils';

export function normalizeMenu(block: Partial<MenuBlock>, base: BaseBlockFields): MenuBlock {
  const items =
    Array.isArray(block.items) && block.items.length > 0
      ? block.items
          .map((item) => ({
            label: item?.label?.trim() || '',
            url: item?.url?.trim() || '',
          }))
          .filter((item) => item.label)
      : [
          { label: 'Home', url: 'https://example.com' },
          { label: 'Features', url: 'https://example.com/features' },
          { label: 'Pricing', url: 'https://example.com/pricing' },
        ];

  return {
    ...base,
    type: 'menu',
    items,
    align: block.align || 'left',
    color: block.color || '#374151',
    fontSize: block.fontSize ?? 14,
    itemSpacing: block.itemSpacing ?? 14,
  };
}

export function renderMenu(block: MenuBlock, fontFamily: string): string {
  const links = block.items
    .map((item) => `<a href="${escapeHtml(item.url)}" style="color:${block.color};text-decoration:none;display:inline-block;">${escapeHtml(item.label)}</a>`)
    .join(`<span style="display:inline-block;width:${block.itemSpacing}px;"></span>`);

  return `<div style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};text-align:${block.align};font-family:${fontFamily};font-size:${block.fontSize}px;line-height:1.4;">${links}</div>`;
}
