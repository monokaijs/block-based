import type { EmailBlock, EmailColumn, EmailDocument, EmailSection } from './types';
import { nextId } from './utils';
import { normalizeBlock } from './blocks';

/** Flexible input types that allow partial blocks/columns when building section templates. */
type BlockInput = Partial<EmailBlock>;
export type EmailColumnInput = { id?: string; width?: number; blocks?: BlockInput[] };
export type EmailSectionInput = {
  id?: string;
  backgroundColor?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  borderRadius?: number;
  columns?: EmailColumnInput[];
};

export function normalizeColumn(column: EmailColumnInput): EmailColumn {
  const blocks = Array.isArray(column.blocks) ? column.blocks.map(normalizeBlock) : [];
  return {
    id: column.id || nextId('column'),
    width: Number(column.width) || 100,
    blocks,
  };
}

export function normalizeSection(section: EmailSectionInput): EmailSection {
  const columns =
    Array.isArray(section.columns) && section.columns.length > 0
      ? section.columns.map(normalizeColumn)
      : [normalizeColumn({ width: 100, blocks: [] })];

  return {
    id: section.id || nextId('section'),
    backgroundColor: section.backgroundColor || '#ffffff',
    paddingTop: section.paddingTop ?? 0,
    paddingRight: section.paddingRight ?? 0,
    paddingBottom: section.paddingBottom ?? 0,
    paddingLeft: section.paddingLeft ?? 0,
    marginTop: section.marginTop ?? 0,
    marginRight: section.marginRight ?? 0,
    marginBottom: section.marginBottom ?? 0,
    marginLeft: section.marginLeft ?? 0,
    borderTopWidth: section.borderTopWidth ?? 0,
    borderRightWidth: section.borderRightWidth ?? 0,
    borderBottomWidth: section.borderBottomWidth ?? 0,
    borderLeftWidth: section.borderLeftWidth ?? 0,
    borderColor: section.borderColor ?? '#d1d5db',
    borderStyle: section.borderStyle ?? 'solid',
    opacity: section.opacity ?? 100,
    borderRadius: section.borderRadius ?? 0,
    columns,
  };
}

export function createSectionTemplate(type: 'blank' | 'hero' | 'two-column' | 'cta'): EmailSection {
  switch (type) {
    case 'blank':
      return normalizeSection({
        backgroundColor: '#ffffff',
        columns: [{ width: 100, blocks: [] }],
      });
    case 'two-column':
      return normalizeSection({
        backgroundColor: '#ffffff',
        columns: [
          {
            width: 50,
            blocks: [
              { type: 'heading', content: 'Feature one', fontSize: 24 },
              { type: 'paragraph', content: 'Short copy for the first column.' },
            ],
          },
          {
            width: 50,
            blocks: [
              { type: 'heading', content: 'Feature two', fontSize: 24 },
              { type: 'paragraph', content: 'Short copy for the second column.' },
            ],
          },
        ],
      });
    case 'cta':
      return normalizeSection({
        backgroundColor: '#fff7ed',
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'heading', content: 'Ready to take the next step?', align: 'center', fontSize: 28 },
              { type: 'paragraph', content: 'Make the call to action obvious and keep supporting text tight.', align: 'center' },
              { type: 'button', label: 'Call to Action', url: 'https://example.com', align: 'center' },
            ],
          },
        ],
      });
    case 'hero':
    default:
      return normalizeSection({
        backgroundColor: '#ffffff',
        columns: [
          {
            width: 100,
            blocks: [
              { type: 'heading', content: 'Launch a stronger first impression', fontSize: 36 },
              { type: 'paragraph', content: 'Use the left panel to add content blocks, then refine spacing and styling from the inspector.' },
              { type: 'button', label: 'Primary action', url: 'https://example.com' },
            ],
          },
        ],
      });
  }
}

export function appendGeneratedSections(
  document: EmailDocument,
  sections: Array<EmailSectionInput>,
): EmailDocument {
  return {
    ...document,
    sections: [...document.sections, ...sections.map(normalizeSection)],
  };
}
