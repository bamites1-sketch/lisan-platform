// AI Reading Tutor Service
// Uses OpenAI API with a fallback to smart rule-based responses

interface StudentContext {
  firstName: string;
  grade: string;
  readinessScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  priorities?: string[];
  currentLesson?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Build the system prompt for Lemi — a general-purpose student assistant
const buildSystemPrompt = (context: StudentContext): string => {
  const gradeNum = context.grade.replace('GRADE_', '');
  const weaknessList = context.weaknesses?.join(', ') || 'none identified yet';
  const priorityList = context.priorities?.join(', ') || 'all areas';

  return `You are Lemi, a warm, encouraging, and knowledgeable AI tutor on the LiSAN learning platform for students in Ethiopia and beyond. You help students with ANYTHING they ask — school subjects, homework, curiosity questions, or personal learning goals.

STUDENT PROFILE:
- Name: ${context.firstName}
- Grade: ${gradeNum}
- Reading Readiness Score: ${context.readinessScore || 'Not yet assessed'}/100
- Reading areas needing support: ${weaknessList}
- Current reading focus: ${priorityList}
${context.currentLesson ? `- Currently working on: ${context.currentLesson}` : ''}

═══════════════════════════════════════
WHAT YOU CAN HELP WITH (answer ALL of these):
═══════════════════════════════════════
• Mathematics — arithmetic, fractions, algebra, geometry, word problems, any grade level
• Science — biology, chemistry, physics, earth science, experiments, concepts
• English & Reading — comprehension, vocabulary, grammar, writing, spelling, phonics, fluency
• History & Social Studies — world history, Ethiopian history, geography, civics
• Amharic & Other Languages — translation help, grammar, meaning of words
• General Knowledge — any curious "why" or "how" question about the world
• Study Skills — how to take notes, memorise, manage time, prepare for exams
• Homework Help — work through any problem step by step

═══════════════════════════════════════
YOUR PERSONALITY:
═══════════════════════════════════════
- Warm, patient, and encouraging — never make a student feel bad for not knowing something
- Speak simply and clearly, at a Grade ${gradeNum} level
- Celebrate effort and curiosity, not just correct answers
- Use emojis sparingly and warmly (😊, 💡, ✨, 📖, 🔢, 🌍)
- Be concise — give clear answers without overwhelming the student

═══════════════════════════════════════
YOUR TEACHING APPROACH:
═══════════════════════════════════════
- For factual questions: give a clear, direct answer first, then add helpful context
- For problem-solving (math, science): show the steps, explain the reasoning
- For comprehension/vocabulary: use context clues and relatable examples
- For "I'm stuck" messages: give a guiding hint first, then the full explanation if needed
- For wrong answers: acknowledge the attempt positively, correct gently, explain why
- Always end with an invitation to ask more or go deeper

═══════════════════════════════════════
CULTURAL CONTEXT:
═══════════════════════════════════════
- The student may be from Ethiopia — use locally relevant examples when natural (Ethiopian food, places, people, history)
- Amharic words or phrases are welcome when they help clarify
- Be inclusive and respectful of all backgrounds

═══════════════════════════════════════
RESPONSE FORMAT:
═══════════════════════════════════════
- Use **bold** for key terms or steps
- Use numbered lists for multi-step processes
- Use short paragraphs — avoid walls of text
- Keep responses under 300 words unless a detailed explanation is genuinely needed
- If asked something you truly cannot answer, say so honestly and suggest where to look

Remember: Your goal is to make ${context.firstName} feel smart, capable, and excited to learn. Every question is a good question.`;
};

// Rule-based fallback responses when no API key is available
const ruleBasedResponse = (
  message: string,
  context: StudentContext
): string => {
  const msg = message.toLowerCase();
  const name = context.firstName;

  // Vocabulary help
  if (msg.includes("what does") || msg.includes("word mean") || msg.includes("define")) {
    const word = message.match(/["']([^"']+)["']|what does (\w+) mean/i)?.[1] || message.match(/what does (\w+) mean/i)?.[1];
    if (word) {
      return `Great question about the word "${word}"! 📖 

Instead of just telling you the definition, let's figure it out together.

Think about the sentence where you saw "${word}". What was happening around it?

💡 **Hint**: Look at the words before and after it — they often give us clues about meaning. What do you think it could mean based on the context?

Try your best guess, and then I'll help you check! 😊`;
    }
    return `I'd love to help with that word! 📖 Could you tell me the sentence where you saw it? Context clues are one of the best tools for understanding new words, and I want to teach you how to use them.`;
  }

  // Comprehension help
  if (msg.includes("don't understand") || msg.includes("confused") || msg.includes("help me understand")) {
    return `No worries, ${name}! 😊 Let's break it down together.

When something feels confusing, the best trick is to **slow down** and focus on just one sentence at a time.

**Let's start here:**
1. What is the passage mainly about? (Even a guess is fine!)
2. Who or what is the most important thing in this part?

Tell me what you think, and we'll work through it step by step. There are no wrong answers when we're exploring! 💡`;
  }

  // Hint request
  if (msg.includes("hint") || msg.includes("clue") || msg.includes("help me")) {
    return `Here's your hint! 💡

Think about **what you already know** about this topic. 

Ask yourself:
- "Have I seen something like this before?"
- "What does the question actually want me to find?"
- "What are the key words in the question?"

Take another look with fresh eyes and give it a try. I believe in you! ✨`;
  }

  // Vocabulary practice request
  if (msg.includes("vocabulary") || msg.includes("practice words") || msg.includes("word practice")) {
    const vocabQuestions = [
      `Let's practice! Here's a fill-in-the-blank:\n\n"The scientist carefully _______ the results of the experiment, writing down everything she noticed."\n\n**Word choices:** observed / ignored / created / deleted\n\nWhich word fits best? Think about what a scientist would do! 🔬`,
      `Here's a vocabulary challenge:\n\n"The student was very _______ about learning new things — she asked questions about everything!"\n\n**Word choices:** reluctant / curious / bored / tired\n\nWhich word makes sense? Think about what it means to ask questions about everything! 💭`,
      `Time for vocabulary practice!\n\n"After the heavy rain, the river began to _______ its banks, flooding the nearby fields."\n\n**Word choices:** overflow / dry / shrink / freeze\n\nPick the best word and explain why you chose it! 🌊`
    ];
    const randomQ = vocabQuestions[Math.floor(Math.random() * vocabQuestions.length)];
    return randomQ;
  }

  // Reading practice request
  if (msg.includes("reading practice") || msg.includes("read something") || msg.includes("practice reading")) {
    return `Great — let's practice reading! 📖

Here's a short passage to read carefully:

---
*"Amara walked slowly through the marketplace, her eyes wide with wonder. The smell of fresh injera filled the air. Vendors called out in Amharic, Oromo, and Tigrinya. She stopped at a stall selling colorful cloth and thought, 'One day, I'll make something beautiful with this.'"*
---

Now, tell me:
1. **Where is Amara?**
2. **How does she feel?** (What clue tells you that?)
3. **What is she dreaming about?**

Take your time! There's no rush. 😊`;
  }

  // Fluency help
  if (msg.includes("fluency") || msg.includes("read faster") || msg.includes("read smoothly")) {
    return `Reading fluency is about reading **smoothly and accurately** — not just fast! 🎤

Here are the three keys to fluency:
1. **Accuracy** — reading the right words
2. **Rate** — reading at a comfortable speed (not too fast, not too slow)
3. **Expression** — reading with feeling, like you're telling a story

**My best tip:** 
Try **repeated reading** — read the same passage 3 times. The first time for accuracy, the second time for smoothness, the third time for expression. You'll be amazed how much better it sounds!

Want to try a passage right now? I can give you one! 😊`;
  }

  // Greeting or general chat
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return `Hi ${name}! 👋 I'm Pathy, your reading coach. I'm here to help you with anything reading-related!

Here's what I can help you with today:
- 📚 **Vocabulary** — explain words or practice new ones
- 🧠 **Comprehension** — understand what you read
- 🎤 **Fluency** — read more smoothly
- 💡 **Hints** — when you're stuck on a question

What would you like to work on? 😊`;
  }

