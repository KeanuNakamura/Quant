// Gemini API Test Script
// Run this in browser console to test your API key

const testGeminiAPI = async () => {
  const API_KEY = 'AIzaSyAAaKpV6kKAtMYFDX_KS6D4rWiSF_PXNFE';
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  console.log('Testing Gemini API...');
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET');
  
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Hello, please respond with "API is working"'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 50,
        }
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Success! API Response:', data);
    
    if (data.candidates && data.candidates[0]) {
      console.log('AI Response:', data.candidates[0].content.parts[0].text);
    }
    
  } catch (error) {
    console.error('Gemini API Test Failed:', error);
  }
};

// Run the test
testGeminiAPI();