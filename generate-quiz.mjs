import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Edit this for each lesson you want to generate a quiz for
const lesson = {
  title: "Budgeting, Saving & Building Financial Resilience",
  desc: "The 50/30/20 rule, compound interest vs inflation, SMART financial goals, responsible borrowing, and how NRB policy reaches your personal wallet.",
  chapters: [
    "The 50/30/20 budgeting rule and building an emergency fund",
    "Compound interest vs inflation — the two forces shaping your wealth",
    "Calculating net worth and setting SMART financial goals",
    "Responsible borrowing, EMIs, and Nepal's Credit Information Bureau (CIB)",
    "How NRB policy decisions and deposit insurance affect your money",
  ],
};

const prompt = `You are creating a quiz for a financial literacy video lesson aimed at Nepali high school and college students.

Lesson title: ${lesson.title}
Lesson description: ${lesson.desc}
Topics covered:
${lesson.chapters.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Generate exactly 5 multiple-choice questions testing understanding of these specific topics. Each question needs exactly 4 options with one correct answer. Test comprehension, not trivial recall. Keep language clear for non-native English speakers.

Respond with ONLY valid JSON, no other text:
[
  { "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0 }
]`;

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-latest", // Updated to a valid model name
  max_tokens: 2000,
  messages: [{ role: "user", content: prompt }],
});

const text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n");
console.log(text);
