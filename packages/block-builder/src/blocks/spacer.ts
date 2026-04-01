import type { SpacerBlock } from '../types';
import { alpha, blockBorder, blockMargin, blockPadding, type BaseBlockFields } from '../utils';

export function normalizeSpacer(block: Partial<SpacerBlock>, base: BaseBlockFields): SpacerBlock {
  return {
    ...base,
    type: 'spacer',
    height: block.height ?? 32,
    label: block.label ?? 'Spacer',
  };
}

export function renderSpacer(block: SpacerBlock): string {
  return `<div style="margin:${blockMargin(block)};padding:${blockPadding(block)};${blockBorder(block)}opacity:${alpha(block.opacity)};"><div style="height:${block.height}px;line-height:${block.height}px;font-size:1px;">&nbsp;</div></div>`;
}
