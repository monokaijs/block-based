import type { EmailColumn, EmailDocument, EmailSection } from './types';
import { renderBlock } from './blocks';
import { normalizeDocument } from './document';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderColumn(column: EmailColumn, fontFamily: string): string {
  const width = `${column.width}%`;
  return `<td valign="top" width="${width}" style="width:${width};padding:0 16px;">${column.blocks.map((block) => renderBlock(block, fontFamily)).join('')}</td>`;
}

function renderSection(section: EmailSection, document: EmailDocument): string {
  const sectionPadding = `${section.paddingTop ?? 0}px ${section.paddingRight ?? 0}px ${section.paddingBottom ?? 0}px ${section.paddingLeft ?? 0}px`;
  const sectionMargin = `${section.marginTop ?? 0}px ${section.marginRight ?? 0}px ${section.marginBottom ?? 0}px ${section.marginLeft ?? 0}px`;
  const sectionBorderWidth = `${section.borderTopWidth ?? 0}px ${section.borderRightWidth ?? 0}px ${section.borderBottomWidth ?? 0}px ${section.borderLeftWidth ?? 0}px`;
  const sectionBorderColor = section.borderColor ?? '#d1d5db';
  const sectionBorderStyle = section.borderStyle ?? 'solid';
  const sectionOpacity = Math.max(0, Math.min(100, section.opacity ?? 100)) / 100;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${section.backgroundColor};">
      <tr>
        <td style="padding:${sectionPadding};">
          <div style="margin:${sectionMargin};opacity:${sectionOpacity};border-style:${sectionBorderStyle};border-color:${sectionBorderColor};border-width:${sectionBorderWidth};border-radius:${section.borderRadius ?? 0}px;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${section.columns.map((column) => renderColumn(column, document.settings.fontFamily)).join('')}
            </tr>
          </table>
          </div>
        </td>
      </tr>
    </table>
  `;
}

export function renderEmailDocument(document: EmailDocument): string {
  const normalized = normalizeDocument(document);
  const contentPadding = `${normalized.settings.contentPaddingTop}px ${normalized.settings.contentPaddingRight}px ${normalized.settings.contentPaddingBottom}px ${normalized.settings.contentPaddingLeft}px`;
  const preheader = normalized.settings.preheaderText.trim();
  const linkDecoration = normalized.settings.linkUnderline ? 'underline' : 'none';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <style>
      a { color: ${normalized.settings.linkColor}; text-decoration: ${linkDecoration}; }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${normalized.settings.backgroundColor};font-family:${normalized.settings.fontFamily};color:${normalized.settings.bodyTextColor};font-weight:${normalized.settings.fontWeight};">
    ${preheader ? `<div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;">${escapeHtml(preheader)}</div>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${normalized.settings.backgroundColor};">
      <tr>
        <td align="${normalized.settings.contentAlign}" style="padding:${contentPadding};">
          <table role="presentation" width="${normalized.settings.contentWidth}" cellpadding="0" cellspacing="0" style="width:${normalized.settings.contentWidth}px;max-width:100%;background:${normalized.settings.contentBackgroundColor};">
            ${normalized.sections.map((section) => renderSection(section, normalized)).join('')}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

