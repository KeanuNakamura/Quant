import { useState } from "react";
import UserProfileForm from "./components/UserProfileForm";
import PortfolioDashboard from "./components/PortfolioDashboard";
import Header from "./components/Header";
import LLMConversation from "./components/LLMConversation";
import AITradingDashboard from "./components/AITradingDashboard";
import { processAndSaveUserProfile } from "./utils/csvGenerator";

export default function App() {
  // State for workflow stages
  const [currentStage, setCurrentStage] = useState('form'); // 'form', 'conversation', 'processing', 'results', 'trading'
  
  // User profile data
  const [profile, setProfile] = useState({
    user_id: "demo",
    risk_score: 5,
    diversification: "balanced",
    horizon_years: 5,
    capital_usd: 10000,
    automation_enabled: false
  });
  
  // Recommendation data
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle data collected from LLM conversation
  const handleDataCollected = (data) => {
    setProfile(data);
    
    // Generate and save CSV
    processAndSaveUserProfile(data);
    
    // Move to processing stage
    setCurrentStage('processing');
    
    // Get recommendation based on the data
    getRecommendation(data);
  };

  // Get recommendation from API
  const getRecommendation = async (profileData = profile) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate processing delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const res = await fetch("http://localhost:8000/recommendation", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(profileData)
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      setRecommendation(data);
      
      // Move to results stage
      setCurrentStage('results');
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setError(err.message || "Failed to get recommendation");
    } finally {
      setLoading(false);
    }
  };

  // Start LLM conversation
  const startConversation = () => {
    setCurrentStage('conversation');
  };
  
  // Render content based on current stage
  const renderContent = () => {
    switch (currentStage) {
      case 'form':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Create Your Investment Profile</h2>
            <UserProfileForm 
              profile={profile} 
              setProfile={setProfile} 
              onSubmit={() => getRecommendation()} 
              loading={loading} 
              onStartConversation={startConversation}
            />
          </div>
        );
        
      case 'conversation':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md h-[600px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Chat with QuantEase Assistant</h2>
            <div className="flex-1 overflow-hidden">
              <LLMConversation onDataCollected={handleDataCollected} />
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Processing Your Investment Profile</h2>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-lg text-gray-600">Analyzing your preferences and generating optimal portfolio...</p>
              <div className="mt-8 w-full max-w-md bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <p className="mt-2 text-sm text-gray-500">This may take a few moments</p>
            </div>
          </div>
        );
        
      case 'results':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : recommendation ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Your Investment Recommendation</h2>
                <PortfolioDashboard recommendation={recommendation} />
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-md font-medium text-blue-800 mb-2">Data Processing Complete</h3>
                  <p className="text-sm text-blue-600">Your investment profile has been saved as a CSV file. You can use this data for future reference.</p>
                </div>
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setCurrentStage('trading')}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                  >
                    🚀 Launch AI Trading Dashboard
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg">Something went wrong. Please try again.</p>
              </div>
            )}
          </div>
        );
        
      case 'trading':
        return <AITradingDashboard />;
        
      default:
        return null;
    }
  };

  // Render profile summary when in results stage
  const renderProfileSummary = () => {
    if (currentStage !== 'results' || !profile) return null;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Your Investment Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Risk Tolerance</p>
            <p className="text-lg font-medium">{profile.risk_score}/10</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Diversification</p>
            <p className="text-lg font-medium capitalize">{profile.diversification}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Investment Horizon</p>
            <p className="text-lg font-medium">{profile.horizon_years} years</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Capital</p>
            <p className="text-lg font-medium">${profile.capital_usd.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Automation</p>
          <p className="text-lg font-medium">{profile.automation_enabled ? 'Enabled' : 'Disabled'}</p>
        </div>
        <button 
          onClick={() => setCurrentStage('conversation')} 
          className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Start New Conversation
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {currentStage === 'results' ? renderProfileSummary() : null}
          {renderContent()}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2023 QuantEase - Democratized Quant Trading Assistant</p>
        </div>
      </footer>
    </div>
  );
}