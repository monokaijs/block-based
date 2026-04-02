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
      <button
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        style={{
          position: "absolute",
          top: 10,
          right: 16,
          zIndex: 9999,
          padding: "5px 12px",
          borderRadius: 6,
          border: "1px solid #d4d4d8",
          background: theme === "dark" ? "#18181b" : "#fff",
          color: theme === "dark" ? "#fafafa" : "#18181b",
          fontSize: 12,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {theme === "dark" ? "☀ Light" : "☾ Dark"}
      </button>
      <EmailBlockEditor value={doc} onChange={handleChange} height="100%" theme={theme} />
    </div>
  );
}
