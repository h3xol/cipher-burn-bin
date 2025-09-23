import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting cleanup of expired pastes...');

    // Delete pastes that have expired by time
    const { data: expiredPastes, error: selectError } = await supabase
      .from('pastes')
      .select('id, is_file, file_name')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (selectError) {
      console.error('Error fetching expired pastes:', selectError);
      throw selectError;
    }

    if (expiredPastes && expiredPastes.length > 0) {
      // Delete files from storage first
      for (const paste of expiredPastes) {
        if (paste.is_file && paste.file_name) {
          console.log(`Deleting expired file: ${paste.file_name}`);
          const { error: storageError } = await supabase.storage
            .from('encrypted-files')
            .remove([paste.file_name]);
          
          if (storageError) {
            console.error(`Error deleting expired file ${paste.file_name}:`, storageError);
          }
        }
      }

      const { error: deleteError } = await supabase
        .from('pastes')
        .delete()
        .in('id', expiredPastes.map(p => p.id));

      if (deleteError) {
        console.error('Error deleting expired pastes:', deleteError);
        throw deleteError;
      }

      console.log(`Deleted ${expiredPastes.length} expired pastes`);
    }

    // Delete pastes that were marked as burn-after-reading and have been viewed
    const { data: burnedPastes, error: burnSelectError } = await supabase
      .from('pastes')
      .select('id, is_file, file_name')
      .eq('burn_after_reading', true)
      .eq('viewed', true);

    if (burnSelectError) {
      console.error('Error fetching burned pastes:', burnSelectError);
      throw burnSelectError;
    }

    if (burnedPastes && burnedPastes.length > 0) {
      // Delete files from storage first
      for (const paste of burnedPastes) {
        if (paste.is_file && paste.file_name) {
          console.log(`Deleting burned file: ${paste.file_name}`);
          const { error: storageError } = await supabase.storage
            .from('encrypted-files')
            .remove([paste.file_name]);
          
          if (storageError) {
            console.error(`Error deleting burned file ${paste.file_name}:`, storageError);
          }
        }
      }

      const { error: burnDeleteError } = await supabase
        .from('pastes')
        .delete()
        .in('id', burnedPastes.map(p => p.id));

      if (burnDeleteError) {
        console.error('Error deleting burned pastes:', burnDeleteError);
        throw burnDeleteError;
      }

      console.log(`Deleted ${burnedPastes.length} burned pastes`);
    }

    const totalDeleted = (expiredPastes?.length || 0) + (burnedPastes?.length || 0);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: totalDeleted,
        expired: expiredPastes?.length || 0,
        burned: burnedPastes?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Cleanup function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});