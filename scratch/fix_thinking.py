OPEN = (
    '<details class="explainx-thought-process" style="margin: 8px 0; padding: 12px;'
    ' border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.3);">'
    '<summary style="cursor: pointer; font-size: 11px; font-weight: 600; color: #a1a1aa;'
    ' user-select: none; outline: none; margin-bottom: 8px; list-style-type: none;'
    ' display: flex; align-items: center; gap: 6px;">\U0001f914 Thought Process</summary>'
    '<div style="font-size: 11px; color: #9ca3af; border-left: 2px solid rgba(255,255,255,0.1);'
    ' padding-left: 10px; opacity: 0.9;">\\n\\n'
)
CLOSE = '\\n\\n</div></details>\\n\\n'

new_func_lines = [
    'function formatThinkingBlocks(text: string): string {\n',
    '  if (!text) return text;\n',
    "  const OPEN = '" + OPEN + "';\n",
    "  const CLOSE = '" + CLOSE + "';\n",
    '  let result = text;\n',
    '  // Handle <think> and <thinking> (Claude, DeepSeek etc.)\n',
    '  result = result.replace(/<think>/g, OPEN).replace(/<thinking>/g, OPEN);\n',
    '  result = result.replace(/<\\/think>/g, CLOSE).replace(/<\\/thinking>/g, CLOSE);\n',
    '  return result;\n',
    '}\n',
]

with open('src/utils/aiClient.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the function block (lines 6-11 = index 5-10)
start = next(i for i, l in enumerate(lines) if 'function formatThinkingBlocks' in l)
end = next(i for i, l in enumerate(lines) if i > start and l.strip() == '}')
print(f'Found formatThinkingBlocks at lines {start+1}-{end+1}')
lines[start:end+1] = new_func_lines

# Now find and fix callAnthropicChat's final return
old_return = '  return formatThinkingBlocks(data.content[0].text);\n'
for i, l in enumerate(lines):
    if l == old_return and i > 400:
        lines[i] = (
            '  // Claude Thinking models return separate thinking+text content blocks.\n'
            '  // We ONLY want text blocks - ignore the thinking block.\n'
            "  const textBlocks = (data.content as any[]).filter((b: any) => b.type === 'text');\n"
            "  if (textBlocks.length === 0) throw new Error('Anthropic Claude returned no text content.');\n"
            "  const finalText = textBlocks.map((b: any) => b.text).join('\\n\\n');\n"
            '  return formatThinkingBlocks(finalText);\n'
        )
        print(f'Fixed callAnthropicChat return at line {i+1}')
        break

with open('src/utils/aiClient.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('All done!')
