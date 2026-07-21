import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { numberOfQuizzes = 50, questionsPerQuiz = 12 } = await req.json();

    if (numberOfQuizzes > 50) {
      return new Response(JSON.stringify({ error: 'Maximum 50 quizzes allowed per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (questionsPerQuiz < 10 || questionsPerQuiz > 15) {
      return new Response(JSON.stringify({ error: 'Questions per quiz must be between 10-15' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not set');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const categories = ['General Knowledge', 'Science', 'History', 'Sports', 'Entertainment', 'Geography', 'Technology', 'Literature'];
    const createdQuizzes: any[] = [];

    console.log(`Starting bulk generation of ${numberOfQuizzes} quizzes with ${questionsPerQuiz} questions each`);

    for (let i = 0; i < numberOfQuizzes; i++) {
      try {
        const category = categories[Math.floor(Math.random() * categories.length)];
        console.log(`Generating quiz ${i + 1}/${numberOfQuizzes} - Category: ${category}`);

        const prompt = `Generate a complete quiz for the ${category} category with exactly ${questionsPerQuiz} HARD difficulty questions.

Return ONLY valid JSON (no markdown, no code fences) in this exact structure:
{
  "title": "Creative quiz title",
  "description": "Brief engaging description",
  "questions": [
    {
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "timeLimit": 35
    }
  ]
}

Requirements:
- Questions must be CHALLENGING expert-level
- Mix subtopics within ${category}
- Each question has exactly 4 plausible options
- correctOption is the 0-based index of the correct answer
- timeLimit between 30-45 seconds
- Title engaging and category-specific`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a quiz generator. Always respond with valid JSON only, no markdown fences.' },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI gateway error for quiz ${i + 1}: ${response.status} ${errText}`);
          if (response.status === 429 || response.status === 402) {
            return new Response(JSON.stringify({
              error: response.status === 429 ? 'Rate limit exceeded. Try again later.' : 'AI credits exhausted. Please add credits.',
              created: createdQuizzes.length,
            }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          continue;
        }

        const data = await response.json();
        let quizData: any;
        try {
          const content = (data.choices?.[0]?.message?.content || '').trim();
          const clean = content.replace(/```json\n?|\n?```/g, '').trim();
          quizData = JSON.parse(clean);
        } catch (parseError) {
          console.error(`Failed to parse quiz ${i + 1}:`, parseError);
          continue;
        }

        if (!quizData.title || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
          console.error(`Invalid quiz data structure for quiz ${i + 1}`);
          continue;
        }

        // Normalize questions
        const questions = quizData.questions.slice(0, questionsPerQuiz).map((q: any) => ({
          text: String(q.text || q.question || ''),
          options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
          correctOption: Number(q.correctOption ?? q.correct ?? 0),
          timeLimit: Number(q.timeLimit) || 35,
        })).filter((q: any) => q.text && q.options.length === 4);

        if (questions.length < 5) {
          console.error(`Quiz ${i + 1} has too few valid questions`);
          continue;
        }

        const entryFeeNaira = (Math.floor(Math.random() * 9) + 2) * 50; // 100-500 naira
        const entryFee = Math.floor(entryFeeNaira / 50); // diamonds
        const totalPrize = entryFee * 8;
        const baseReward = Math.max(1, Math.floor(totalPrize / questions.length / 2));

        const rewardProgression = questions.map((_: any, idx: number) => ({
          questionNumber: idx + 1,
          correctReward: Math.floor(baseReward * (1 + idx * 0.3)),
        }));

        const startTime = new Date();
        const duration = Math.floor(Math.random() * 16) + 15;
        const endTime = new Date(startTime);
        endTime.setDate(endTime.getDate() + 30);

        const { data: savedQuiz, error: saveError } = await supabase
          .from('quizzes')
          .insert({
            title: quizData.title,
            description: quizData.description || `Challenging ${category} quiz`,
            entry_fee: entryFee,
            prize_pool: totalPrize,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration,
            questions,
            reward_progression: rewardProgression,
            penalty_amount: Math.max(1, Math.floor(entryFee * 0.1)),
            status: 'active',
            is_available: true,
          })
          .select()
          .single();

        if (saveError) {
          console.error(`Failed to save quiz ${i + 1}:`, saveError);
          continue;
        }

        createdQuizzes.push(savedQuiz);
        console.log(`Created quiz ${i + 1}: ${quizData.title}`);
      } catch (error) {
        console.error(`Error creating quiz ${i + 1}:`, error);
        continue;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      created: createdQuizzes.length,
      total: numberOfQuizzes,
      quizzes: createdQuizzes.map((q) => ({ id: q.id, title: q.title })),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error in bulk-generate-quizzes:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
