'use server';
/**
 * @fileOverview An AI-powered tool that analyzes recent Aryan Trader live stream themes
 * and suggests high-impact captions and trending hashtags for Instagram Reels.
 *
 * - aiReelContentOptimizer - A function that optimizes content for Instagram Reels.
 * - AIReelContentOptimizerInput - The input type for the aiReelContentOptimizer function.
 * - AIReelContentOptimizerOutput - The return type for the aiReelContentOptimizer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIReelContentOptimizerInputSchema = z.object({
  liveStreamThemes: z
    .string()
    .describe(
      'Key themes, topics, or direct transcript snippets from recent Aryan Trader live streams. Provide as much detail as possible.'
    ),
});
export type AIReelContentOptimizerInput = z.infer<
  typeof AIReelContentOptimizerInputSchema
>;

const AIReelContentOptimizerOutputSchema = z.object({
  caption: z
    .string()
    .describe(
      'A high-impact, engaging Instagram Reel caption (max 2200 characters) designed to drive engagement for Aryan Trader\'s audience.'
    ),
  hashtags: z
    .string()
    .describe(
      'A comma-separated list of 10-15 trending and highly relevant hashtags for the Instagram Reel, optimized for discoverability.'
    ),
});
export type AIReelContentOptimizerOutput = z.infer<
  typeof AIReelContentOptimizerOutputSchema
>;

export async function aiReelContentOptimizer(
  input: AIReelContentOptimizerInput
): Promise<AIReelContentOptimizerOutput> {
  return aiReelContentOptimizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiReelContentOptimizerPrompt',
  input: { schema: AIReelContentOptimizerInputSchema },
  output: { schema: AIReelContentOptimizerOutputSchema },
  prompt: `You are an expert social media content strategist specializing in financial trading and influencer marketing for an Instagram fan page of 'Aryan Trader'.

Your task is to analyze the provided live stream themes and generate a high-impact Instagram Reel caption and a list of trending hashtags.

Keep the tone engaging, educational, and inspiring, aligning with Aryan Trader's brand. The caption should be concise yet compelling, and the hashtags should maximize reach and relevance for trading enthusiasts and potential new followers.

Live Stream Themes/Content:
{{{liveStreamThemes}}}
`,
});

const aiReelContentOptimizerFlow = ai.defineFlow(
  {
    name: 'aiReelContentOptimizerFlow',
    inputSchema: AIReelContentOptimizerInputSchema,
    outputSchema: AIReelContentOptimizerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
