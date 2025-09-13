import { useState } from "react";
import UserProfileForm from "./components/UserProfileForm";
import PortfolioDashboard from "./components/PortfolioDashboard";
import Header from "./components/Header";

export default function App() {
  const [profile, setProfile] = useState({
    user_id: "demo",
    risk_score: 5,
    diversification: "balanced",
    horizon_years: 5,
    capital_usd: 10000,
    automation_enabled: false
  });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/recommendation", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(profile)
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      setRecommendation(data);
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setError(err.message || "Failed to get recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Investment Profile</h2>
            <UserProfileForm 
              profile={profile} 
              setProfile={setProfile} 
              onSubmit={getRecommendation}
              loading={loading}
            />
          </div>
          
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
              <PortfolioDashboard recommendation={recommendation} />
            ) : (
              <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg">Complete your profile and click "Get Recommendation" to see your personalized portfolio</p>
              </div>
            )}
          </div>
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