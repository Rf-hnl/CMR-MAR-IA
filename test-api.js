// Test API endpoint directly
async function testAPI() {
  try {
    console.log('🧪 Testing data-sources API...');
    
    const testData = {
      organizationId: 'test-org-id',
      source: 'file-import'
    };
    
    console.log('📤 Request data:', testData);
    
    const response = await fetch('http://localhost:3047/api/data-sources/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    try {
      const parsedResponse = JSON.parse(responseText);
      console.log('✅ Parsed response:', parsedResponse);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:', e);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testAPI();