import math
from datetime import datetime
from typing import List, Dict, Any, Tuple
from .classifier import classify_necessity

NECESSITY_SCORE = {
    "essential": 0.0,
    "non_essential": 0.5,
    "luxury": 1.0
}

# Caluculate impulse score, return necessity score and factors as well
def calculate_impulse_score(
    product_name: str,
    transaction_amount: float,
    transaction_time: datetime,
    user_variable_balance: float,      # Current variable balance
    avg_daily_spending: float,
    similar_purchases_count: int,       # Similar purchase in recent 30 days
) -> Tuple[float, float, Dict[str, Any]]:

    # 1. Necessity factor
    necessity_label = classify_necessity(product_name)
    necessity_score = NECESSITY_SCORE[necessity_label]
    
    # 2. Day Night Factor
    hour = transaction_time.hour
    if 23 <= hour or hour < 5:
        night_factor = 1.0
    elif 21 <= hour < 23:
        night_factor = 0.6
    else:
        night_factor = 0.0
    
    # 3. Amount Anomalies Factor
    if avg_daily_spending > 0:
        ratio = transaction_amount / avg_daily_spending
        if ratio > 10:
            amount_factor = 1.0
        elif ratio > 5:
            amount_factor = 0.8
        elif ratio > 2:
            amount_factor = 0.5
        else:
            amount_factor = 0.1
    else:
        amount_factor = 0.5
    
    # 4. Ratio to Variable Balance
    if user_variable_balance > 0:
        liquidity_ratio = transaction_amount / user_variable_balance
        if liquidity_ratio > 0.5:
            liquidity_factor = 1.0
        elif liquidity_ratio > 0.2:
            liquidity_factor = 0.6
        else:
            liquidity_factor = 0.2
    else:
        liquidity_factor = 1.0
    
    # 5. Frequency of Purchasing Similar Product Factor
    frequency_factor = min(1.0, similar_purchases_count / 5.0)
    
    # Total Up
    weights = {
        "necessity": 0.35,
        "night": 0.20,
        "amount": 0.15,
        "liquidity": 0.15,
        "frequency": 0.15
    }
    impulse_score = (
        weights["necessity"] * necessity_score +
        weights["night"] * night_factor +
        weights["amount"] * amount_factor +
        weights["liquidity"] * liquidity_factor +
        weights["frequency"] * frequency_factor
    )
    
    factors = {
        "necessity_label": necessity_label,
        "necessity_score": necessity_score,
        "night_factor": night_factor,
        "amount_factor": amount_factor,
        "liquidity_factor": liquidity_factor,
        "frequency_factor": frequency_factor,
        "similar_purchases_count": similar_purchases_count,
        "transaction_variance": amount_factor
    }
    return impulse_score, necessity_score, factors

# Tier Classification
def determine_tier(impulse_score: float) -> int:
    if impulse_score < 0.2:
        return 0
    elif impulse_score < 0.4:
        return 1   # soft
    elif impulse_score < 0.7:
        return 2   # friction
    else:
        return 3   # critical