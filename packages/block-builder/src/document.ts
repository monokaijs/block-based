import type { ColorPalette, EmailDocument } from './types';
import { DEFAULT_COLOR_PALETTE } from './types';
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
      colorPalette: { ...DEFAULT_COLOR_PALETTE },
      customColors: [],
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

function normalizePalette(input: Partial<ColorPalette> | undefined | null): ColorPalette {
  const d = DEFAULT_COLOR_PALETTE;
  if (!input) return { ...d };
  return {
    background: input.background || d.background,
    foreground: input.foreground || d.foreground,
    card: input.card || d.card,
    cardForeground: input.cardForeground || d.cardForeground,
    primary: input.primary || d.primary,
    primaryForeground: input.primaryForeground || d.primaryForeground,
    secondary: input.secondary || d.secondary,
    secondaryForeground: input.secondaryForeground || d.secondaryForeground,
    accent: input.accent || d.accent,
    accentForeground: input.accentForeground || d.accentForeground,
    muted: input.muted || d.muted,
    mutedForeground: input.mutedForeground || d.mutedForeground,
    destructive: input.destructive || d.destructive,
    destructiveForeground: input.destructiveForeground || d.destructiveForeground,
    border: input.border || d.border,
    input: input.input || d.input,
    ring: input.ring || d.ring,
  };
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

  // Backwards compatibility: migrate old primaryColor/secondaryColor/accentColor
  const legacySettings = settings as Record<string, unknown>;
  const basePalette = settings.colorPalette ?? {};
  if (legacySettings.primaryColor && !basePalette.primary) {
    (basePalette as Record<string, unknown>).primary = legacySettings.primaryColor;
  }
  if (legacySettings.secondaryColor && !basePalette.secondary) {
    (basePalette as Record<string, unknown>).secondary = legacySettings.secondaryColor;
  }
  if (legacySettings.accentColor && !basePalette.accent) {
    (basePalette as Record<string, unknown>).accent = legacySettings.accentColor;
  }

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
      colorPalette: normalizePalette(basePalette as Partial<ColorPalette>),
      customColors: Array.isArray(settings.customColors) ? settings.customColors : [],
    },
    sections,
  };
}
