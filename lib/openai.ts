import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
  dangerouslyAllowBrowser: true // Enable client-side usage
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}