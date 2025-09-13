import os
import json
import uuid
from typing import Dict, List, Any, Optional
from trading_strategy import run_strategy_with_params

# This is a mock LLM service for demonstration purposes
# In a real implementation, you would integrate with an actual LLM API like OpenAI, Anthropic, etc.
class LLMService:
    def __init__(self):
        self.conversations = {}
        # Define the meta prompt for the trading strategy chatbot
        self.meta_prompt = """
        You are a quantitative trading assistant. Your goal is to help users create and backtest a simple trading strategy.
        Ask questions one at a time to gather the following information:
        1. Which asset they want to analyze (default: SPY)
        2. The start date for historical data (format: YYYY-MM-DD, default: 2018-01-01)
        3. Which ML model they prefer (random_forest or logistic_regression, default: random_forest)
        4. The probability threshold for trading signals (0.5-0.9, default: 0.6)
        5. The initial capital for backtesting (default: 10000)
        
        After collecting all information, summarize the parameters and ask for confirmation.
        If confirmed, run the trading strategy and present the results.
        """
    
    def create_conversation(self, user_id: str) -> str:
        """Create a new conversation and return the conversation ID"""
        conversation_id = f"conv_{user_id}_{len(self.conversations) + 1}"
        self.conversations[conversation_id] = {
            "messages": [
                {"role": "system", "content": self.meta_prompt},
                {"role": "assistant", "content": "Hello! I'm your quantitative trading assistant. I'll help you create and backtest a simple trading strategy using machine learning. Let's start with which asset you'd like to analyze. Which ticker symbol would you like to use? (default: SPY)"}
            ],
            "collected_data": {
                "user_id": user_id,
                "ticker": "SPY",
                "start_date": "2018-01-01",
                "model_type": "random_forest",
                "threshold": 0.6,
                "initial_capital": 10000
            },
            "complete": False,
            "strategy_results": None
        }
        return conversation_id
    
    def get_conversation_data(self, conversation_id: str) -> dict:
        """Get the data for an existing conversation"""
        if conversation_id not in self.conversations:
            raise ValueError(f"Conversation {conversation_id} not found")
            
        return self.conversations[conversation_id]
    
    def process_message(self, conversation_id: str, message: str) -> Dict[str, Any]:
        """Process a user message and return the assistant's response"""
        if conversation_id not in self.conversations:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        conversation = self.conversations[conversation_id]
        conversation["messages"].append({"role": "user", "content": message})
        
        # If the conversation is already complete and we have strategy results, just return them
        if conversation["complete"] and conversation["strategy_results"]:
            return {
                "response": "I've already run the trading strategy with your parameters. Would you like to try with different parameters?",
                "complete": True,
                "strategy_results": conversation["strategy_results"]
            }
        
        # Mock LLM processing - in a real implementation, this would call an actual LLM API
        response, updated_data = self._mock_llm_response(conversation)
        
        # Update collected data
        if updated_data:
            conversation["collected_data"].update(updated_data)
        
        # Check if all required data is collected
        required_fields = ["ticker", "start_date", "model_type", "threshold", "initial_capital"]
        all_collected = all(conversation["collected_data"].get(field) is not None for field in required_fields)
        
        # If this is a confirmation message and all data is collected, mark as complete
        if all_collected and "confirm" in message.lower():
            conversation["complete"] = True
        
        # Add assistant response to history
        conversation["messages"].append({"role": "assistant", "content": response})
        
        return {
            "response": response,
            "collected_data": conversation["collected_data"],
            "complete": conversation["complete"]
        }
    
    def _mock_llm_response(self, conversation: Dict[str, Any]) -> tuple[str, Optional[Dict[str, Any]]]:
        """Mock LLM response generation based on conversation state"""
        messages = conversation["messages"]
        collected_data = conversation["collected_data"]
        last_message = messages[-1]["content"].lower()
        updated_data = {}
        
        # Process based on what data we've already collected
        if collected_data["ticker"] == "SPY" and len(messages) == 2:  # First user message
            # Check if user provided a ticker
            if len(last_message.strip()) <= 5 and last_message.strip().isalpha():  # Simple check for ticker format
                updated_data["ticker"] = last_message.strip().upper()
            # Even if they didn't provide a ticker, we'll use the default SPY
            ticker = updated_data.get("ticker", collected_data["ticker"])
            return f"I'll use {ticker} for our analysis. What start date would you like to use for historical data? (format: YYYY-MM-DD, default: 2018-01-01)", updated_data
        
        # Check for start date
        elif collected_data["start_date"] == "2018-01-01" and len(messages) == 4:  # Second user message
            import re
            # Check if user provided a date in YYYY-MM-DD format
            date_pattern = re.compile(r'\d{4}-\d{2}-\d{2}')
            date_match = date_pattern.search(last_message)
            if date_match:
                updated_data["start_date"] = date_match.group(0)
            # Even if they didn't provide a date, we'll use the default
            start_date = updated_data.get("start_date", collected_data["start_date"])
            return f"I'll use {start_date} as the start date. Which ML model would you prefer for prediction? Options are 'random_forest' or 'logistic_regression' (default: random_forest)", updated_data
        
        # Check for model type
        elif collected_data["model_type"] == "random_forest" and len(messages) == 6:  # Third user message
            if "logistic" in last_message or "regression" in last_message:
                updated_data["model_type"] = "logistic_regression"
            # Even if they didn't specify, we'll use the default random_forest
            model_type = updated_data.get("model_type", collected_data["model_type"])
            return f"I'll use the {model_type} model. What probability threshold would you like to use for trading signals? (0.5-0.9, default: 0.6)", updated_data
        
        # Check for threshold
        elif collected_data["threshold"] == 0.6 and len(messages) == 8:  # Fourth user message
            try:
                # Try to extract a number from the message
                import re
                number_match = re.search(r'0\.\d+', last_message)
                if number_match:
                    threshold = float(number_match.group(0))
                    if 0.5 <= threshold <= 0.9:
                        updated_data["threshold"] = threshold
            except:
                pass  # Use default if extraction fails
            # Even if they didn't provide a valid threshold, we'll use the default
            threshold = updated_data.get("threshold", collected_data["threshold"])
            return f"I'll use {threshold} as the probability threshold. What initial capital would you like to use for backtesting? (default: $10,000)", updated_data
        
        # Check for initial capital
        elif collected_data["initial_capital"] == 10000 and len(messages) == 10:  # Fifth user message
            try:
                # Remove any currency symbols or commas
                cleaned_input = last_message.replace("$", "").replace(",", "").strip()
                # Try to extract a number
                import re
                number_match = re.search(r'\d+', cleaned_input)
                if number_match:
                    capital = float(number_match.group(0))
                    if capital > 0:
                        updated_data["initial_capital"] = capital
            except:
                pass  # Use default if extraction fails
            
            # Summarize the collected parameters
            capital = updated_data.get("initial_capital", collected_data["initial_capital"])
            summary = f"Great! Here's a summary of your trading strategy parameters:\n\n"
            summary += f"- Asset: {collected_data['ticker']}\n"
            summary += f"- Start Date: {collected_data['start_date']}\n"
            summary += f"- ML Model: {collected_data['model_type']}\n"
            summary += f"- Probability Threshold: {collected_data['threshold']}\n"
            summary += f"- Initial Capital: ${capital:,.2f}\n\n"
            summary += "Is this information correct? (yes/no)"
            
            return summary, updated_data
        
        # Confirmation and strategy execution
        elif not conversation["complete"] and len(messages) == 12:  # Sixth user message (confirmation)
            if "yes" in last_message or "correct" in last_message:
                # Run the trading strategy with the collected parameters
                try:
                        # Run the actual trading strategy with the collected parameters
                    strategy_results = run_strategy_with_params(
                        ticker=collected_data["ticker"],
                        start_date=collected_data["start_date"],
                        model_type=collected_data["model_type"],
                        threshold=collected_data["threshold"],
                        initial_capital=collected_data["initial_capital"]
                    )
                    
                    conversation["complete"] = True
                    conversation["strategy_results"] = strategy_results
                    
                    # Format the response with strategy results
                    results = conversation["strategy_results"]
                    response = f"I've run the trading strategy with your parameters. Here are the results:\n\n"
                    response += f"**Strategy Performance Summary**\n\n"
                    response += f"- Asset: {collected_data['ticker']}\n"
                    response += f"- Period: {collected_data['start_date']} to present\n"
                    response += f"- Total Return: {results.get('total_return', '0.0%')} (Buy & Hold: {results.get('buy_hold_return', '0.0%')})\n"
                    response += f"- Annualized Return: {results.get('annualized_return', '0.0%')}\n"
                    response += f"- Sharpe Ratio: {results.get('sharpe_ratio', '0.0')}\n"
                    response += f"- Maximum Drawdown: {results.get('max_drawdown', '0.0%')}\n"
                    response += f"- Number of Trades: {results.get('num_trades', 0)}\n"
                    response += f"- Model Accuracy: {results.get('model_accuracy', '0.0%')}\n\n"
                    response += "The strategy performance plot has been generated. Would you like to try different parameters?"
                    
                    return response, updated_data
                except Exception as e:
                    # Handle any errors during strategy execution
                    return f"There was an error running the strategy: {str(e)}. Would you like to try with different parameters?", updated_data
            else:
                # Reset the data collection process
                updated_data = {
                    "ticker": "SPY",
                    "start_date": "2018-01-01",
                    "model_type": "random_forest",
                    "threshold": 0.6,
                    "initial_capital": 10000
                }
                return "Let's start over. Which ticker symbol would you like to use? (default: SPY)", updated_data
        
        # If we're waiting for confirmation or in any other state
        elif conversation["complete"]:
            return "Your trading strategy has been executed. Would you like to try with different parameters?", None
        else:
            # If we're not sure where we are in the conversation, restart
            return "Let's start over. Which ticker symbol would you like to use? (default: SPY)", None

    def get_conversation_data(self, conversation_id: str) -> Dict[str, Any]:
        """Get the collected data for a conversation"""
        if conversation_id not in self.conversation_history:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        return self.conversation_history[conversation_id]["collected_data"]

# Initialize the LLM service
llm_service = LLMService()