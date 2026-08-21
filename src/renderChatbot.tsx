import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import AIChatCard from './components/ui/ai-chat';
// @ts-ignore - Webpack handles this CSS import
import './styles/globals.css';

/**
 * Mounts the ExplainX React chatbot inside a Shadow DOM attached to `hostContainer`.
 * Shadow DOM creates a hard CSS isolation boundary — absolutely nothing from the host
 * page's stylesheets (including !important rules) can reach inside it.
 */
export function mountChatbotSync(hostContainer: HTMLElement, onClose: () => void) {
  // Attach an open Shadow Root so DevTools can inspect it
  const shadow = hostContainer.attachShadow({ mode: 'open' });

  // ---- Baseline scoped reset (so host-page global resets don't bleed in) ----
  const resetStyle = document.createElement('style');
  resetStyle.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    :host {
      all: initial;
      display: block;
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #f4f4f5;
    }
    button, input, textarea, select { font-family: inherit; }
    textarea::placeholder, input::placeholder { color: #71717a; opacity: 1; }
    textarea { color: #f4f4f5 !important; background: #27272a !important; }
  `;
  shadow.appendChild(resetStyle);

  // ---- Inject our compiled Tailwind/content CSS into the shadow root ----
  const cssUrls = [
    chrome.runtime.getURL('content.css'),
    chrome.runtime.getURL('styles/content.css'),
  ];
  cssUrls.forEach(url => {
    fetch(url)
      .then(r => (r.ok ? r.text() : ''))
      .then(cssText => {
        if (cssText) {
          const style = document.createElement('style');
          style.textContent = cssText;
          shadow.appendChild(style);
        }
      })
      .catch(() => {});
  });

  // ---- Create React mount point inside the shadow root ----
  const mountPoint = document.createElement('div');
  mountPoint.style.cssText =
    'width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:#09090b;';
  shadow.appendChild(mountPoint);

  // ---- Mount React ----
  const root = createRoot(mountPoint);
  flushSync(() => {
    root.render(<AIChatCard onClose={onClose} />);
  });
}
