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
    const { numberOfQuizzes = 50, questionsPerQuiz = 12, entryFeeNaira, prizePoolNaira } = await req.json();

    if (numberOfQuizzes > 50) {
      return new Response(JSON.stringify({ error: 'Maximum 50 quizzes allowed per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (questionsPerQuiz < 10 || questionsPerQuiz > 15) {
      return new Response(JSON.stringify({ error: 'Questions per quiz must be between 10-15' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const feeNaira = Number(entryFeeNaira);
    const prizeNaira = Number(prizePoolNaira);
    if (!feeNaira || feeNaira < 50 || feeNaira % 50 !== 0) {
      return new Response(JSON.stringify({ error: 'Entry fee (Naira) must be a multiple of 50 and at least 50' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!prizeNaira || prizeNaira < 50 || prizeNaira % 50 !== 0) {
      return new Response(JSON.stringify({ error: 'Prize pool (Naira) must be a multiple of 50 and at least 50' }),
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
      "answer": "The exact text of the correct option (must match one of the options verbatim)",
      "timeLimit": 35
    }
  ]
}

Requirements:
- Questions must be CHALLENGING expert-level and FACTUALLY CORRECT
- Mix subtopics within ${category}
- Each question has exactly 4 plausible options
- "answer" MUST be a verbatim copy of the correct option string
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

        // Normalize questions - resolve correctOption from "answer" text, letter, or index
        const questions = quizData.questions.slice(0, questionsPerQuiz).map((q: any) => {
          const options = Array.isArray(q.options) ? q.options.slice(0, 4).map((o: any) => String(o)) : [];
          let correctOption = 0;
          const ansRaw = q.answer ?? q.correct_answer ?? q.correctOption ?? q.correct;
          if (typeof ansRaw === 'number' && ansRaw >= 0 && ansRaw <= 3) {
            correctOption = ansRaw;
          } else if (typeof ansRaw === 'string') {
            const trimmed = ansRaw.trim();
            const byText = options.findIndex((o: string) => o.trim().toLowerCase() === trimmed.toLowerCase());
            if (byText >= 0) {
              correctOption = byText;
            } else {
              const letterIdx = ['A','B','C','D'].indexOf(trimmed.toUpperCase());
              if (letterIdx >= 0) correctOption = letterIdx;
            }
          }
          return {
            text: String(q.text || q.question || ''),
            options,
            correctOption,
            timeLimit: Number(q.timeLimit) || 35,
          };
        }).filter((q: any) => q.text && q.options.length === 4);

        if (questions.length < 5) {
          console.error(`Quiz ${i + 1} has too few valid questions`);
          continue;
        }

        const entryFee = Math.max(1, Math.floor(feeNaira / 50)); // diamonds
        const totalPrize = Math.max(1, Math.floor(prizeNaira / 50)); // diamonds
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
