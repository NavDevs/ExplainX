import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import AIChatCard from './components/ui/ai-chat';
// @ts-ignore - Webpack handles this CSS import
import './styles/globals.css';

export function mountChatbotSync(container: HTMLElement, onClose: () => void) {
  const root = createRoot(container);
  flushSync(() => {
    root.render(<AIChatCard onClose={onClose} />);
  });
}
