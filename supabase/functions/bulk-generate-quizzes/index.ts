import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const { numberOfQuizzes = 10, questionsPerQuiz = 12 } = await req.json();

    if (numberOfQuizzes > 50) {
      return new Response(
        JSON.stringify({ error: 'Maximum 50 quizzes allowed per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (questionsPerQuiz < 10 || questionsPerQuiz > 15) {
      return new Response(
        JSON.stringify({ error: 'Questions per quiz must be between 10-15' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const categories = ['General', 'Science', 'History', 'Sports', 'Entertainment'];
    const createdQuizzes = [];

    console.log(`Starting bulk generation of ${numberOfQuizzes} quizzes with ${questionsPerQuiz} questions each`);

    for (let i = 0; i < numberOfQuizzes; i++) {
      try {
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        console.log(`Generating quiz ${i + 1}/${numberOfQuizzes} - Category: ${category}`);

        // Generate quiz title and questions with AI
        const prompt = `Generate a complete quiz for the ${category} category with exactly ${questionsPerQuiz} HARD difficulty questions.

First provide a creative quiz title and description, then generate ${questionsPerQuiz} challenging questions.

Format your response as JSON with this structure:
{
  "title": "Creative quiz title here",
  "description": "Brief engaging description of the quiz",
  "questions": [
    {
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "timeLimit": 35
    }
  ]
}

Requirements:
- Questions should be CHALLENGING expert-level
- Mix different subtopics within ${category}
- Each question must have exactly 4 plausible options
- Time limit should be 30-45 seconds for hard questions
- Title should be engaging and category-specific
- Description should be 1-2 sentences

Return only valid JSON, no additional text.`;

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
                content: 'You are a quiz generator. Create high-quality, challenging quiz content. Always respond with valid JSON only.' 
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 3000,
            temperature: 0.8
          }),
        });

        if (!response.ok) {
          console.error(`OpenAI API error for quiz ${i + 1}:`, response.status);
          continue;
        }

        const data = await response.json();
        let quizData;
        
        try {
          const content = data.choices[0].message.content.trim();
          const cleanContent = content.replace(/```json\n?|\n?```/g, '');
          quizData = JSON.parse(cleanContent);
        } catch (parseError) {
          console.error(`Failed to parse quiz ${i + 1}:`, parseError);
          continue;
        }

        // Validate quiz data
        if (!quizData.title || !Array.isArray(quizData.questions) || quizData.questions.length !== questionsPerQuiz) {
          console.error(`Invalid quiz data structure for quiz ${i + 1}`);
          continue;
        }

        // Calculate financial settings
        const entryFee = Math.floor(Math.random() * 400) + 100; // 100-500
        const totalPrize = entryFee * 8; // 8x entry fee
        const baseReward = Math.floor(totalPrize / questionsPerQuiz / 2);
        
        // Generate progressive rewards
        const rewardProgression = [];
        for (let j = 1; j <= questionsPerQuiz; j++) {
          const multiplier = 1 + (j - 1) * 0.3;
          rewardProgression.push({
            questionNumber: j,
            correctReward: Math.floor(baseReward * multiplier)
          });
        }

        // Set quiz timing (starts in 1-24 hours, lasts 15-30 minutes)
        const startTime = new Date();
        startTime.setHours(startTime.getHours() + Math.floor(Math.random() * 24) + 1);
        
        const duration = Math.floor(Math.random() * 16) + 15; // 15-30 minutes
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + duration);

        // Save quiz to database
        const { data: savedQuiz, error: saveError } = await supabase
          .from('quizzes')
          .insert({
            title: quizData.title,
            description: quizData.description || `Challenging ${category} quiz with ${questionsPerQuiz} hard questions`,
            entry_fee: entryFee,
            prize_pool: totalPrize,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration: duration,
            questions: quizData.questions,
            reward_progression: rewardProgression,
            penalty_amount: Math.floor(entryFee * 0.1), // 10% of entry fee
            status: 'upcoming',
            is_available: true
          })
          .select()
          .single();

        if (saveError) {
          console.error(`Failed to save quiz ${i + 1}:`, saveError);
          continue;
        }

        createdQuizzes.push(savedQuiz);
        console.log(`Successfully created quiz ${i + 1}: ${quizData.title}`);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error creating quiz ${i + 1}:`, error);
        continue;
      }
    }

    console.log(`Bulk generation completed. Created ${createdQuizzes.length}/${numberOfQuizzes} quizzes`);

    return new Response(
      JSON.stringify({ 
        success: true,
        created: createdQuizzes.length,
        total: numberOfQuizzes,
        quizzes: createdQuizzes.map(q => ({ id: q.id, title: q.title, category: q.category }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bulk-generate-quizzes function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});