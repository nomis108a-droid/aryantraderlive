'use server';
/**
 * @fileOverview An AI tool to summarize YouTube Live streams and suggest Instagram Reel clip ideas.
 *
 * - youtubeLiveSummaryGenerator - A function that handles the YouTube Live stream summary generation process.
 * - YoutubeLiveSummaryGeneratorInput - The input type for the youtubeLiveSummaryGenerator function.
 * - YoutubeLiveSummaryGeneratorOutput - The return type for the youtubeLiveSummaryGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const YoutubeLiveSummaryGeneratorInputSchema = z.object({
  youtubeUrl: z.string().url().describe('The URL of the YouTube Live stream.'),
  youtubeTranscript:
    z.string().describe('The full transcript of the YouTube Live stream.'),
});
export type YoutubeLiveSummaryGeneratorInput = z.infer<
  typeof YoutubeLiveSummaryGeneratorInputSchema
>;

const YoutubeLiveSummaryGeneratorOutputSchema = z.object({
  summary:
    z.string().describe('A concise summary of the key discussion points from the live stream.'),
  clipIdeas:
    z.array(z.string()).describe(
      'An array of engaging short-form video clip ideas suitable for Instagram Reels, each with a brief description.'
    ),
});
export type YoutubeLiveSummaryGeneratorOutput = z.infer<
  typeof YoutubeLiveSummaryGeneratorOutputSchema
>;

export async function youtubeLiveSummaryGenerator(
  input: YoutubeLiveSummaryGeneratorInput
): Promise<YoutubeLiveSummaryGeneratorOutput> {
  return youtubeLiveSummaryGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'youtubeLiveSummaryPrompt',
  input: {schema: YoutubeLiveSummaryGeneratorInputSchema},
  output: {schema: YoutubeLiveSummaryGeneratorOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing YouTube Live streams, particularly for trading content, to help content creators identify key discussion points and potential short-form video clip ideas for Instagram Reels.

Analyze the provided YouTube Live stream transcript from the URL: {{{youtubeUrl}}}.

First, identify the most important discussion points, key takeaways, and valuable insights shared by Aryan Trader during the live stream. Condense these into a concise summary.

Second, suggest specific, engaging clip ideas suitable for Instagram Reels based on the transcript. Each clip idea should be a short, compelling sentence describing the content of the reel. Think about what would be appealing and impactful to an audience interested in trading, finance, and Aryan Trader's content.

Transcript:
{{{youtubeTranscript}}}`,
});

const youtubeLiveSummaryGeneratorFlow = ai.defineFlow(
  {
    name: 'youtubeLiveSummaryGeneratorFlow',
    inputSchema: YoutubeLiveSummaryGeneratorInputSchema,
    outputSchema: YoutubeLiveSummaryGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate summary and clip ideas.');
    }
    return output;
  }
);
