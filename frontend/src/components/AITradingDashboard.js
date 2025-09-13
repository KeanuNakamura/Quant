import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const INITIAL_CAPITAL = 100000;
const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' }
];

export default function AITradingDashboard() {
  const [sessionStart] = useState(new Date());
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [portfolioValue, setPortfolioValue] = useState(INITIAL_CAPITAL);
  const [cashBalance, setCashBalance] = useState(INITIAL_CAPITAL * 0.3);
  const [totalGainLoss, setTotalGainLoss] = useState(0);
  const [totalGainLossPercent, setTotalGainLossPercent] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [trades, setTrades] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  // Initialize stocks with random positions
  useEffect(() => {
    const initialStocks = STOCK_SYMBOLS.slice(0, 5).map(stock => {
      const basePrice = 100 + Math.random() * 400;
      const shares = Math.floor(Math.random() * 50) + 10;
      const currentPrice = basePrice * (0.95 + Math.random() * 0.1);
      const totalValue = shares * currentPrice;
      const profitLoss = (currentPrice - basePrice) * shares;
      const profitLossPercent = ((currentPrice - basePrice) / basePrice) * 100;
      
      return {
        symbol: stock.symbol,
        name: stock.name,
        shares,
        avgPrice: basePrice,
        currentPrice,
        dailyChange: (Math.random() - 0.5) * 10,
        totalValue,
        profitLoss,
        profitLossPercent,
        aiSignal: 'HOLD'
      };
    });
    setStocks(initialStocks);
    
    // Initialize chart with starting value
    setChartData([{
      time: new Date().toLocaleTimeString(),
      value: INITIAL_CAPITAL,
      baseline: INITIAL_CAPITAL
    }]);
  }, []);

  // AI Trading Logic
  const executeAITrade = useCallback((currentStocks) => {
    const updatedStocks = [...currentStocks];
    let newCashBalance = cashBalance;
    let tradeExecuted = false;
    
    updatedStocks.forEach((stock, index) => {
      const momentum = (Math.random() - 0.5) * 2;
      const volatility = Math.random();
      
      // AI decision logic based on momentum and volatility
      if (momentum > 0.3 && volatility < 0.7 && newCashBalance > stock.currentPrice * 10) {
        // BUY signal
        stock.aiSignal = 'BUY';
        if (Math.random() > 0.5) {
          const sharesToBuy = Math.floor(Math.random() * 10) + 5;
          const cost = sharesToBuy * stock.currentPrice;
          if (newCashBalance >= cost) {
            stock.shares += sharesToBuy;
            stock.avgPrice = ((stock.avgPrice * (stock.shares - sharesToBuy)) + cost) / stock.shares;
            newCashBalance -= cost;
            tradeExecuted = true;
          }
        }
      } else if (momentum < -0.3 && stock.shares > 0) {
        // SELL signal
        stock.aiSignal = 'SELL';
        if (Math.random() > 0.5) {
          const sharesToSell = Math.min(Math.floor(Math.random() * 10) + 1, stock.shares);
          const revenue = sharesToSell * stock.currentPrice;
          stock.shares -= sharesToSell;
          newCashBalance += revenue;
          tradeExecuted = true;
          
          // Track wins/losses
          if (stock.currentPrice > stock.avgPrice) {
            setWins(w => w + 1);
          } else {
            setLosses(l => l + 1);
          }
        }
      } else {
        stock.aiSignal = 'HOLD';
      }
    });
    
    if (tradeExecuted) {
      setTrades(t => t + 1);
      setCashBalance(newCashBalance);
    }
    
    return updatedStocks;
  }, [cashBalance]);

  // Update stock prices and portfolio value
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => {
        const updatedStocks = prevStocks.map(stock => {
          // Simulate price movement
          const priceChange = (Math.random() - 0.5) * 4;
          const newPrice = Math.max(stock.currentPrice * (1 + priceChange / 100), 1);
          const newDailyChange = ((newPrice - stock.avgPrice) / stock.avgPrice) * 100;
          const newTotalValue = stock.shares * newPrice;
          const newProfitLoss = (newPrice - stock.avgPrice) * stock.shares;
          const newProfitLossPercent = ((newPrice - stock.avgPrice) / stock.avgPrice) * 100;
          
          return {
            ...stock,
            currentPrice: newPrice,
            dailyChange: newDailyChange,
            totalValue: newTotalValue,
            profitLoss: newProfitLoss,
            profitLossPercent: newProfitLossPercent
          };
        });
        
        // Execute AI trades occasionally
        if (Math.random() > 0.7) {
          return executeAITrade(updatedStocks);
        }
        
        return updatedStocks;
      });
      
      // Update portfolio value
      setStocks(currentStocks => {
        const stocksValue = currentStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
        const newPortfolioValue = stocksValue + cashBalance;
        setPortfolioValue(newPortfolioValue);
        setTotalGainLoss(newPortfolioValue - INITIAL_CAPITAL);
        setTotalGainLossPercent(((newPortfolioValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100);
        
        // Update chart data
        setChartData(prev => {
          const newData = [...prev, {
            time: new Date().toLocaleTimeString(),
            value: newPortfolioValue,
            baseline: INITIAL_CAPITAL
          }];
          return newData.slice(-30); // Keep last 30 data points
        });
        
        return currentStocks;
      });
      
      // Update win rate
      if (wins + losses > 0) {
        setWinRate((wins / (wins + losses)) * 100);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cashBalance, wins, losses, executeAITrade]);

  // Update session duration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - sessionStart.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setSessionDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionStart]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Trading System</h1>
          <p className="text-gray-400">Autonomous trading powered by artificial intelligence</p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Portfolio Value</p>
            <p className="text-3xl font-bold">${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Total Gain/Loss</p>
            <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}
              ${totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm mt-1 ${totalGainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Win Rate</p>
            <p className="text-3xl font-bold">{winRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-400 mt-1">{wins}W / {losses}L</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Session Duration</p>
            <p className="text-3xl font-bold">{sessionDuration}</p>
            <p className="text-sm text-gray-400 mt-1">{trades} trades</p>
          </div>
        </div>
        
        {/* Performance Chart */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 1000', 'dataMax + 1000']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <ReferenceLine y={INITIAL_CAPITAL} stroke="#6B7280" strokeDasharray="5 5" />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Active Positions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Active Positions</h2>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">AI Trading Active</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Shares</th>
                  <th className="pb-3">Avg Price</th>
                  <th className="pb-3">Current Price</th>
                  <th className="pb-3">Total Value</th>
                  <th className="pb-3">P/L</th>
                  <th className="pb-3">P/L %</th>
                  <th className="pb-3">AI Signal</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.symbol} className="border-b border-gray-700">
                    <td className="py-3">
                      <div>
                        <p className="font-semibold">{stock.symbol}</p>
                        <p className="text-sm text-gray-400">{stock.name}</p>
                      </div>
                    </td>
                    <td className="py-3">{stock.shares}</td>
                    <td className="py-3">${stock.avgPrice.toFixed(2)}</td>
                    <td className="py-3">${stock.currentPrice.toFixed(2)}</td>
                    <td className="py-3">${stock.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={`py-3 ${stock.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.profitLoss >= 0 ? '+' : ''}
                      ${stock.profitLoss.toFixed(2)}
                    </td>
                    <td className={`py-3 ${stock.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.profitLossPercent >= 0 ? '+' : ''}
                      {stock.profitLossPercent.toFixed(2)}%
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        stock.aiSignal === 'BUY' ? 'bg-green-900 text-green-300' :
                        stock.aiSignal === 'SELL' ? 'bg-red-900 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {stock.aiSignal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Cash Balance</p>
              <p className="text-xl font-semibold">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Invested</p>
              <p className="text-xl font-semibold">
                ${stocks.reduce((sum, stock) => sum + stock.totalValue, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}