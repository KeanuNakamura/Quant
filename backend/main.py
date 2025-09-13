from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import numpy as np
import json
from typing import List, Dict, Any, Optional

# Import custom modules
from llm_service import LLMService
from trading_strategy import run_strategy_with_params

app = FastAPI(title="QuantEase API", description="Democratized Quant Trading Assistant")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = LLMService()

# Models
class UserProfile(BaseModel):
    user_id: str
    risk_score: int
    diversification: str
    horizon_years: int
    capital_usd: float
    automation_enabled: bool = False

class PortfolioAsset(BaseModel):
    ticker: str
    weight: float

class BacktestResult(BaseModel):
    years: int
    cagr: float
    sharpe: float

class PortfolioRecommendation(BaseModel):
    portfolio: List[PortfolioAsset]
    expected_return: float
    volatility: float
    max_drawdown: float
    backtest: BacktestResult
    rationale: List[str]

class ConversationMessage(BaseModel):
    message: str

class TradingStrategyParams(BaseModel):
    ticker: str = "SPY"
    start_date: str = "2018-01-01"
    model_type: str = "random_forest"
    threshold: float = 0.6
    initial_capital: float = 10000.0

class ConversationResponse(BaseModel):
    response: str
    complete: bool = False
    strategy_results: Optional[Dict[str, Any]] = None

# Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to QuantEase API", "status": "operational"}

# Trading Strategy Chatbot Endpoints
@app.post("/conversation/start")
def start_conversation(user_id: str = "default_user"):
    """Start a new conversation with the trading strategy chatbot"""
    try:
        conversation_id = llm_service.create_conversation(user_id)
        initial_message = llm_service.get_conversation_data(conversation_id)["messages"][1]["content"]
        return {
            "conversation_id": conversation_id,
            "message": initial_message
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/{conversation_id}", response_model=ConversationResponse)
def process_message(conversation_id: str, message: ConversationMessage):
    """Process a message in an existing conversation"""
    try:
        result = llm_service.process_message(conversation_id, message.message)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversation/{conversation_id}")
def get_conversation_data(conversation_id: str):
    """Get the data for an existing conversation"""
    try:
        return llm_service.get_conversation_data(conversation_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trading-strategy/run")
def run_trading_strategy(params: TradingStrategyParams):
    """Run a trading strategy with the specified parameters"""
    try:
        result = run_strategy_with_params(
            ticker=params.ticker,
            model_type=params.model_type,
            start_date=params.start_date,
            threshold=params.threshold,
            initial_capital=params.initial_capital
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommendation", response_model=PortfolioRecommendation)
def recommend_portfolio(profile: UserProfile):
    try:
        # Validate risk score
        if not 1 <= profile.risk_score <= 10:
            raise HTTPException(status_code=400, detail="Risk score must be between 1 and 10")
        
        # Determine portfolio weights based on risk and diversification
        weights = get_portfolio_weights(profile)
        
        # Fetch historical data
        data = fetch_historical_data(list(weights.keys()))
        
        # Calculate portfolio metrics
        metrics = calculate_portfolio_metrics(data, weights)
        
        # Generate rationale
        rationale = generate_rationale(profile, weights, metrics)
        
        # Format response
        return {
            "portfolio": [{"ticker": t, "weight": w} for t, w in weights.items()],
            "expected_return": metrics["expected_return"],
            "volatility": metrics["volatility"],
            "max_drawdown": metrics["max_drawdown"],
            "backtest": {
                "years": metrics["years"],
                "cagr": metrics["cagr"],
                "sharpe": metrics["sharpe"]
            },
            "rationale": rationale
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def get_portfolio_weights(profile: UserProfile) -> Dict[str, float]:
    """Determine portfolio weights based on user profile"""
    # Basic implementation - can be expanded with more sophisticated logic
    if profile.diversification == "concentrated":
        if profile.risk_score >= 8:
            return {"SPY": 0.9, "AGG": 0.1}
        elif profile.risk_score >= 5:
            return {"SPY": 0.8, "AGG": 0.2}
        else:
            return {"SPY": 0.7, "AGG": 0.3}
    elif profile.diversification == "balanced":
        if profile.risk_score >= 8:
            return {"SPY": 0.7, "QQQ": 0.2, "AGG": 0.1}
        elif profile.risk_score >= 5:
            return {"SPY": 0.6, "QQQ": 0.1, "AGG": 0.3}
        else:
            return {"SPY": 0.5, "QQQ": 0.1, "AGG": 0.4}
    else:  # diversified
        if profile.risk_score >= 8:
            return {"SPY": 0.5, "QQQ": 0.2, "EFA": 0.2, "AGG": 0.1}
        elif profile.risk_score >= 5:
            return {"SPY": 0.4, "QQQ": 0.1, "EFA": 0.2, "AGG": 0.3}
        else:
            return {"SPY": 0.3, "QQQ": 0.1, "EFA": 0.1, "AGG": 0.5}

def fetch_historical_data(tickers: List[str]) -> pd.DataFrame:
    """Fetch historical price data for the given tickers"""
    try:
        # Fetch 10 years of data
        data = yf.download(tickers, period="10y")["Adj Close"]
        return data
    except Exception as e:
        raise Exception(f"Failed to fetch historical data: {str(e)}")

def calculate_portfolio_metrics(data: pd.DataFrame, weights: Dict[str, float]) -> Dict[str, float]:
    """Calculate portfolio performance metrics"""
    # Normalize data
    normed = data / data.iloc[0]
    
    # Calculate portfolio performance
    portfolio = (normed * pd.Series(weights)).sum(axis=1)
    returns = portfolio.pct_change().dropna()
    
    # Calculate metrics
    years = min(10, len(portfolio) / 252)  # Assuming 252 trading days per year
    cagr = (portfolio.iloc[-1] / portfolio.iloc[0]) ** (1/years) - 1
    vol = returns.std() * (252**0.5)
    sharpe = cagr / vol if vol > 0 else 0
    dd = ((portfolio / portfolio.cummax()) - 1).min()
    
    return {
        "years": round(years),
        "expected_return": round(cagr, 3),
        "cagr": round(cagr, 3),
        "volatility": round(vol, 3),
        "sharpe": round(sharpe, 2),
        "max_drawdown": round(dd, 3)
    }

def generate_rationale(profile: UserProfile, weights: Dict[str, float], metrics: Dict[str, float]) -> List[str]:
    """Generate plain-language rationale for the recommendation"""
    rationale = []
    
    # Risk-based rationale
    if profile.risk_score >= 8:
        rationale.append("Higher equity allocation matches your high risk tolerance")
    elif profile.risk_score >= 5:
        rationale.append("Balanced equity-bond mix aligns with your moderate risk profile")
    else:
        rationale.append("Conservative allocation with higher bond exposure for lower risk")
    
    # Diversification rationale
    if profile.diversification == "concentrated":
        rationale.append("Concentrated portfolio focuses on core US market exposure")
    elif profile.diversification == "balanced":
        rationale.append("Balanced approach with mix of broad market and growth exposure")
    else:
        rationale.append("Diversified portfolio includes international exposure to reduce correlation")
    
    # Horizon rationale
    if profile.horizon_years >= 10:
        rationale.append(f"Long-term {profile.horizon_years}-year horizon allows for riding out market cycles")
    elif profile.horizon_years >= 5:
        rationale.append(f"Medium-term {profile.horizon_years}-year horizon balanced for growth and stability")
    else:
        rationale.append(f"Shorter {profile.horizon_years}-year horizon prioritizes capital preservation")
    
    return rationale

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)