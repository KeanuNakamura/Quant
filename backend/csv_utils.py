import pandas as pd
import numpy as np
import io
from typing import Dict, List, Any
from datetime import datetime, timedelta
import random

def generate_portfolio_csv(recommendation: Dict[str, Any], historical_data: Dict[str, pd.DataFrame]) -> str:
    """
    Generate a CSV file with portfolio allocation and historical performance data
    
    Args:
        recommendation: The portfolio recommendation data
        historical_data: Dictionary of historical price data for each asset
        
    Returns:
        CSV content as a string
    """
    # Create allocation dataframe
    allocation_data = []
    for asset in recommendation["assets"]:
        allocation_data.append({
            "Ticker": asset["ticker"],
            "Asset Name": asset["name"],
            "Allocation %": asset["weight"] * 100,
            "Asset Class": asset["asset_class"]
        })
    
    allocation_df = pd.DataFrame(allocation_data)
    
    # Create historical performance dataframe
    # Get the common date range for all assets
    start_date = None
    end_date = None
    
    for ticker, df in historical_data.items():
        if df.empty:
            continue
        
        df_start = df.index.min()
        df_end = df.index.max()
        
        if start_date is None or df_start > start_date:
            start_date = df_start
        
        if end_date is None or df_end < end_date:
            end_date = df_end
    
    if start_date is None or end_date is None:
        # If no valid data, return just the allocation table
        buffer = io.StringIO()
        buffer.write("Portfolio Allocation\n")
        allocation_df.to_csv(buffer, index=False)
        return buffer.getvalue()
    
    # Create a date range for the historical performance
    date_range = pd.date_range(start=start_date, end=end_date, freq='M')
    
    # Initialize the portfolio value series
    portfolio_values = pd.Series(index=date_range, dtype=float)
    portfolio_values.iloc[0] = 100  # Start with base 100
    
    # Calculate weighted returns for each period
    for i in range(1, len(date_range)):
        weighted_return = 0
        
        for asset in recommendation["assets"]:
            ticker = asset["ticker"]
            weight = asset["weight"]
            
            if ticker in historical_data and not historical_data[ticker].empty:
                # Get the closest dates to our monthly points
                prev_date = date_range[i-1]
                curr_date = date_range[i]
                
                # Find the closest actual dates in the data
                prev_actual = historical_data[ticker].index[historical_data[ticker].index <= prev_date][-1]
                curr_actual = historical_data[ticker].index[historical_data[ticker].index <= curr_date][-1]
                
                # Calculate return
                prev_price = historical_data[ticker].loc[prev_actual, 'Close']
                curr_price = historical_data[ticker].loc[curr_actual, 'Close']
                asset_return = (curr_price / prev_price) - 1
                
                weighted_return += asset_return * weight
        
        # Update portfolio value
        portfolio_values.iloc[i] = portfolio_values.iloc[i-1] * (1 + weighted_return)
    
    # Create performance dataframe
    performance_df = pd.DataFrame({
        'Date': date_range,
        'Portfolio Value': portfolio_values.values
    })
    
    # Format the CSV output
    buffer = io.StringIO()
    
    # Write the allocation table
    buffer.write("Portfolio Allocation\n")
    allocation_df.to_csv(buffer, index=False)
    
    buffer.write("\n\nPortfolio Performance\n")
    performance_df.to_csv(buffer, index=False, date_format='%Y-%m-%d')
    
    buffer.write("\n\nPortfolio Metrics\n")
    metrics_df = pd.DataFrame([
        {"Metric": "CAGR", "Value": f"{recommendation['metrics']['cagr']:.2%}"},
        {"Metric": "Volatility", "Value": f"{recommendation['metrics']['volatility']:.2%}"},
        {"Metric": "Sharpe Ratio", "Value": f"{recommendation['metrics']['sharpe_ratio']:.2f}"},
        {"Metric": "Max Drawdown", "Value": f"{recommendation['metrics']['max_drawdown']:.2%}"}
    ])
    metrics_df.to_csv(buffer, index=False)
    
    return buffer.getvalue()

def parse_portfolio_csv(csv_content: str) -> Dict[str, Any]:
    """
    Parse a portfolio CSV file to extract allocation and performance data
    
    Args:
        csv_content: CSV content as a string
        
    Returns:
        Dictionary with parsed portfolio data
    """
    # Split the CSV into sections
    sections = csv_content.split("\n\n")
    
    result = {}
    
    # Parse allocation section
    if len(sections) > 0 and "Portfolio Allocation" in sections[0]:
        allocation_lines = sections[0].split("\n")[1:]  # Skip the header
        allocation_csv = "\n".join(allocation_lines)
        allocation_df = pd.read_csv(io.StringIO(allocation_csv))
        
        assets = []
        for _, row in allocation_df.iterrows():
            assets.append({
                "ticker": row["Ticker"],
                "name": row["Asset Name"],
                "weight": row["Allocation %"] / 100,
                "asset_class": row["Asset Class"]
            })
        
        result["assets"] = assets
    
    # Parse performance section if available
    if len(sections) > 1 and "Portfolio Performance" in sections[1]:
        performance_lines = sections[1].split("\n")[1:]  # Skip the header
        performance_csv = "\n".join(performance_lines)
        performance_df = pd.read_csv(io.StringIO(performance_csv))
        
        # Convert to dictionary format
        performance = []
        for _, row in performance_df.iterrows():
            performance.append({
                "date": row["Date"],
                "value": row["Portfolio Value"]
            })
        
        result["performance"] = performance
    
    # Parse metrics section if available
    if len(sections) > 2 and "Portfolio Metrics" in sections[2]:
        metrics_lines = sections[2].split("\n")[1:]  # Skip the header
        metrics_csv = "\n".join(metrics_lines)
        metrics_df = pd.read_csv(io.StringIO(metrics_csv))
        
        # Convert to dictionary format
        metrics = {}
        for _, row in metrics_df.iterrows():
            metric_name = row["Metric"].lower().replace(" ", "_")
            # Remove % sign and convert to float
            value_str = row["Value"]
            if isinstance(value_str, str):
                if "%" in value_str:
                    value = float(value_str.replace("%", "")) / 100
                else:
                    value = float(value_str)
            else:
                value = value_str
            
            metrics[metric_name] = value
        
        result["metrics"] = metrics
    
    return result