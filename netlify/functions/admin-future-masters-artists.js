const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    const method = event.httpMethod;

    // GET - Fetch all future masters artists
    if (method === 'GET') {
      const { data: artists, error } = await supabaseAdmin
        .from('future_masters_artists')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching future masters artists:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(artists || [])
      };
    }

    // POST - Create new artist
    if (method === 'POST') {
      const artistData = JSON.parse(event.body);

      const { data: newArtist, error } = await supabaseAdmin
        .from('future_masters_artists')
        .insert([artistData])
        .select()
        .single();

      if (error) {
        console.error('Error creating future masters artist:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newArtist)
      };
    }

    // PUT - Update artist
    if (method === 'PUT') {
      const { id, ...updateData } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Artist ID is required for updates' })
        };
      }

      const { data: updatedArtist, error } = await supabaseAdmin
        .from('future_masters_artists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating future masters artist:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedArtist)
      };
    }

    // DELETE - Delete artist
    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Artist ID is required for deletion' })
        };
      }

      const { error } = await supabaseAdmin
        .from('future_masters_artists')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting future masters artist:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Artist deleted successfully' })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
