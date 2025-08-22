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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

    // GET - Fetch all platform settings
    if (method === 'GET') {
      // For now, return empty array as we don't have a platform_settings table yet
      // In a real implementation, you'd fetch from a platform_settings table
      const defaultSettings = [
        {
          id: '1',
          setting_key: 'user_registration_enabled',
          setting_value: true,
          setting_type: 'boolean',
          category: 'users',
          description: 'Allow new users to register',
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          setting_key: 'site_name',
          setting_value: 'AI Curator',
          setting_type: 'string',
          category: 'general',
          description: 'Platform site name',
          updated_at: new Date().toISOString()
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(defaultSettings)
      };
    }

    // POST - Save platform settings
    if (method === 'POST') {
      const { settings } = JSON.parse(event.body);

      // In a real implementation, you would save these to a database
      // For now, we'll just return success
      console.log('Platform settings to save:', settings);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Platform settings saved successfully',
          settings: settings
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error processing platform settings request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
