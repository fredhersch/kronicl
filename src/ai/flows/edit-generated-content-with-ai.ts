'use server';
/**
 * @fileOverview Allows users to edit the AI-generated title, summary, and tags using an AI tool.
 *
 * - editGeneratedContent - A function that handles the editing of AI-generated content.
 * - EditGeneratedContentInput - The input type for the editGeneratedContent function.
 * - EditGeneratedContentOutput - The return type for the editGeneratedContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditGeneratedContentInputSchema = z.object({
  originalTitle: z.string().describe('The original AI-generated title.'),
  originalSummary: z.string().describe('The original AI-generated summary.'),
  originalTags: z.array(z.string()).describe('The original AI-generated tags.'),
  userInstructions: z.string().describe('Specific instructions from the user on how to refine the content.'),
});
export type EditGeneratedContentInput = z.infer<typeof EditGeneratedContentInputSchema>;

const EditGeneratedContentOutputSchema = z.object({
  editedTitle: z.string().describe('The refined title based on user instructions.'),
  editedSummary: z.string().describe('The refined summary based on user instructions.'),
  editedTags: z.array(z.string()).describe('The refined tags based on user instructions.'),
});
export type EditGeneratedContentOutput = z.infer<typeof EditGeneratedContentOutputSchema>;

export async function editGeneratedContent(input: EditGeneratedContentInput): Promise<EditGeneratedContentOutput> {
  return editGeneratedContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editGeneratedContentPrompt',
  input: {schema: EditGeneratedContentInputSchema},
  output: {schema: EditGeneratedContentOutputSchema},
  prompt: `You are an AI assistant that helps refine user-generated content based on specific instructions.

Original Title: {{{originalTitle}}}
Original Summary: {{{originalSummary}}}
Original Tags: {{#each originalTags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

User Instructions: {{{userInstructions}}}

Based on the user instructions, refine the original title, summary, and tags. Ensure the refined content aligns with the user's preferences and maintains coherence and relevance.

Please provide the edited title, summary, and tags in the following format:
{
  "editedTitle": "Refined Title",
  "editedSummary": "Refined Summary",
  "editedTags": ["Refined Tag 1", "Refined Tag 2", "Refined Tag 3"]
}
`,
});

const editGeneratedContentFlow = ai.defineFlow(
  {
    name: 'editGeneratedContentFlow',
    inputSchema: EditGeneratedContentInputSchema,
    outputSchema: EditGeneratedContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
