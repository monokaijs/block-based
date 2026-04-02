"use client";

import { useState, useCallback } from "react";
import { EmailBlockEditor, createEmptyDocument } from "block-based";
import type { EmailDocument } from "block-based";

export default function ExamplePage() {
  const [doc, setDoc] = useState<EmailDocument>(createEmptyDocument);

  const handleChange = useCallback((next: EmailDocument) => {
    setDoc(next);
  }, []);

  return (
    <div className="h-full">
      <EmailBlockEditor value={doc} onChange={handleChange} height="100%" />
    </div>
  );
}
