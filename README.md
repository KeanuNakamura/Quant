# Hermes - Democratized Quant Trading

Hermes is on a mission to make sophisticated, AI-powered trading accessible, understandable, and trustworthy for everyone—not just the financial elite. We believe everyone should have the ability to harness quantitative trading, no complex jargon or secret formulas required.

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
