import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, numberOfQuestions } = await req.json();

    if (!category || !numberOfQuestions) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: category, numberOfQuestions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const prompt = `Generate ${numberOfQuestions} HARD difficulty multiple choice quiz questions in the ${category} category.

Requirements:
1. Questions should be CHALLENGING and require deep knowledge
2. Mix different subtopics within the ${category} category
3. Questions should be at university/expert level difficulty
4. Each question must have exactly 4 answer options
5. Include tricky but fair questions that test real knowledge
6. Avoid overly obscure trivia - focus on important but challenging concepts

For each question, provide:
- A clear, challenging question text
- Exactly 4 plausible answer options
- The correct answer (specify index 0-3)
- 30-45 second time limit for hard questions

Format your response as a JSON array where each question has this structure:
{
  "text": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOption": 0 (0 for A, 1 for B, 2 for C, 3 for D),
  "timeLimit": 35
}

Generate challenging questions that separate casual players from knowledgeable ones. Return only the JSON array, no additional text.`;

    console.log('Generating hard questions for category:', { category, numberOfQuestions });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a quiz question generator. Generate high-quality, accurate multiple choice questions. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    let generatedQuestions;
    try {
      const content = data.choices[0].message.content.trim();
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '');
      generatedQuestions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse generated questions:', parseError);
      throw new Error('Failed to parse generated questions from ChatGPT');
    }

    // Validate the generated questions
    if (!Array.isArray(generatedQuestions)) {
      throw new Error('Generated questions is not an array');
    }

    const validatedQuestions = generatedQuestions.map((q, index) => {
      if (!q.text || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctOption !== 'number') {
        throw new Error(`Invalid question format at index ${index}`);
      }

      return {
        text: q.text,
        options: q.options,
        correctOption: Math.max(0, Math.min(3, q.correctOption)), // Ensure it's between 0-3
        timeLimit: q.timeLimit || 30
      };
    });

    console.log(`Successfully generated ${validatedQuestions.length} questions`);

    return new Response(
      JSON.stringify({ questions: validatedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-questions function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});