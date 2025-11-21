import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Starting cleanup of expired quizzes...');

    // Delete quizzes where end_time has passed
    const { data: deletedQuizzes, error } = await supabase
      .from('quizzes')
      .delete()
      .lt('end_time', new Date().toISOString())
      .select();

    if (error) {
      console.error('Error deleting expired quizzes:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const deletedCount = deletedQuizzes?.length || 0;
    console.log(`Successfully deleted ${deletedCount} expired quizzes`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `Deleted ${deletedCount} expired quiz(es)`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in cleanup-expired-quizzes function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
