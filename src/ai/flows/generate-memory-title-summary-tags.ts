'use server';
/**
 * @fileOverview Generates a title, summary, and tags for a memory based on the audio transcription.
 *
 * - generateMemoryTitleSummaryTags - A function that handles the memory enrichment process.
 * - GenerateMemoryTitleSummaryTagsInput - The input type for the generateMemoryTitleSummaryTags function.
 * - GenerateMemoryTitleSummaryTagsOutput - The return type for the generateMemoryTitleSummaryTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMemoryTitleSummaryTagsInputSchema = z.object({
  transcription: z.string().describe('The transcription of the audio note associated with the memory.'),
});
export type GenerateMemoryTitleSummaryTagsInput = z.infer<typeof GenerateMemoryTitleSummaryTagsInputSchema>;

const GenerateMemoryTitleSummaryTagsOutputSchema = z.object({
  title: z.string().describe('The generated title for the memory.'),
  summary: z.string().describe('The generated summary for the memory.'),
  tags: z.array(z.string()).describe('The generated tags for the memory.'),
});
export type GenerateMemoryTitleSummaryTagsOutput = z.infer<typeof GenerateMemoryTitleSummaryTagsOutputSchema>;

export async function generateMemoryTitleSummaryTags(input: GenerateMemoryTitleSummaryTagsInput): Promise<GenerateMemoryTitleSummaryTagsOutput> {
  return generateMemoryTitleSummaryTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMemoryTitleSummaryTagsPrompt',
  input: {schema: GenerateMemoryTitleSummaryTagsInputSchema},
  output: {schema: GenerateMemoryTitleSummaryTagsOutputSchema},
  prompt: `You are an AI assistant that helps users create memories. Based on the following transcription of an audio note, generate a concise title, a short summary, and relevant tags for the memory.

Transcription: {{{transcription}}}

Title: A short, descriptive title for the memory.
Summary: A one-sentence summary of the memory.
Tags: A list of comma separated keywords relevant to the memory.

Please provide your response in the following format:
{
  "title": "Generated Title",
  "summary": "Generated Summary",
  "tags": ["tag1", "tag2", "tag3"]
}
`,
});

const generateMemoryTitleSummaryTagsFlow = ai.defineFlow(
  {
    name: 'generateMemoryTitleSummaryTagsFlow',
    inputSchema: GenerateMemoryTitleSummaryTagsInputSchema,
    outputSchema: GenerateMemoryTitleSummaryTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
