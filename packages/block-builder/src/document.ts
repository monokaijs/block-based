import type { EmailDocument } from './types';
import { nextId } from './utils';
import { createSectionTemplate, normalizeSection } from './section';

export function createEmptyDocument(): EmailDocument {
  return {
    version: 1,
    settings: {
      backgroundColor: '#f5f5f4',
      contentBackgroundColor: '#ffffff',
      contentWidth: 640,
      contentAlign: 'center',
      contentPaddingTop: 32,
      contentPaddingRight: 16,
      contentPaddingBottom: 32,
      contentPaddingLeft: 16,
      bodyTextColor: '#1f2937',
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 400,
      fontSize: 16,
      preheaderText: '',
      linkColor: '#2563eb',
      linkUnderline: true,
      primaryColor: '#2563eb',
      secondaryColor: '#7c3aed',
      accentColor: '#f59e0b',
    },
    sections: [createSectionTemplate('hero')],
  };
}

export function createLegacyHtmlDocument(htmlContent?: string | null): EmailDocument {
  const document = createEmptyDocument();

  if (!htmlContent?.trim()) {
    return document;
  }

  return {
    ...document,
    sections: [
      normalizeSection({
        backgroundColor: '#ffffff',
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
        opacity: 100,
        borderRadius: 0,
        columns: [
          {
            width: 100,
            blocks: [
              {
                id: nextId('block'),
                type: 'html',
                content: htmlContent,
                paddingBottom: 0,
              },
            ],
          },
        ],
      }),
    ],
  };
}

export function isEmailDocument(value: unknown): value is EmailDocument {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { version?: unknown }).version === 1
  );
}

export function normalizeDocument(
  input: Partial<EmailDocument> | undefined | null,
): EmailDocument {
  const fallback = createEmptyDocument();
  const settings = input?.settings ?? fallback.settings;
  const sections =
    Array.isArray(input?.sections) && input.sections.length > 0
      ? input.sections.map(normalizeSection)
      : fallback.sections;

  return {
    version: 1,
    settings: {
      backgroundColor: settings.backgroundColor || fallback.settings.backgroundColor,
      contentBackgroundColor: settings.contentBackgroundColor || fallback.settings.contentBackgroundColor,
      contentWidth: Number(settings.contentWidth) || fallback.settings.contentWidth,
      contentAlign:
        settings.contentAlign === 'left' ||
        settings.contentAlign === 'center' ||
        settings.contentAlign === 'right'
          ? settings.contentAlign
          : fallback.settings.contentAlign,
      contentPaddingTop:
        Number.isFinite(Number(settings.contentPaddingTop))
          ? Number(settings.contentPaddingTop)
          : fallback.settings.contentPaddingTop,
      contentPaddingRight:
        Number.isFinite(Number(settings.contentPaddingRight))
          ? Number(settings.contentPaddingRight)
          : fallback.settings.contentPaddingRight,
      contentPaddingBottom:
        Number.isFinite(Number(settings.contentPaddingBottom))
          ? Number(settings.contentPaddingBottom)
          : fallback.settings.contentPaddingBottom,
      contentPaddingLeft:
        Number.isFinite(Number(settings.contentPaddingLeft))
          ? Number(settings.contentPaddingLeft)
          : fallback.settings.contentPaddingLeft,
      bodyTextColor: settings.bodyTextColor || fallback.settings.bodyTextColor,
      fontFamily: settings.fontFamily || fallback.settings.fontFamily,
      fontWeight:
        Number.isFinite(Number(settings.fontWeight))
          ? Number(settings.fontWeight)
          : fallback.settings.fontWeight,
      preheaderText: settings.preheaderText ?? fallback.settings.preheaderText,
      linkColor: settings.linkColor || fallback.settings.linkColor,
      linkUnderline:
        typeof settings.linkUnderline === 'boolean'
          ? settings.linkUnderline
          : fallback.settings.linkUnderline,
      fontSize:
        Number.isFinite(Number(settings.fontSize))
          ? Number(settings.fontSize)
          : fallback.settings.fontSize,
      primaryColor: settings.primaryColor || fallback.settings.primaryColor,
      secondaryColor: settings.secondaryColor || fallback.settings.secondaryColor,
      accentColor: settings.accentColor || fallback.settings.accentColor,
    },
    sections,
  };
}
