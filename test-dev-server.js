// Simple test script to verify Netlify dev server is working
const fetch = require('node-fetch');

async function testDevServer() {
  try {
    console.log('Testing Netlify dev server...');
    
    // Test OPTIONS request
    const optionsResponse = await fetch('http://localhost:9000/.netlify/functions/submit-artwork', {
      method: 'OPTIONS'
    });
    console.log('OPTIONS response status:', optionsResponse.status);
    
    // Test admin artworks endpoint
    console.log('\nTesting admin artworks endpoint...');
    const adminResponse = await fetch('http://localhost:9000/.netlify/functions/admin-artworks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Admin GET response status:', adminResponse.status);
    
    if (adminResponse.ok) {
      const adminResult = await adminResponse.json();
      console.log('Admin artworks count:', adminResult.length);
      console.log('✅ Admin endpoint is working correctly!');
    } else {
      const errorText = await adminResponse.text();
      console.log('❌ Admin GET failed:', errorText);
    }
    
    // Test basic POST with minimal data (will fail due to UUID but proves server works)
    console.log('\nTesting POST endpoint (expected to fail due to test UUID)...');
    const testData = {
      user_id: 'test-user-id',
      title: 'Test Artwork',
      description: 'Test description',
      price: 100,
      category: 'paintings',
      artist_name: 'Test Artist',
      location: 'Test Location',
      status: 'pending'
    };
    
    const postResponse = await fetch('http://localhost:9000/.netlify/functions/submit-artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('POST response status:', postResponse.status);
    
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('POST response body:', result);
      console.log('✅ Dev server is working correctly!');
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST failed (expected):', errorText);
      console.log('✅ Dev server is responding correctly!');
    }
    
  } catch (error) {
    console.error('❌ Dev server test failed:', error.message);
  }
}

testDevServer(); 