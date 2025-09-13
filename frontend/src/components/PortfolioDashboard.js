import React, { useState } from 'react';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  BarElement,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const PortfolioDashboard = ({ recommendation }) => {
  // State for active visualization tab
  const [activeTab, setActiveTab] = useState('allocation'); // 'allocation', 'performance', 'metrics'
  
  // Generate random colors for charts
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137) % 360; // Use golden angle approximation for even distribution
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
  };

  // Prepare data for pie chart
  const pieData = {
    labels: recommendation.portfolio.map(asset => asset.ticker),
    datasets: [
      {
        data: recommendation.portfolio.map(asset => asset.weight * 100),
        backgroundColor: generateColors(recommendation.portfolio.length),
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for line chart (projected performance)
  const lineData = {
    labels: Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`),
    datasets: [
      {
        label: 'Your Portfolio',
        data: Array.from({ length: 12 }, (_, i) => 100 * (1 + recommendation.expected_return / 12 * i)),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'S&P 500',
        data: Array.from({ length: 12 }, (_, i) => 100 * (1 + 0.08 / 12 * i)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };
  
  // Prepare data for bar chart (risk metrics)
  const barData = {
    labels: ['Volatility', 'Max Drawdown', 'Sharpe Ratio'],
    datasets: [
      {
        label: 'Your Portfolio',
        data: [
          recommendation.volatility * 100,
          recommendation.max_drawdown * 100,
          recommendation.backtest.sharpe
        ],
        backgroundColor: 'rgba(53, 162, 235, 0.7)',
      },
      {
        label: 'Market Average',
        data: [15, 20, 1.0], // Example market averages
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Projected Performance (1 Year)',
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  // Tab navigation handler
  const renderTabContent = () => {
    switch(activeTab) {
      case 'allocation':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Allocation Pie Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Asset Allocation</h3>
              <div className="h-64">
                <Pie data={pieData} />
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Allocation Details</h3>
              <div className="space-y-2">
                 {recommendation.allocation.map((asset, index) => (
                   <div key={index} className="flex justify-between items-center border-b pb-1">
                     <span className="font-medium">{asset.asset || asset.ticker}</span>
                     <span className="text-blue-600 font-semibold">{(asset.weight * 100).toFixed(1)}%</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        );
        
      case 'performance':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Projection Line Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Performance Projection</h3>
              <div className="h-64">
                <Line options={lineOptions} data={lineData} />
              </div>
            </div>
            
            {/* Backtest Results */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Backtest Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">CAGR</h4>
                  <p className="text-lg font-semibold">{(recommendation.backtest.cagr * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Sharpe Ratio</h4>
                  <p className="text-lg font-semibold">{recommendation.backtest.sharpe.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Years</h4>
                  <p className="text-lg font-semibold">{recommendation.backtest.years}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Max Drawdown</h4>
                  <p className="text-lg font-semibold">{(recommendation.max_drawdown * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'metrics':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Metrics Bar Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Risk Metrics</h3>
              <div className="h-64">
                <Bar data={barData} />
              </div>
            </div>
            
            {/* Investment Rationale */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Investment Rationale</h3>
              <ul className="list-disc pl-5 space-y-1">
                {recommendation.rationale.map((point, index) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          </div>
        );
        
      default:
        return <div>Select a tab to view portfolio details</div>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Portfolio Dashboard</h2>
      
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Expected Return</h3>
          <p className="text-2xl font-bold text-blue-900">{(recommendation.expected_return * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Volatility</h3>
          <p className="text-2xl font-bold text-green-900">{(recommendation.volatility * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800">Sharpe Ratio</h3>
          <p className="text-2xl font-bold text-purple-900">{recommendation.backtest.sharpe.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800">Max Drawdown</h3>
          <p className="text-2xl font-bold text-yellow-900">{(recommendation.max_drawdown * 100).toFixed(2)}%</p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'allocation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('allocation')}
        >
          Asset Allocation
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'performance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'metrics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('metrics')}
        >
          Risk Metrics
        </button>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default PortfolioDashboard;