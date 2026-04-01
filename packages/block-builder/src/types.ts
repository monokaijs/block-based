export type EmailBlockType =
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'menu'
  | 'html';

export type MenuItem = {
  label: string;
  url: string;
};

type BaseBlock<T extends EmailBlockType> = {
  id: string;
  type: T;
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
};

export type HeadingBlock = BaseBlock<'heading'> & {
  content: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: number;
  fontWeight?: number;
};

export type ParagraphBlock = BaseBlock<'paragraph'> & {
  content: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: number;
};

export type ButtonBlock = BaseBlock<'button'> & {
  label: string;
  url: string;
  align?: 'left' | 'center' | 'right';
  widthMode?: 'auto' | 'fixed' | 'percent';
  widthPx?: number;
  widthPercent?: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
};

export type ImageBlock = BaseBlock<'image'> & {
  src: string;
  alt?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
};

export type DividerBlock = BaseBlock<'divider'> & {
  color?: string;
  thickness?: number;
};

export type SpacerBlock = BaseBlock<'spacer'> & {
  height?: number;
  label?: string;
};

export type MenuBlock = BaseBlock<'menu'> & {
  items: MenuItem[];
  align?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: number;
  itemSpacing?: number;
};

export type HtmlBlock = BaseBlock<'html'> & {
  content: string;
};

export type EmailBlock =
  | HeadingBlock
  | ParagraphBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | MenuBlock
  | HtmlBlock;

export type EmailColumn = {
  id: string;
  width: number;
  blocks: EmailBlock[];
};

export type EmailSection = {
  id: string;
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
  columns: EmailColumn[];
};

export type EmailDocumentSettings = {
  backgroundColor: string;
  contentBackgroundColor: string;
  contentWidth: number;
  contentAlign: 'left' | 'center' | 'right';
  contentPaddingTop: number;
  contentPaddingRight: number;
  contentPaddingBottom: number;
  contentPaddingLeft: number;
  bodyTextColor: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  preheaderText: string;
  linkColor: string;
  linkUnderline: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export type EmailDocument = {
  version: 1;
  settings: EmailDocumentSettings;
  sections: EmailSection[];
};