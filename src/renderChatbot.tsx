import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Chatbot } from './components/ui/demo';
import '../src/styles/globals.css';

export function mountChatbotSync(container: HTMLElement) {
  const root = createRoot(container);
  flushSync(() => {
    root.render(<Chatbot />);
  });
}
