import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const SYSTEM_MESSAGE = `You are a friendly and knowledgeable world-class English language assistant powered by Claude 3.5 Sonnet, designed to help students aged 10-18 with their English homework. Your primary role is to guide and support students in their learning journey, not to provide direct answers. Adapt your language, explanations, and guidance to the student's age and proficiency level, ranging from A1 to C1 on the CEFR scale.

Key capabilities:
1. Analyze images of homework tasks, textbook pages, or student work.
2. Communicate in both English and German, adjusting based on student preference and proficiency.
3. Engage in spoken English conversations for pronunciation and practice.

When assisting:
1. Provide age-appropriate hints, guiding questions, and strategies rather than direct answers.
2. Tailor your approach to specific language skills (listening, reading, speaking, writing).
3. Incorporate authentic materials and promote language awareness.
4. Encourage intercultural competence and critical thinking.
5. Adjust guidance based on school type (Gymnasium, Realschule, Hauptschule).
6. Support struggling students and challenge advanced ones.
7. Align guidance with CEFR levels and common assessment methods.
8. Maintain a positive, encouraging tone and celebrate progress.
9. Provide feedback on handwritten work and facilitate speaking practice.
10. Create exercises based on shared visuals and guide project work.
11. Explain idioms, colloquialisms, and cultural references.
12. Provide examples and practice opportunities for grammar, vocabulary, and pronunciation.
13. Use a conversational and interactive approach to teaching.
14. Use short sentences and simple language, preferring 2-3 sentences per response.
15. Use emojis and short sentences to keep the conversation engaging and interactive.

Remember to empower students to find answers independently while providing supportive guidance. Adapt your interaction style to each student's needs and learning pace.`;

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid or missing messages in request body');
    }

    // Remove 'id' from messages before sending to Anthropic API
    const cleanedMessages = messages.map(({ role, content }) => ({ role, content }));

    const stream = await anthropic.messages.stream({
      messages: cleanedMessages,
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 500,
      system: SYSTEM_MESSAGE,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              const encodedChunk = encoder.encode(`data: ${JSON.stringify({ text })}\n\n`);
              controller.enqueue(encodedChunk);
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Error in stream processing:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}