const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = 9000;

// Configure CORS with proper options
const corsOptions = {
  origin: '*', // In development, allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Enable CORS with the options
app.use(cors(corsOptions));
app.use(express.json());

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Log requests
app.use((req, res, next) => {
  console.log(`[DEV SERVER] ${req.method} ${req.path}`);
  // Log headers for debugging authorization issues
  if (req.path.includes('admin')) {
    console.log('[DEV SERVER] Headers:', JSON.stringify(req.headers));
  }
  next();
});

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Submit artwork function
app.post('/.netlify/functions/submit-artwork', async (req, res) => {
  try {
    const data = req.body;
    console.log('[DEV SERVER] Received artwork submission:', data);
    
    // Log field names for SQL schema verification
    console.log('[DEV SERVER] Fields being mapped to SQL schema:', Object.keys(data).join(', '));

    // Minimal validation
    if (!data.user_id || !data.title) {
      return res.status(400).json({ error: 'Missing required fields' });
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
      console.error('[DEV SERVER] Error inserting artwork:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Log the successful insert
    console.log('[DEV SERVER] Successfully inserted artwork with ID:', artwork.id);
    console.log('[DEV SERVER] SQL fields populated:', Object.keys(artwork).join(', '));

    return res.status(200).json({ success: true, artwork });
  } catch (error) {
    console.error('[DEV SERVER] Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Artwork images function
app.post('/.netlify/functions/artwork-images', async (req, res) => {
  try {
    const requestData = req.body;
    console.log('[DEV SERVER] Received artwork images:', requestData);

    if (!requestData.images || !Array.isArray(requestData.images) || requestData.images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    // Insert the artwork images using the admin client
    const { data, error } = await supabaseAdmin
      .from('artwork_images')
      .insert(requestData.images);

    if (error) {
      console.error('[DEV SERVER] Error inserting artwork images:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, count: requestData.images.length });
  } catch (error) {
    console.error('[DEV SERVER] Error processing image request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin artworks function - to list all artworks for admin
app.get('/.netlify/functions/admin-artworks', async (req, res) => {
  try {
    console.log('[DEV SERVER] Admin artworks request received');
    
    // Fetch all artworks from the database
    const { data: artworks, error } = await supabaseAdmin
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DEV SERVER] Error fetching artworks:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[DEV SERVER] Returning ${artworks?.length || 0} artworks`);
    return res.status(200).json(artworks || []);
  } catch (error) {
    console.error('[DEV SERVER] Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin artwork status function - to update artwork status
app.post('/.netlify/functions/admin-artwork-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    console.log(`[DEV SERVER] Admin artwork status update: ${id} -> ${status}`);
    
    if (!id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Only allow valid status values
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Update the artwork status
    const { data, error } = await supabaseAdmin
      .from('artworks')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DEV SERVER] Error updating artwork status:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, artwork: data });
  } catch (error) {
    console.error('[DEV SERVER] Error processing status update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`[DEV SERVER] Development server running at http://localhost:${port}`);
  console.log(`[DEV SERVER] Netlify Functions proxy available at http://localhost:${port}/.netlify/functions/`);
}); 