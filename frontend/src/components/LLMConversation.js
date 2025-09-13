import React, { useState, useRef, useEffect } from 'react';

const LLMConversation = ({ onDataCollected }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Collected investment profile data
  const [collectedData, setCollectedData] = useState({
    user_id: 'demo',
    risk_score: null,
    diversification: null,
    horizon_years: null,
    capital_usd: null,
    automation_enabled: null
  });

  // Gemini API configuration
  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  // System prompt for investment profiling
  const systemPrompt = `You are a professional investment advisor helping users create their investment profile. Your goal is to collect the following information through natural conversation:

1. Risk tolerance (scale 1-10, where 1 is very conservative, 10 is very aggressive)
2. Diversification preference (concentrated, balanced, or diversified)  
3. Investment horizon in years
4. Capital amount in USD
5. Automation preference (yes/no for automated rebalancing)

Guidelines:
- Ask ONE question at a time
- Be conversational and friendly
- Explain investment concepts when needed
- Keep responses concise (2-3 sentences max)
- When you have all 5 pieces of information, summarize the profile and end with "PROFILE_COMPLETE"

Start by introducing yourself and asking about their risk tolerance.`;

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call Gemini API
  const callGeminiAPI = async (userMessage, conversationHistory) => {
    console.log('🔑 API Key check:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file.');
    }

    const prompt = userMessage ? 
      `${systemPrompt}\n\nConversation history:\n${conversationHistory}\n\nUser: ${userMessage}\n\nAssistant:` :
      `${systemPrompt}\n\nAssistant:`;

    console.log('🚀 Making API call to:', GEMINI_API_URL);
    console.log('📝 Prompt length:', prompt.length);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          }
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response received:', data);
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  // Parse profile data from AI response
  const parseProfileData = (message) => {
    const updates = {};
    
    // Extract risk score (1-10)
    const riskMatch = message.match(/risk.*?(\d{1,2})/i);
    if (riskMatch) {
      const risk = parseInt(riskMatch[1]);
      if (risk >= 1 && risk <= 10) {
        updates.risk_score = risk;
      }
    }

    // Extract diversification preference
    if (message.toLowerCase().includes('concentrated')) {
      updates.diversification = 'concentrated';
    } else if (message.toLowerCase().includes('diversified')) {
      updates.diversification = 'diversified';
    } else if (message.toLowerCase().includes('balanced')) {
      updates.diversification = 'balanced';
    }

    // Extract investment horizon
    const yearMatch = message.match(/(\d+).*?year/i);
    if (yearMatch) {
      updates.horizon_years = parseInt(yearMatch[1]);
    }

    // Extract capital amount
    const capitalMatch = message.match(/\$?([\d,]+)/);
    if (capitalMatch) {
      const capital = parseInt(capitalMatch[1].replace(/,/g, ''));
      if (capital >= 1000) {
        updates.capital_usd = capital;
      }
    }

    // Extract automation preference
    if (message.toLowerCase().includes('yes') || 
        message.toLowerCase().includes('enable') || 
        message.toLowerCase().includes('automat')) {
      updates.automation_enabled = true;
    } else if (message.toLowerCase().includes('no') || 
               message.toLowerCase().includes('disable') || 
               message.toLowerCase().includes('manual')) {
      updates.automation_enabled = false;
    }

    return updates;
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || loading || conversationComplete) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Build conversation history
      const history = messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Get AI response
      const aiResponse = await callGeminiAPI(userMessage, history);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Parse any profile data from user message
      const userUpdates = parseProfileData(userMessage);
      if (Object.keys(userUpdates).length > 0) {
        setCollectedData(prev => ({ ...prev, ...userUpdates }));
      }

      // Check if conversation is complete
      if (aiResponse.includes('PROFILE_COMPLETE')) {
        setConversationComplete(true);
        onDataCollected(collectedData);
      }

    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${err.message}. Please try again.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (messages.length === 0) {
        setLoading(true);
        try {
          const greeting = await callGeminiAPI(null, '');
          setMessages([{ role: 'assistant', content: greeting }]);
        } catch (err) {
          setError(err.message);
          setMessages([{ 
            role: 'assistant', 
            content: `Hello! I'm your investment advisor. However, I'm having trouble connecting to my AI service right now. Error: ${err.message}` 
          }]);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeConversation();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <br />
            <small>Make sure your Gemini API key is configured in the .env file.</small>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-3/4 p-3 rounded-lg ${message.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || conversationComplete}
            placeholder={conversationComplete ? "Conversation completed" : "Type your response..."}
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={loading || conversationComplete || !input.trim()}
            className={`rounded-full p-2 ${loading || conversationComplete || !input.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LLMConversation;