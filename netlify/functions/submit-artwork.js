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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Verify this is a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    console.log('Received artwork submission:', data);
    
    // Log field names for SQL schema verification
    console.log('Fields being mapped to SQL schema:', Object.keys(data).join(', '));

    // Minimal validation
    if (!data.user_id || !data.title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Ensure status is set to pending
    data.status = 'pending';

    // Insert the artwork using the admin client to bypass RLS
    const { data: artwork, error } = await supabaseAdmin
      .from('artworks')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error inserting artwork:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    // Log the successful insert
    console.log('Successfully inserted artwork with ID:', artwork.id);
    console.log('SQL fields populated:', Object.keys(artwork).join(', '));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, artwork })
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