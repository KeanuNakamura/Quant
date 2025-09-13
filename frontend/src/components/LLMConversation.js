import React, { useState, useRef, useEffect } from 'react';

const LLMConversation = ({ onDataCollected }) => {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello! I\'m here to help you with your investment profile. I\'ll ask you a few questions to understand your investment preferences better.'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsCompleted, setQuestionsCompleted] = useState(false);
  const messagesEndRef = useRef(null);

  // Questions to ask the user
  const questions = [
    'What is your risk tolerance on a scale of 1-10? (1 being very conservative, 10 being very aggressive)',
    'What is your preferred diversification strategy? (concentrated, balanced, or diversified)',
    'How many years are you planning to invest for?',
    'How much capital (in USD) are you planning to invest?',
    'Would you like to enable automated portfolio rebalancing?'
  ];

  // Current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Collected data
  const [collectedData, setCollectedData] = useState({
    user_id: 'demo',
    risk_score: null,
    diversification: null,
    horizon_years: null,
    capital_usd: null,
    automation_enabled: null
  });

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ask the next question
  const askNextQuestion = () => {
    if (currentQuestionIndex < questions.length) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: questions[currentQuestionIndex]
        }]);
        setLoading(false);
      }, 1000);
    } else {
      // All questions answered
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Thank you for providing all the information! I\'ll now generate your investment profile.'
        }]);
        setQuestionsCompleted(true);
        setLoading(false);
        // Pass the collected data to parent component
        onDataCollected(collectedData);
      }, 1000);
    }
  };

  // Process user response
  const processResponse = (userMessage) => {
    switch (currentQuestionIndex) {
      case 0: // Risk tolerance
        const riskScore = parseInt(userMessage.match(/\d+/)?.[0] || '5');
        setCollectedData(prev => ({ ...prev, risk_score: Math.min(Math.max(riskScore, 1), 10) }));
        break;
      case 1: // Diversification
        let diversification = 'balanced';
        if (userMessage.toLowerCase().includes('concentrated')) {
          diversification = 'concentrated';
        } else if (userMessage.toLowerCase().includes('diversified')) {
          diversification = 'diversified';
        }
        setCollectedData(prev => ({ ...prev, diversification }));
        break;
      case 2: // Investment horizon
        const years = parseInt(userMessage.match(/\d+/)?.[0] || '5');
        setCollectedData(prev => ({ ...prev, horizon_years: Math.max(years, 1) }));
        break;
      case 3: // Capital amount
        const capital = parseInt(userMessage.replace(/[^0-9]/g, '') || '10000');
        setCollectedData(prev => ({ ...prev, capital_usd: Math.max(capital, 1000) }));
        break;
      case 4: // Automation
        const automation = userMessage.toLowerCase().includes('yes') || 
                          userMessage.toLowerCase().includes('enable') || 
                          userMessage.toLowerCase().includes('true');
        setCollectedData(prev => ({ ...prev, automation_enabled: automation }));
        break;
      default:
        break;
    }
    setCurrentQuestionIndex(prev => prev + 1);
  };

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === '' || loading || questionsCompleted) return;

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setLoading(true);
    
    // Process the response
    processResponse(input);
    setInput('');
    
    // Ask the next question
    askNextQuestion();
  };

  // Start the conversation by asking the first question
  useEffect(() => {
    if (messages.length === 1) {
      askNextQuestion();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || questionsCompleted}
            placeholder={questionsCompleted ? "Conversation completed" : "Type your response..."}
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || questionsCompleted}
            className={`rounded-full p-2 ${loading || questionsCompleted 
              ? 'bg-gray-300 text-gray-500' 
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