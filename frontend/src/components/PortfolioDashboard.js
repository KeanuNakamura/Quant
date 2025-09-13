import React from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const PortfolioDashboard = ({ recommendation }) => {
  // Generate random colors for pie chart
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

  // Prepare data for line chart (mock data for comparison)
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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Recommended Portfolio</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Asset Allocation</h3>
          <div className="h-64">
            <Pie data={pieData} />
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Performance Projection</h3>
          <div className="h-64">
            <Line options={lineOptions} data={lineData} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium text-blue-700 mb-1">Expected Annual Return</h3>
          <p className="text-2xl font-bold text-blue-900">{(recommendation.expected_return * 100).toFixed(2)}%</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium text-orange-700 mb-1">Annual Volatility</h3>
          <p className="text-2xl font-bold text-orange-900">{(recommendation.volatility * 100).toFixed(2)}%</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <h3 className="text-sm font-medium text-red-700 mb-1">Maximum Drawdown</h3>
          <p className="text-2xl font-bold text-red-900">{(recommendation.max_drawdown * 100).toFixed(2)}%</p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-3">Backtest Results (10 Years)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white rounded shadow-sm">
            <p className="text-sm text-gray-500">CAGR</p>
            <p className="text-xl font-semibold">{(recommendation.backtest.cagr * 100).toFixed(2)}%</p>
          </div>
          <div className="p-3 bg-white rounded shadow-sm">
            <p className="text-sm text-gray-500">Sharpe Ratio</p>
            <p className="text-xl font-semibold">{recommendation.backtest.sharpe.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-white rounded shadow-sm">
            <p className="text-sm text-gray-500">Backtest Period</p>
            <p className="text-xl font-semibold">{recommendation.backtest.years} years</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Investment Rationale</h3>
        <ul className="list-disc pl-5 space-y-1">
          {recommendation.rationale.map((reason, index) => (
            <li key={index} className="text-gray-700">{reason}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PortfolioDashboard;