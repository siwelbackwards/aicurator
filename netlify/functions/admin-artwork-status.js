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
    const { id, status } = JSON.parse(event.body);
    
    if (!id || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Only allow valid status values
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid status value' })
      };
    }

    // Update the artwork status
    const { data, error } = await supabaseAdmin
      .from('artworks')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating artwork status:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, artwork: data })
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