  // Encouragement or confidence issues
  if (msg.includes("can't do") || msg.includes("too hard") || msg.includes("give up") || msg.includes("don't know")) {
    return `${name}, I hear you — and I want you to know that **finding things hard just means you're learning**. 💪

Every reader starts somewhere, and you're already doing something amazing just by trying.

Let's take it one small step at a time. Tell me exactly which part feels hard, and we'll tackle it together. I promise there's a way through this! ✨

What's the specific thing that's tricky right now?`;
  }

  // Progress/score questions
  if (msg.includes("my score") || msg.includes("how am i doing") || msg.includes("progress")) {
    const score = context.readinessScore;
    if (score) {
      return `You're doing ${score >= 75 ? 'really well' : score >= 60 ? 'good' : 'a great job working hard'}! 📈

Your current reading readiness score is **${score}/100**.

${score >= 75
    ? `You're strong in most areas. Keep practicing to get even better!`
    : score >= 60
    ? `You're making solid progress! A little more focused practice and you'll see big improvements.`
    : `You're at the beginning of your reading journey, which is the best place to be — there's so much growth ahead!`
  }

The best thing you can do right now is keep practicing consistently, even just 15 minutes a day. Want to practice something specific? 😊`;
    }
    return `You haven't taken your reading assessment yet — once you do, I'll be able to give you a full picture of where you are and exactly what to work on! 📊\n\nShould we start the assessment? It's not a test you can fail — it's just for understanding.`;
  }

  // Default encouraging response
  return `That's a great question, ${name}! 😊 

I want to help you with that. Could you tell me a bit more about what you're working on? For example:
- Are you trying to understand a specific word or passage?
- Do you need help with a practice question?
- Or are you looking for reading practice?

The more you tell me, the better I can help! 📖`;
};

// Main function to get AI tutor response
export const getTutorResponse = async (
  messages: ChatMessage[],
  context: StudentContext
): Promise<{ text: string; provider: 'gemini' | 'openai' | 'offline' }> => {
  // Gemini's free API is the primary provider. The key stays on the server.
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: buildSystemPrompt(context) }] },
            contents: messages.map(message => ({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
          }),
        }
      );

      const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string };
      };
      const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
      if (response.ok && text) return { text, provider: 'gemini' };
      console.error('Gemini API error:', data.error?.message || `HTTP ${response.status}`);
    } catch (error) {
      console.error('Gemini API request failed, trying fallback providers:', error);
    }
  }

  // Optional OpenAI fallback for deployments that already have this key.
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt(context) },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json() as {
        choices?: Array<{ message: { content: string } }>;
        error?: { message: string }
      };

      if (data.choices && data.choices[0]) {
        return { text: data.choices[0].message.content, provider: 'openai' };
      }
    } catch (error) {
      console.error('OpenAI API error, falling back to rule-based responses:', error);
    }
  }

  // Fallback to rule-based responses
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  return { text: ruleBasedResponse(lastUserMessage, context), provider: 'offline' };
};
