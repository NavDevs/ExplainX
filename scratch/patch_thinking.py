import re

with open('src/utils/aiClient.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the formatThinkingBlocks function at the top
helper_func = """
function formatThinkingBlocks(text: string): string {
  if (!text) return text;
  let result = text.replace(/<think>/g, '<details class="explainx-thought-process" style="margin: 8px 0; padding: 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.3);"><summary style="cursor: pointer; font-size: 11px; font-weight: 600; color: #a1a1aa; user-select: none; outline: none; margin-bottom: 8px; list-style-type: none; display: flex; align-items: center; gap: 6px;">🤔 Thought Process</summary><div style="font-size: 11px; color: #9ca3af; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 10px; opacity: 0.9;">\n\n');
  result = result.replace(/<\/think>/g, '\n\n</div></details>\n\n');
  return result;
}
"""

if 'function formatThinkingBlocks' not in content:
    content = content.replace('const API_ENDPOINTS', helper_func + '\nconst API_ENDPOINTS')

# Patch stream updates
content = content.replace('if (onUpdate) onUpdate(fullText);', 'if (onUpdate) onUpdate(formatThinkingBlocks(fullText));')

# Patch return fullText;
content = content.replace('return fullText;', 'return formatThinkingBlocks(fullText);')

# Patch other returned content
content = content.replace('return data.choices[0].message.content;', 'return formatThinkingBlocks(data.choices[0].message.content);')
content = content.replace('return data.candidates[0].content.parts[0].text;', 'return formatThinkingBlocks(data.candidates[0].content.parts[0].text);')
content = content.replace('return data.content[0].text;', 'return formatThinkingBlocks(data.content[0].text);')

with open('src/utils/aiClient.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched successfully")
