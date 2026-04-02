import React, { useState, useCallback } from 'react';
import { Check, Clipboard } from 'lucide-react';
import { EmailBlockEditor, renderEmailDocument, createEmptyDocument } from '@block-based/block-builder';
import type { EmailDocument } from '@block-based/block-builder';

type Tab = 'editor' | 'json' | 'html';

export default function App() {
  const [doc, setDoc] = useState<EmailDocument>(createEmptyDocument);
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [copied, setCopied] = useState(false);

  const handleChange = useCallback((next: EmailDocument) => {
    setDoc(next);
  }, []);

  const html = renderEmailDocument(doc);
  const json = JSON.stringify(doc, null, 2);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '6px 16px',
    border: 'none',
    borderBottom: activeTab === t ? '2px solid #2563eb' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === t ? '#2563eb' : '#71717a',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: activeTab === t ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', height: 40, background: '#18181b', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }} />
        <button style={tabStyle('editor')} onClick={() => setActiveTab('editor')}>Editor</button>
        <button style={tabStyle('json')} onClick={() => setActiveTab('json')}>JSON</button>
        <button style={tabStyle('html')} onClick={() => setActiveTab('html')}>HTML Output</button>
      </div>

      {/* Editor pane */}
      <div style={{ flex: 1, overflow: 'hidden', display: activeTab === 'editor' ? 'flex' : 'none', flexDirection: 'column' }}>
        <EmailBlockEditor value={doc} onChange={handleChange} height="100%" />
      </div>

      {/* JSON pane */}
      {activeTab === 'json' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#1e1e2e' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #27272a' }}>
            <span style={{ color: '#a1a1aa', fontSize: 12, flex: 1 }}>EmailDocument JSON</span>
            <button onClick={() => copy(json)} style={{ padding: '4px 12px', border: '1px solid #27272a', borderRadius: 5, background: '#27272a', color: '#e4e4e7', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              {copied ? <Check size={12} /> : <Clipboard size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre style={{ flex: 1, margin: 0, padding: '16px', overflowY: 'auto', color: '#cdd6f4', fontSize: 12, fontFamily: "'Fira Code', 'Cascadia Code', monospace", lineHeight: 1.6 }}>
            {json}
          </pre>
        </div>
      )}

      {/* HTML preview pane */}
      {activeTab === 'html' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Raw HTML */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e2e', borderRight: '1px solid #27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #27272a' }}>
              <span style={{ color: '#a1a1aa', fontSize: 12, flex: 1 }}>Raw HTML</span>
              <button onClick={() => copy(html)} style={{ padding: '4px 12px', border: '1px solid #27272a', borderRadius: 5, background: '#27272a', color: '#e4e4e7', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                {copied ? <Check size={12} /> : <Clipboard size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre style={{ flex: 1, margin: 0, padding: '16px', overflowY: 'auto', color: '#cdd6f4', fontSize: 11, fontFamily: "'Fira Code', 'Cascadia Code', monospace", lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {html}
            </pre>
          </div>
          {/* Live iframe preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f8f8' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #e4e4e7', color: '#71717a', fontSize: 12 }}>
              Email Preview
            </div>
            <iframe
              srcDoc={html}
              style={{ flex: 1, border: 'none', width: '100%' }}
              sandbox="allow-same-origin"
              title="Email preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
