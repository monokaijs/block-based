// Types
export type {
  EmailBlockType,
  EmailBlock,
  HeadingBlock,
  ParagraphBlock,
  ButtonBlock,
  ImageBlock,
  DividerBlock,
  SpacerBlock,
  MenuBlock,
  MenuItem,
  HtmlBlock,
  EmailColumn,
  EmailSection,
  EmailDocumentSettings,
  EmailDocument,
  ColorPalette,
  CustomColor,
  SampleBlock,
  TemplateDefinition,
  CustomTab,
  CustomTabContext,
  EditorFeatures,
  EditorThemeMode,
} from './types';

export {
  COLOR_PALETTE_KEYS,
  COLOR_PALETTE_LABELS,
  DEFAULT_COLOR_PALETTE,
} from './types';

// Section input types (for consumers building section templates programmatically)
export type { EmailSectionInput, EmailColumnInput } from './section';

// Utility helpers
export { nextId, escapeHtml, blockPadding } from './utils';
export type { BaseBlockFields } from './utils';

// Block-level: normalize, render, create
export {
  normalizeBlock,
  renderBlock,
  createBlock,
  normalizeHeading,
  renderHeading,
  normalizeParagraph,
  renderParagraph,
  normalizeButton,
  renderButton,
  normalizeImage,
  renderImage,
  normalizeDivider,
  renderDivider,
  normalizeSpacer,
  renderSpacer,
  normalizeMenu,
  renderMenu,
  normalizeHtml,
  renderHtml,
} from './blocks';

// Section-level
export {
  normalizeColumn,
  normalizeSection,
  createSectionTemplate,
  appendGeneratedSections,
} from './section';

// Document-level
export {
  createEmptyDocument,
  createLegacyHtmlDocument,
  isEmailDocument,
  normalizeDocument,
} from './document';

// HTML rendering
export { renderEmailDocument } from './render';

// React editor component
export { EmailBlockEditor } from './editor';
export type { EmailBlockEditorProps } from './editor';
