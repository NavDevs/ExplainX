import { Mode } from './storage';

export function buildPrompt(text: string, mode: Mode): string {
  // Each prompt instructs the AI to structure responses with markdown headings
  // The AI response will be rendered as-is using marked.parse() in content.ts
  // No additional headers or modifications are added to the AI response
  // Prompts are designed to be concise for initial explanation, then allow follow-up questions
  
  switch (mode) {
    case 'simple':
      return `You are a friendly teacher who explains things in the simplest way possible. Provide a brief, clear explanation of the following text.

Rules for your explanation:
1. Keep it concise (2-3 short paragraphs max)
2. Use simple language - avoid jargon
3. Start with a one-sentence summary
4. Use one everyday example or analogy if helpful
5. End with 1-2 key takeaway points

Explain this simply:

"${text}"`;

    case 'student':
      return `You are a patient professor who makes complex topics clear. Provide a concise but thorough explanation.

Structure your response:
1. ## Overview (1-2 sentences): What is this about?
2. ## Key Points: 2-3 bullet points with brief explanations
3. ## Example: One concrete, relatable example
4. ## Why It Matters: 1-2 sentences on practical importance

Keep it focused and concise. Use simple language.

Explain this:

"${text}"`;

    case 'beginner-code':
      return `You are a senior developer teaching beginners. Provide a clear, concise explanation of this code.

Explain this code:
\`\`\`
${text}
\`\`\`

Structure:
1. ## What It Does (1-2 sentences): High-level purpose
2. ## How It Works: Brief line-by-line or section breakdown
3. ## Key Concept: One important programming concept used here

Keep it simple and encouraging. Assume the reader is new to coding.`;

    case 'interview':
      return `You are an interview coach. Provide a concise explanation focused on interview-relevant concepts.

Explain this:

"${text}"

Structure:
1. ## Core Concept (2-3 sentences): What interviewers want you to know
2. ## Key Points: 2-3 bullet points covering essentials
3. ## Interview Tip: One practical tip for interviews

Keep it focused on what matters for technical interviews.`;

    case 'summary':
      return `You are an expert at creating concise summaries. Provide a brief, clear summary.

Summarize this:

"${text}"

Structure:
1. ## Main Point (1 sentence): What is this fundamentally about?
2. ## Key Takeaways: 3-4 brief bullet points
3. ## Bottom Line: One sentence conclusion

Be concise and clear. Focus on the most important information.`;

    default:
      return `Explain the following in simple, clear language that anyone can understand. Use examples and break down complex ideas:

"${text}"`;
  }
}

export const MODE_LABELS: Record<Mode, string> = {
  'simple': 'Simple',
  'student': 'Student',
  'beginner-code': 'Beginner Code',
  'interview': 'Interview',
  'summary': 'Summary',
};

export const ALL_MODES: Mode[] = ['simple', 'student', 'beginner-code', 'interview', 'summary'];
