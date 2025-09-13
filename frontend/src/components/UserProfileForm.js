import React from 'react';

const UserProfileForm = ({ profile, setProfile, onSubmit, loading }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile({
      ...profile,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div>
        <label htmlFor="risk_score" className="block text-sm font-medium text-gray-700 mb-1">
          Risk Tolerance (1-10)
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            id="risk_score"
            name="risk_score"
            min="1"
            max="10"
            value={profile.risk_score}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-md w-8 text-center">
            {profile.risk_score}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Conservative</span>
          <span>Aggressive</span>
        </div>
      </div>

      <div>
        <label htmlFor="diversification" className="block text-sm font-medium text-gray-700 mb-1">
          Diversification Preference
        </label>
        <select
          id="diversification"
          name="diversification"
          value={profile.diversification}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="concentrated">Concentrated</option>
          <option value="balanced">Balanced</option>
          <option value="diversified">Diversified</option>
        </select>
      </div>

      <div>
        <label htmlFor="horizon_years" className="block text-sm font-medium text-gray-700 mb-1">
          Investment Horizon (years)
        </label>
        <input
          type="number"
          id="horizon_years"
          name="horizon_years"
          min="1"
          max="30"
          value={profile.horizon_years}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="capital_usd" className="block text-sm font-medium text-gray-700 mb-1">
          Capital Amount (USD)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="capital_usd"
            name="capital_usd"
            min="1000"
            step="1000"
            value={profile.capital_usd}
            onChange={handleChange}
            className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="automation_enabled"
          name="automation_enabled"
          type="checkbox"
          checked={profile.automation_enabled}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="automation_enabled" className="ml-2 block text-sm text-gray-700">
          Enable Automation
        </label>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Get Recommendation'}
        </button>
      </div>
    </form>
  );
};

export default UserProfileForm;