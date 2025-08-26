export async function fetchWordFromAI(): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Respond with a single random common five-letter English word in lowercase. No explanations.',
        },
        { role: 'user', content: 'word' },
      ],
      max_tokens: 5,
      temperature: 1,
    }),
  });
  const raw: unknown = await resp.json();
  interface ChatCompletionResponse {
    choices: { message?: { content?: string } }[];
  }
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('choices' in raw) ||
    !Array.isArray((raw as { choices: unknown }).choices)
  ) {
    throw new Error('Invalid response structure from OpenAI');
  }
  const data = raw as ChatCompletionResponse;
  const word = data.choices[0]?.message?.content?.trim().toLowerCase() ?? '';
  if (!/^[a-z]{5}$/.test(word)) {
    throw new Error('Invalid word received from OpenAI');
  }
  return word;
}
