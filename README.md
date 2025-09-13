# Hermes - Democratized Quant Trading Assistant

Hermes is on a mission to make sophisticated, AI-powered trading accessible, understandable, and trustworthy for everyone—not just the financial elite. We believe everyone should have the ability to harness quantitative trading, no complex jargon or secret formulas required.

## What Makes Hermes Different
Conversational Quant Trading:
Hermes transforms quant trading into a friendly, human chat experience—no more spreadsheets, charts you don’t understand, or mysterious “magic returns.”
Natural Language, Real Clarity:
   You tell Hermes what you want—“I want to trade Apple, long-term, medium risk”—and Hermes (powered by a cutting-edge LLM) asks you everything it needs to build your personal trading playbook.
Questions, Not Wizards:
   Hermes doesn’t assume you’re an expert. It guides you through choices (“What stock? How long? How aggressively?”), in plain English, at your pace, making sure you understand every step.
Transparency in How it Works:
   Hermes gathers your answers and turns them into structured data. This data is processed and trained by proven, open-source AI trading models (using real, widely-trusted market data from sources like Yahoo Finance or Alpha    Vantage).
   Features like moving averages, RSI, and other basic indicators are computed in real time.
   A simple, explainable machine learning model (like a random forest or logistic regression) generates trading signals.
Example: “The model predicts there’s a 65% chance AAPL will go up tomorrow. Want to buy?”
Everything is modeled, backtested, and presented before you commit.
Backtesting and Results, Not Promises:
Hermes runs historical tests—showing you, right in the chat, how your strategy would have performed. You’ll see:
Real portfolio growth vs. buy-and-hold.
Key risk stats (total return, Sharpe ratio, number of trades).
Plots and summaries, all in plain language (“This strategy would have beaten the market in 7 of the last 10 years, but with more ups and downs. Here’s what that looks like.”)
You confirm only when you’re comfortable. If not, iterate and improve your strategy—with Hermes guiding you.
Ongoing, Conversation-Driven Management:
Once you confirm:
Hermes tracks your strategy, displays all live stats in your chat.
You can pause, tweak, or cancel at any time—no lock-in, no black boxes.
All your strategies are visible in a simple sidebar, like ChatGPT’s chat list. Start fresh or keep optimizing in-context; your performance dashboard is just a click away.


## Architecture

- **Frontend**: React + Tailwind (clean UI, onboarding form, dashboard with charts)
- **Backend**: FastAPI (Python) for quant engine + REST API endpoints
- **Quant libraries**: pandas, numpy, yfinance (for free market data in MVP)
- **Deployment**: Docker + docker-compose for local dev

## Features

- User onboarding form to collect investment preferences
- Recommendation Engine API that generates portfolio allocations
- Dashboard with visualizations of portfolio performance
- Risk metrics and investment rationale

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine

### Running the Application

1. Clone the repository
2. Navigate to the project directory
3. Run the following command to start both frontend and backend services:

```bash
docker-compose up
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## API Endpoints

### `/recommendation` (POST)

Generates portfolio recommendations based on user profile.

**Input Schema:**
```json
{
  "user_id": "u_123",
  "risk_score": 6,
  "diversification": "balanced",
  "horizon_years": 7,
  "capital_usd": 10000,
  "automation_enabled": false
}
```

**Output Schema:**
```json
{
  "portfolio": [
    {"ticker": "SPY", "weight": 0.6},
    {"ticker": "AGG", "weight": 0.4}
  ],
  "expected_return": 0.065,
  "volatility": 0.11,
  "max_drawdown": -0.25,
  "backtest": {
    "years": 10,
    "cagr": 0.067,
    "sharpe": 0.92
  },
  "rationale": [
    "Momentum trend in equities is positive",
    "Bonds included to reduce drawdown risk",
    "Balanced allocation matches risk profile 6/10"
  ]
}
```

## Development

### Backend

The backend is built with FastAPI and provides the recommendation engine API. It uses yfinance to fetch historical market data and pandas for data analysis.

### Frontend

The frontend is built with React and Tailwind CSS. It provides a user-friendly interface for inputting investment preferences and visualizing portfolio recommendations.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
