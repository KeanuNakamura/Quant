import pandas as pd
import numpy as np
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import matplotlib.pyplot as plt
from typing import Dict, List, Any, Tuple

class TradingStrategy:
    def __init__(self, ticker="SPY", start_date="2018-01-01", end_date=None):
        self.ticker = ticker
        self.start_date = start_date
        self.end_date = end_date
        self.data = None
        self.model = None
        self.features = []
        self.target = None
        self.predictions = None
        self.portfolio_value = None
        self.buy_hold_value = None
        self.trades = []
        self.metrics = {}
    
    def fetch_data(self):
        """Fetch historical price data from Yahoo Finance"""
        self.data = yf.download(self.ticker, start=self.start_date, end=self.end_date)
        if self.data.empty:
            raise ValueError(f"No data found for {self.ticker}")
        return self.data
    
    def create_features(self):
        """Create technical indicators as features"""
        # Make a copy to avoid SettingWithCopyWarning
        df = self.data.copy()
        
        # Simple Moving Averages
        df['SMA5'] = df['Close'].rolling(window=5).mean()
        df['SMA20'] = df['Close'].rolling(window=20).mean()
        df['SMA50'] = df['Close'].rolling(window=50).mean()
        
        # Price relative to moving averages
        df['Price_to_SMA5'] = df['Close'] / df['SMA5']
        df['Price_to_SMA20'] = df['Close'] / df['SMA20']
        df['Price_to_SMA50'] = df['Close'] / df['SMA50']
        
        # Relative Strength Index (RSI)
        delta = df['Close'].diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # Momentum
        df['Momentum5'] = df['Close'] / df['Close'].shift(5) - 1
        df['Momentum10'] = df['Close'] / df['Close'].shift(10) - 1
        df['Momentum20'] = df['Close'] / df['Close'].shift(20) - 1
        
        # Volatility
        df['Volatility'] = df['Close'].rolling(window=20).std()
        
        # Target: Next day return (1 if positive, 0 if negative)
        df['Next_Return'] = df['Close'].shift(-1) / df['Close'] - 1
        df['Target'] = (df['Next_Return'] > 0).astype(int)
        
        # Drop NaN values
        df.dropna(inplace=True)
        
        self.data = df
        self.features = ['Price_to_SMA5', 'Price_to_SMA20', 'Price_to_SMA50', 
                        'RSI', 'Momentum5', 'Momentum10', 'Momentum20', 'Volatility']
        self.target = 'Target'
        
        return self.data
    
    def train_model(self, model_type='random_forest', test_size=0.2, random_state=42):
        """Train a machine learning model to predict price movements"""
        X = self.data[self.features]
        y = self.data[self.target]
        
        # Split data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
        
        # Choose model type
        if model_type == 'random_forest':
            self.model = RandomForestClassifier(n_estimators=100, random_state=random_state)
        elif model_type == 'logistic_regression':
            self.model = LogisticRegression(random_state=random_state)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        
        self.metrics['accuracy'] = accuracy
        self.metrics['classification_report'] = report
        
        return self.metrics
    
    def generate_signals(self, threshold=0.6):
        """Generate trading signals based on model predictions"""
        # Get probability predictions
        X = self.data[self.features]
        self.data['Probability'] = self.model.predict_proba(X)[:, 1]
        
        # Generate signals based on probability threshold
        self.data['Signal'] = 0  # 0 = hold
        self.data.loc[self.data['Probability'] > threshold, 'Signal'] = 1  # 1 = buy
        self.data.loc[self.data['Probability'] < (1 - threshold), 'Signal'] = -1  # -1 = sell
        
        return self.data[['Close', 'Probability', 'Signal']]
    
    def backtest(self, initial_capital=10000):
        """Backtest the trading strategy"""
        # Make sure we have signals
        if 'Signal' not in self.data.columns:
            self.generate_signals()
        
        # Initialize portfolio and positions
        self.data['Position'] = self.data['Signal'].shift(1)
        self.data['Position'].fillna(0, inplace=True)
        
        # Calculate returns
        self.data['Strategy_Return'] = self.data['Position'] * self.data['Next_Return']
        
        # Calculate cumulative returns
        self.data['Cumulative_Strategy_Return'] = (1 + self.data['Strategy_Return']).cumprod()
        self.data['Cumulative_Market_Return'] = (1 + self.data['Next_Return']).cumprod()
        
        # Calculate portfolio value
        self.data['Portfolio_Value'] = initial_capital * self.data['Cumulative_Strategy_Return']
        self.data['Buy_Hold_Value'] = initial_capital * self.data['Cumulative_Market_Return']
        
        # Track trades
        position_changes = self.data['Position'].diff()
        trades = self.data[position_changes != 0].copy()
        trades['Trade_Type'] = position_changes[position_changes != 0].apply(
            lambda x: 'Buy' if x > 0 else 'Sell')
        self.trades = trades[['Trade_Type', 'Close']]
        
        # Calculate metrics
        final_portfolio_value = self.data['Portfolio_Value'].iloc[-1]
        final_buy_hold_value = self.data['Buy_Hold_Value'].iloc[-1]
        total_return = (final_portfolio_value / initial_capital - 1) * 100
        buy_hold_return = (final_buy_hold_value / initial_capital - 1) * 100
        
        # Calculate annualized return
        days = (self.data.index[-1] - self.data.index[0]).days
        years = days / 365
        annualized_return = ((1 + total_return/100) ** (1/years) - 1) * 100
        
        # Calculate Sharpe ratio (assuming risk-free rate of 0%)
        daily_returns = self.data['Strategy_Return']
        sharpe_ratio = np.sqrt(252) * daily_returns.mean() / daily_returns.std()
        
        # Calculate maximum drawdown
        cumulative_returns = self.data['Cumulative_Strategy_Return']
        running_max = cumulative_returns.cummax()
        drawdown = (cumulative_returns / running_max - 1) * 100
        max_drawdown = drawdown.min()
        
        # Store metrics
        self.metrics.update({
            'total_return': total_return,
            'buy_hold_return': buy_hold_return,
            'annualized_return': annualized_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'num_trades': len(self.trades)
        })
        
        self.portfolio_value = self.data['Portfolio_Value']
        self.buy_hold_value = self.data['Buy_Hold_Value']
        
        return self.metrics
    
    def plot_results(self):
        """Plot portfolio value vs buy and hold strategy"""
        plt.figure(figsize=(12, 6))
        plt.plot(self.data.index, self.portfolio_value, label='Strategy')
        plt.plot(self.data.index, self.buy_hold_value, label='Buy & Hold')
        plt.title(f'Strategy Performance: {self.ticker}')
        plt.xlabel('Date')
        plt.ylabel('Portfolio Value ($)')
        plt.legend()
        plt.grid(True)
        
        # Save the plot to a file
        plt.savefig('strategy_performance.png')
        plt.close()
        
        return 'strategy_performance.png'
    
    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of the strategy performance"""
        return {
            'ticker': self.ticker,
            'period': f"{self.data.index[0].strftime('%Y-%m-%d')} to {self.data.index[-1].strftime('%Y-%m-%d')}",
            'total_return': f"{self.metrics['total_return']:.2f}%",
            'buy_hold_return': f"{self.metrics['buy_hold_return']:.2f}%",
            'annualized_return': f"{self.metrics['annualized_return']:.2f}%",
            'sharpe_ratio': f"{self.metrics['sharpe_ratio']:.2f}",
            'max_drawdown': f"{self.metrics['max_drawdown']:.2f}%",
            'num_trades': self.metrics['num_trades'],
            'model_accuracy': f"{self.metrics['accuracy'] * 100:.2f}%"
        }
    
    def run_strategy(self, model_type='random_forest', threshold=0.6, initial_capital=10000):
        """Run the complete trading strategy pipeline"""
        self.fetch_data()
        self.create_features()
        self.train_model(model_type=model_type)
        self.generate_signals(threshold=threshold)
        self.backtest(initial_capital=initial_capital)
        plot_path = self.plot_results()
        
        return {
            'summary': self.get_summary(),
            'plot_path': plot_path,
            'trades': self.trades.head(10).to_dict(orient='records'),
            'metrics': self.metrics
        }

# Helper function to run a strategy with different parameters
def run_strategy_with_params(ticker="SPY", model_type="random_forest", 
                            start_date="2018-01-01", threshold=0.6, 
                            initial_capital=10000) -> Dict[str, Any]:
    """Run a trading strategy with the specified parameters"""
    strategy = TradingStrategy(ticker=ticker, start_date=start_date)
    result = strategy.run_strategy(
        model_type=model_type,
        threshold=threshold,
        initial_capital=initial_capital
    )
    return result