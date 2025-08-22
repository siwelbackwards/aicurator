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

    // GET - Fetch all trending products with artwork details
    if (method === 'GET') {
      const { data: trendingProducts, error } = await supabaseAdmin
        .from('admin_trending_products')
        .select(`
          *,
          artwork:artworks(
            id,
            title,
            artist_name,
            price,
            currency,
            description,
            category,
            status,
            artwork_images!artwork_images_artwork_id_fkey(file_path, is_primary)
          )
        `)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching trending products:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      // Process the data to flatten artwork images
      const processedData = (trendingProducts || []).map(tp => ({
        ...tp,
        artwork: tp.artwork ? {
          ...tp.artwork,
          primary_image_path: tp.artwork.artwork_images?.find(img => img.is_primary)?.file_path,
          image_paths: tp.artwork.artwork_images?.map(img => img.file_path) || []
        } : null
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(processedData)
      };
    }

    // POST - Create new trending product
    if (method === 'POST') {
      const { artwork_id, display_order } = JSON.parse(event.body);

      const { data: newProduct, error } = await supabaseAdmin
        .from('admin_trending_products')
        .insert([{
          artwork_id,
          display_order: display_order || 1
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating trending product:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newProduct)
      };
    }

    // PUT - Update trending product
    if (method === 'PUT') {
      const { id, display_order, is_active } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Product ID is required for updates' })
        };
      }

      const updateData = {};
      if (display_order !== undefined) updateData.display_order = display_order;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: updatedProduct, error } = await supabaseAdmin
        .from('admin_trending_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating trending product:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedProduct)
      };
    }

    // DELETE - Delete trending product
    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Product ID is required for deletion' })
        };
      }

      const { error } = await supabaseAdmin
        .from('admin_trending_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting trending product:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Product removed from trending list' })
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
