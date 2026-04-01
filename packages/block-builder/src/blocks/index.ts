import type { EmailBlock, ParagraphBlock } from '../types';
import { nextId } from '../utils';
import { normalizeHeading, renderHeading } from './heading';
import { normalizeParagraph, renderParagraph } from './paragraph';
import { normalizeButton, renderButton } from './button';
import { normalizeImage, renderImage } from './image';
import { normalizeDivider, renderDivider } from './divider';
import { normalizeSpacer, renderSpacer } from './spacer';
import { normalizeMenu, renderMenu } from './menu';
import { normalizeHtml, renderHtml } from './html';

export * from './heading';
export * from './paragraph';
export * from './button';
export * from './image';
export * from './divider';
export * from './spacer';
export * from './menu';
export * from './html';

export function normalizeBlock(block: Partial<EmailBlock>): EmailBlock {
  const base = {
    id: block.id || nextId('block'),
    paddingTop: block.paddingTop ?? 10,
    paddingRight: block.paddingRight ?? 10,
    paddingBottom: block.paddingBottom ?? 10,
    paddingLeft: block.paddingLeft ?? 10,
    marginTop: block.marginTop ?? 0,
    marginRight: block.marginRight ?? 0,
    marginBottom: block.marginBottom ?? 0,
    marginLeft: block.marginLeft ?? 0,
    borderTopWidth: block.borderTopWidth ?? 0,
    borderRightWidth: block.borderRightWidth ?? 0,
    borderBottomWidth: block.borderBottomWidth ?? 0,
    borderLeftWidth: block.borderLeftWidth ?? 0,
    borderColor: block.borderColor ?? '#d1d5db',
    borderStyle: block.borderStyle ?? 'solid',
    opacity: block.opacity ?? 100,
  };

  switch (block.type) {
    case 'heading':   return normalizeHeading(block, base);
    case 'button':    return normalizeButton(block, base);
    case 'image':     return normalizeImage(block, base);
    case 'divider':   return normalizeDivider(block, base);
    case 'spacer':    return normalizeSpacer(block, base);
    case 'menu':      return normalizeMenu(block, base);
    case 'html':      return normalizeHtml(block, base);
    case 'paragraph':
    default:          return normalizeParagraph(block as Partial<ParagraphBlock>, base);
  }
}

export function renderBlock(block: EmailBlock, fontFamily: string): string {
  switch (block.type) {
    case 'heading':   return renderHeading(block, fontFamily);
    case 'paragraph': return renderParagraph(block, fontFamily);
    case 'button':    return renderButton(block, fontFamily);
    case 'image':     return renderImage(block, fontFamily);
    case 'divider':   return renderDivider(block);
    case 'spacer':    return renderSpacer(block);
    case 'menu':      return renderMenu(block, fontFamily);
    case 'html':      return renderHtml(block);
    default:          return '';
  }
}

export function createBlock(type: EmailBlock['type']): EmailBlock {
  return normalizeBlock({ type } as Partial<EmailBlock>);
}
