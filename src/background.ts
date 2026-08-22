import { callAI, callAIChat } from './utils/aiClient';
import { getStoredSettings, saveToHistory, generateId } from './utils/storage';
import { Mode, ChatMessage } from './utils/storage';

// Register the context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'explainx',
    title: 'Explain with ExplainX',
    contexts: ['selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'explainx' || !tab?.id) return;

  const tabId = tab.id;

  // Ask content script for the selected text + element info
  let selectionData: { selectedText: string; isCode: boolean } | null = null;
  try {
    selectionData = await chrome.tabs.sendMessage(tabId, { type: 'GET_SELECTION' });
  } catch (e) {
    // Content script may not be injected yet; try scripting injection
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      selectionData = await chrome.tabs.sendMessage(tabId, { type: 'GET_SELECTION' });
    } catch {
      return;
    }
  }

  if (!selectionData || !selectionData.selectedText.trim()) {
    chrome.tabs.sendMessage(tabId, { type: 'SHOW_ERROR', error: 'Please select some text first.' });
    return;
  }

  // Determine mode: auto code detection or user default
  const settings = await getStoredSettings();
  const mode: Mode = selectionData.isCode ? 'beginner-code' : settings.defaultMode;

  // Ask content script to show loading popup
  chrome.tabs.sendMessage(tabId, { type: 'SHOW_LOADING', mode });

  // Call AI
  try {
    const explanation = await callAI(selectionData.selectedText, mode);
    
    // Create chat message with explanation
    const chatMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: explanation,
      timestamp: Date.now(),
      mode: mode,
      selectedText: selectionData.selectedText
    };
    
    // Send to chat interface
    chrome.tabs.sendMessage(tabId, { 
      type: 'SHOW_EXPLANATION', 
      explanation: explanation, 
      mode: mode,
      asChatMessage: true,
      chatMessage: chatMsg
    });
    
    await saveToHistory({
      text: selectionData.selectedText,
      mode,
      explanation,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    chrome.tabs.sendMessage(tabId, { type: 'SHOW_ERROR', error: err.message || 'Something went wrong.' });
  }
});

// Handle re-explain requests from content script (mode switch)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Existing RE_EXPLAIN handler
  if (request.type === 'RE_EXPLAIN') {
    const tabId = sender.tab?.id;
    if (!tabId) return false;

    const { selectedText, mode } = request;
    callAI(selectedText, mode as Mode)
      .then((explanation) => {
        chrome.tabs.sendMessage(tabId, { type: 'SHOW_EXPLANATION', explanation, mode });
        saveToHistory({ text: selectedText, mode, explanation, timestamp: Date.now() });
      })
      .catch((err) => {
        chrome.tabs.sendMessage(tabId, { type: 'SHOW_ERROR', error: err.message });
      });
    return false;
  }
  
  // New CHAT_MESSAGE handler
  if (request.type === 'CHAT_MESSAGE') {
    const tabId = sender.tab?.id;
    if (!tabId) return false;
    
    const { message, conversationHistory, imageUrl } = request;
    
    // Find the most recent selected text context (if any)
    const lastSelectedText = conversationHistory
      .slice()
      .reverse()
      .find((msg: any) => msg.selectedText)?.selectedText;
    
    // Build messages array for AI with system prompt
    let systemPrompt = 'You are ExplainX, an incredibly intelligent, friendly, and empathetic AI assistant. You can handle everything from complex technical questions to human emotions (if the user feels low, be warm, supportive, and conversational). You are also an expert at analyzing uploaded photos accurately and thoroughly. Always respond directly to the user\'s intent and use markdown formatting for better readability. CRITICAL RULE: Never output your internal planning, thought outlines, persona breakdown, user intent analysis, or reasoning bullet points in your response. Output ONLY the final direct answer to the user.';
    
    // If there's selected text context, add it to system prompt
    if (lastSelectedText) {
      systemPrompt += `\n\nThe user previously selected this text for explanation: "${lastSelectedText.substring(0, 200)}${lastSelectedText.length > 200 ? '...' : ''}". If their questions relate to this text, use it as context for your responses.`;
    }
    
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({ role: msg.role, content: msg.content, imageUrl: msg.imageUrl }))
    ];
    
    callAIChat(aiMessages, 1000, imageUrl, (partialText) => {
      // Typing animation (streaming) disabled per user request
      // chrome.tabs.sendMessage(tabId, {
      //   type: 'CHAT_CHUNK',
      //   text: partialText
      // }).catch(() => {});
    })
      .then((response) => {
        const assistantMsg = {
          id: generateId(),
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };
        
        chrome.tabs.sendMessage(tabId, {
          type: 'CHAT_RESPONSE',
          message: assistantMsg
        }).catch(() => {});
      })
      .catch((err) => {
        chrome.tabs.sendMessage(tabId, {
          type: 'CHAT_ERROR',
          error: err.message
        }).catch(() => {});
      });
    
    return true; // Keep message channel open
  }
  
  return false;
});
