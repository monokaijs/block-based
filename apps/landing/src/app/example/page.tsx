"use client";

import { useState, useCallback } from "react";
import { EmailBlockEditor, createEmptyDocument } from "block-based";
import type { EmailDocument, EditorThemeMode } from "block-based";

export default function ExamplePage() {
  const [doc, setDoc] = useState<EmailDocument>(createEmptyDocument);
  const [theme, setTheme] = useState<EditorThemeMode>("light");

  const handleChange = useCallback((next: EmailDocument) => {
    setDoc(next);
  }, []);

  return (
    <div className="h-full relative">
      <EmailBlockEditor value={doc} onChange={handleChange} height="100%" theme={theme} onThemeChange={setTheme} />
    </div>
  );
}
