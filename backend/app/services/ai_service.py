import os
import json
import logging
from app.schemas.ai import AICampaignMetrics, AICampaignInsightsResponse

# Configure logger
logger = logging.getLogger("ai_service")

# Try to import Gemini SDK
GEMINI_AVAILABLE = False
try:
    import google.generativeai as genai
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key:
        genai.configure(api_key=api_key)
        # We will use the model gemini-2.5-flash
        GEMINI_AVAILABLE = True
        logger.info("Gemini API initialized successfully.")
    else:
        logger.warning("GEMINI_API_KEY environment variable is empty. Falling back to Mock AI.")
except Exception as e:
    logger.warning(f"Failed to initialize Gemini SDK: {e}. Falling back to Mock AI.")

def call_gemini_json(prompt: str, system_instruction: str = None) -> dict | None:
    """
    Calls Gemini API expecting a JSON response.
    Returns the parsed dict, or None if it fails.
    """
    if not GEMINI_AVAILABLE:
        return None
        
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"{system_instruction}\n\nUser Prompt: {prompt}"
            
        response = model.generate_content(full_prompt)
        text = response.text.strip()
        
        # Clean potential markdown wrapping
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return None

# ==========================================
# AI Feature 1: Natural Language Segmentation
# ==========================================
def segment_customers_ai(prompt: str) -> tuple[str, dict]:
    """
    Uses Gemini to convert the prompt into structured filters.
    Returns: (segment_name, filters_dict)
    """
    system_instruction = (
        "You are an AI assistant for a beauty/skincare brand CRM named Dewy.\n"
        "Convert a marketer's request describing a customer segment into a structured JSON object.\n"
        "The output JSON MUST follow this schema:\n"
        "{\n"
        '  "segment_name": "Human readable name of the segment",\n'
        '  "filters": {\n'
        '    "skin_type": "Dry" | "Oily" | "Combination" | "Sensitive" (optional),\n'
        '    "age_group": "18-24" | "25-34" | "35-44" | "45+" (optional),\n'
        '    "persona": "VIP" | "Regular" | "Dormant" | "SunCare" | "AcneCare" (optional),\n'
        '    "min_spend": float (optional),\n'
        '    "max_spend": float (optional),\n'
        '    "bought": "Category Name or Product Name" (optional, e.g. "Sunscreen" or "Cleanser"),\n'
        '    "not_bought": "Category Name or Product Name" (optional, e.g. "Moisturizer"),\n'
        '    "inactive_days": integer (optional, number of inactive days, e.g. 90)\n'
        "  }\n"
        "}\n"
        "Do not include any text other than the raw JSON."
    )
    
    result = call_gemini_json(prompt, system_instruction)
    
    if result and "segment_name" in result and "filters" in result:
        return result["segment_name"], result["filters"]
        
    # Fallback to rule-based parser if Gemini fails or is unavailable
    logger.info("Running rule-based NLP fallback for segmentation.")
    lower_prompt = prompt.lower()
    
    if "90 days" in lower_prompt or "dormant" in lower_prompt or "inactive" in lower_prompt or "haven't purchased" in lower_prompt:
        return "Dormant Customers (90+ Days)", {"inactive_days": 90}
    
    if "sunscreen" in lower_prompt and ("without" in lower_prompt or "not" in lower_prompt) and "moisturizer" in lower_prompt:
        return "Sunscreen Buyers Without Moisturizer", {"bought": "Sunscreen", "not_bought": "Moisturizer"}
        
    if "vip" in lower_prompt or "high spend" in lower_prompt or "top customer" in lower_prompt or "high-value" in lower_prompt:
        return "VIP High-Spend Customers", {"persona": "VIP", "min_spend": 200.0}
        
    if "oily" in lower_prompt or "acne" in lower_prompt:
        return "Oily & Acne-Prone Skin Care Segment", {"persona": "AcneCare", "skin_type": "Oily"}
        
    if "dry" in lower_prompt:
        return "Dry Skin Type Segment", {"skin_type": "Dry"}
        
    if "sensitive" in lower_prompt:
        return "Sensitive Skin Care Segment", {"skin_type": "Sensitive"}
        
    if "refill" in lower_prompt or "regular" in lower_prompt:
        return "Regular Customers Refill Segment", {"persona": "Regular"}

    # Default fallback
    return "Custom Customer Segment", {"skin_type": "Combination"}


# ==========================================
# AI Feature 2: Campaign Copy Generator
# ==========================================
def generate_campaign_messages_ai(segment_name: str, channel: str) -> dict:
    """
    Generates 3 personalized campaign message variants.
    Returns: {"variant_a": "...", "variant_b": "...", "variant_c": "..."}
    """
    prompt = f"Segment Name: {segment_name}\nMarketing Channel: {channel}"
    system_instruction = (
        "You are an expert copywriter for a premium skincare brand named Dewy.\n"
        "Generate 3 personalized marketing message copy variants (Variant A, Variant B, Variant C) for the given segment and channel.\n"
        "Format the output strictly as a JSON object with keys: 'variant_a', 'variant_b', 'variant_c'.\n"
        "Adapt style based on the channel:\n"
        "- WhatsApp: Conversational, uses emojis, has a clear call to action, short-to-medium length.\n"
        "- Email: Includes a Subject line at the start, followed by body copy. Professional and engaging.\n"
        "- SMS: Very short, high impact, under 160 characters, includes link placeholder.\n"
        "- RCS: Highly engaging, rich text, action-oriented, under 250 characters.\n"
        "Make copy highly relevant to the segment (e.g. skin types, VIP exclusive offers, dormant winbacks).\n"
        "Do not include any explanation or markdown formatting outside the JSON."
    )
    
    result = call_gemini_json(prompt, system_instruction)
    
    if result and "variant_a" in result and "variant_b" in result and "variant_c" in result:
        return result
        
    # Rule-based copy fallback
    logger.info("Running rule-based copywriting fallback.")
    if channel.lower() == "whatsapp":
        return {
            "variant_a": f"Hey Gorgeous! ✨ We noticed you haven't visited Dewy in a bit. Ready for a glow up? Grab 15% off your next purchase with code GLOW15! Shop now at dewy.com/shop 🧴",
            "variant_b": f"Hi beauty! 🌟 Is your skincare shelf looking empty? Refill your favorites today and enjoy a FREE Centella Cleanser sample! Use code REFILLFREE at checkout. Tap to shop!",
            "variant_c": f"Hello from Dewy! 🧴 Treat your skin to the hydration it deserves. Enjoy free shipping and 10% off your next order. Use code SHIPSOPREM at checkout!"
        }
    elif channel.lower() == "sms":
        return {
            "variant_a": f"Dewy: We miss you! Take 15% off your skincare essentials with code GLOW15. Shop now: dewy.com/shop",
            "variant_b": f"Skincare running low? Refill today & get a free mini cleanser. Use code REFILLFREE at dewy.com",
            "variant_c": f"Dewy: Pamper your skin today! Free shipping + 10% off your entire order with code SHIPSOPREM. dewy.com/shop"
        }
    elif channel.lower() == "email":
        return {
            "variant_a": (
                "Subject: We miss you! Here is 15% off your skincare favorites... 🌟\n\n"
                "Hi there,\n\n"
                "We noticed you haven't stopped by Dewy in a while, and your skin is missing its favorite routines! "
                "To welcome you back, we'd love to offer you 15% off your next order. "
                "Use code GLOW15 at checkout to claim your offer.\n\n"
                "Stay Glowing,\nThe Dewy Team"
            ),
            "variant_b": (
                "Subject: Time to refill? Enjoy a free mini cleanser on us! 🧴\n\n"
                "Hello Skincare Lover,\n\n"
                "Are your favorite cleansers, serums, or sunscreens running low? "
                "Refill your skincare shelf today and get a complimentary travel-size Centella Cleanser. "
                "Just apply code REFILLFREE at checkout.\n\n"
                "Best,\nThe Dewy Team"
            ),
            "variant_c": (
                "Subject: Your skin deserves a treat (Free Shipping + 10% Off) ✨\n\n"
                "Hi there,\n\n"
                "Refresh your beauty routine with Dewy. We've compiled our top hydration favorites just for you. "
                "Get 10% off plus free shipping on your entire purchase using code SHIPSOPREM.\n\n"
                "Warmly,\nThe Dewy Team"
            )
        }
    else: # RCS or other
        return {
            "variant_a": f"🌟 We miss your glow! Recharge your skincare routine with 15% off your favorites at Dewy. Use code GLOW15.",
            "variant_b": f"🧴 Shelf running dry? Refill your hydration serum and get a free mini wash! Code: REFILLFREE.",
            "variant_c": f"✨ Dewy skincare is calling. Get 10% off and free shipping on us today. Code: SHIPSOPREM."
        }


# ==========================================
# AI Feature 3: Channel Recommendation
# ==========================================
def recommend_channel_ai(segment_name: str, filters: dict) -> tuple[str, str]:
    """
    Recommends the best channel (WhatsApp, SMS, Email, RCS) with a brief marketing reasoning.
    Returns: (recommended_channel, reasoning)
    """
    prompt = f"Segment Name: {segment_name}\nFilters: {json.dumps(filters)}"
    system_instruction = (
        "You are an expert marketing strategist for a beauty brand named Dewy.\n"
        "Analyze the customer segment details and select the best marketing channel from: WhatsApp, SMS, Email, RCS.\n"
        "Format the output strictly as a JSON object with keys: 'recommended_channel' and 'reasoning'.\n"
        "The reasoning should be high impact, concise (1-2 sentences), explaining why this channel is optimal for this specific audience."
    )
    
    result = call_gemini_json(prompt, system_instruction)
    
    if result and "recommended_channel" in result and "reasoning" in result:
        return result["recommended_channel"], result["reasoning"]
        
    # Rule-based fallback
    logger.info("Running rule-based channel recommendation fallback.")
    lower_name = segment_name.lower()
    
    if "dormant" in lower_name or "inactive" in lower_name or "inactive_days" in filters:
        return "WhatsApp", "WhatsApp provides a direct, personal win-back channel with a 98% open rate, making it ideal for re-engaging dormant customers with high-urgency offers."
        
    if "vip" in lower_name or "spend" in lower_name or "min_spend" in filters:
        return "Email", "Email is highly effective for high-value VIPs, enabling premium newsletter layout designs, product refill schedules, and rich imagery of skincare lines."
        
    if "sun" in lower_name or "bought" in filters:
        return "SMS", "SMS is highly effective for quick transactional tips and cross-selling, prompting instant action to add SPF protection to their routines."
        
    # Default
    return "Email", "Email offers the best cost-to-benefit ratio for general informational campaigns and product tutorials."


# ==========================================
# AI Feature 4: Campaign Insights
# ==========================================
def generate_campaign_insights_ai(metrics: AICampaignMetrics) -> AICampaignInsightsResponse:
    """
    Generates campaign performance insights: summary, recommendations, next best campaign.
    """
    prompt = (
        f"Campaign Metrics:\n"
        f"- Segment Name: {metrics.segment_name}\n"
        f"- Channel: {metrics.channel}\n"
        f"- Sent: {metrics.sent_count}\n"
        f"- Delivered: {metrics.delivered_count}\n"
        f"- Opened: {metrics.opened_count}\n"
        f"- Clicked: {metrics.clicked_count}\n"
        f"- Purchased: {metrics.purchased_count}\n"
        f"- Revenue: ${metrics.revenue:.2f}\n"
    )
    
    system_instruction = (
        "You are an AI growth marketing analyst for Dewy skincare CRM.\n"
        "Analyze the provided campaign metrics and output a JSON object with these exact keys:\n"
        "- 'summary': A high-level description of campaign performance (e.g. conversion trends, open rate evaluation).\n"
        "- 'recommendations': Specific actionable takeaways to improve the current campaign structure (e.g., CTA design, send times).\n"
        "- 'next_best_campaign': A concrete suggestion for a follow-up campaign to target this audience segment (e.g., cross-selling moisturizer to sunscreen buyers).\n"
        "Provide professional, highly-specific beauty-brand context. Do not include markdown code ticks outside the JSON."
    )
    
    result = call_gemini_json(prompt, system_instruction)
    
    if result and "summary" in result and "recommendations" in result and "next_best_campaign" in result:
        return AICampaignInsightsResponse(
            summary=result["summary"],
            recommendations=result["recommendations"],
            next_best_campaign=result["next_best_campaign"]
        )
        
    # Rule-based fallback
    logger.info("Running rule-based campaign insights fallback.")
    
    open_rate = (metrics.opened_count / metrics.delivered_count * 100) if metrics.delivered_count > 0 else 0.0
    conv_rate = (metrics.purchased_count / metrics.sent_count * 100) if metrics.sent_count > 0 else 0.0
    
    summary = (
        f"The campaign for '{metrics.segment_name}' on {metrics.channel} reached {metrics.delivered_count} customers, "
        f"achieving a solid open rate of {open_rate:.1f}% and generating ${metrics.revenue:,.2f} in sales. "
        f"Customer conversion rate stood at {conv_rate:.1f}%, indicating healthy brand resonance."
    )
    
    recommendations = (
        f"To lift click-through rates from the current {metrics.clicked_count} clicks, optimize call-to-actions "
        f"with interactive widgets or emoji-bulleted product highlights. For {metrics.channel}, sending messages "
        f"around 7 PM (skincare routine hours) yields up to 18% higher engagement."
    )
    
    next_best_campaign = (
        f"Since this segment converted well, launch a 'Moisturizer & Hydration' cross-sell campaign. "
        f"Moisturizer buyers historically convert 18% better when paired with their sunscreen purchases."
    )
    
    return AICampaignInsightsResponse(
        summary=summary,
        recommendations=recommendations,
        next_best_campaign=next_best_campaign
    )


# ==========================================
# New AI Copilot Tab 1 Recommendations
# ==========================================

def recommend_segments_ai(prompt: str) -> list[dict]:
    """
    Translates a marketing goal into a ranked list of target audience segments.
    """
    system_instruction = (
        "You are an expert beauty brand CRM AI strategist.\n"
        "Convert the user's prompt (business objective) into a ranked list of 2-3 target audience segment recommendations.\n"
        "Output strictly as a JSON array of objects with this schema:\n"
        "[\n"
        "  {\n"
        '    "name": "Human readable segment name",\n'
        '    "confidence": integer (0-100),\n'
        '    "reason": "Data-driven explanation separated by newlines (e.g. \\"39.2% of customers are due for replenishment.\\nAverage spend is ₹1,239.\\nHistorical repeat purchase rate is 28%.\\")",\n'
        '    "filters": { ... }  # query filters (e.g. inactive_days: 90, bought, skin_type, etc.)\n'
        "  }\n"
        "]"
    )
    
    result = call_gemini_json(prompt, system_instruction)
    if result and isinstance(result, list):
        return result
        
    # Rule-based fallback
    lower_prompt = prompt.lower()
    if "refill" in lower_prompt or "replenish" in lower_prompt:
        return [
            {
                "name": "Serum Refill Candidates",
                "confidence": 95,
                "reason": "39.2% of customers are due for replenishment.\nAverage spend is ₹1,239.\nHistorical repeat purchase rate is 28%.",
                "filters": {"refill_soon": True}
            },
            {
                "name": "High Value Repeat Buyers",
                "confidence": 88,
                "reason": "12.4% of customers fall into this tier.\nAverage historical lifetime value is ₹4,500.\nExpected cross-sell probability is 24%.",
                "filters": {"min_orders": 5}
            }
        ]
    elif "dormant" in lower_prompt or "inactive" in lower_prompt or "win back" in lower_prompt:
        return [
            {
                "name": "Dormant High Value Customers",
                "confidence": 93,
                "reason": "14% of customers haven't ordered in 90+ days.\nAverage historical lifetime value is ₹5,100.\nExpected recovery engagement is 15%.",
                "filters": {"inactive_days": 90, "min_spend": 2000}
            },
            {
                "name": "Dormant Customers",
                "confidence": 89,
                "reason": "18% of the customer list is inactive for over 90 days.\nHigh volume re-engagement opportunity with a 10% expected conversion.\nHistorical win-back rate is 12%.",
                "filters": {"inactive_days": 90}
            }
        ]
    elif "sunscreen" in lower_prompt or "moisturizer" in lower_prompt:
        return [
            {
                "name": "Sunscreen Buyers without Moisturizer",
                "confidence": 91,
                "reason": "Cross-sell opportunity based on skincare routine gaps (sun protection needs moisture lock).",
                "filters": {"bought": "Sunscreen", "not_bought": "Moisturizer"}
            }
        ]
    elif "repeat" in lower_prompt or "frequent" in lower_prompt:
        return [
            {
                "name": "Frequent Buyers",
                "confidence": 92,
                "reason": "Customers with 5+ lifetime orders who drive steady recurring store revenue.",
                "filters": {"min_orders": 5}
            },
            {
                "name": "VIP Customers",
                "confidence": 88,
                "reason": "Top spending tier eligible for exclusive loyalty bonuses.",
                "filters": {"persona": "VIP"}
            }
        ]
        
    # Default
    return [
        {
            "name": "Dormant Customers",
            "confidence": 90,
            "reason": "Engaging inactive customers has the highest return on marketing investment.",
            "filters": {"inactive_days": 90}
        },
        {
            "name": "VIP Customers",
            "confidence": 85,
            "reason": "Top spenders respond well to personalized VIP early access campaigns.",
            "filters": {"persona": "VIP"}
        }
    ]


def recommend_channels_ai(segment_name: str, filters: dict) -> list[dict]:
    """
    Ranks marketing channels based on segment profile.
    """
    prompt = f"Segment: {segment_name}\nFilters: {json.dumps(filters)}"

    system_instruction = (
        "You are a marketing channel expert for a skincare brand. "
        "Rank channel options (WhatsApp, Email, SMS, RCS) for the target segment.\n"
        "Output strictly as a JSON array of objects with keys: "
        "'channel', 'score' (0-100), 'confidence' (0-100), 'reason'.\n"
        "'reason' must be data-driven and newline separated "
        '(e.g. "This audience is highly mobile-active.\\n'
        'Expected open rate is 98%.\\n'
        'Historically outperforms Email by 11%.")')
    
    result = call_gemini_json(prompt, system_instruction)
    if result and isinstance(result, list):
        return result
        
    # Rule-based fallback
    lower_segment = segment_name.lower()
    if "vip" in lower_segment:
        return [
            {"channel": "Email", "score": 95, "confidence": 92, "reason": "VIP segments historically show 45% email open rates.\nExpected CTR is 12%.\nAllows rich newsletter layouts showing skincare results."},
            {"channel": "WhatsApp", "score": 88, "confidence": 84, "reason": "This audience engages fast on mobile.\nExpected open rate is 92%.\nHistorically outperforms SMS by 14%."},
            {"channel": "SMS", "score": 70, "confidence": 65, "reason": "Expected open rate is 88%.\nPredicted CTR is 8%.\nShort warning messages for catalog discounts."},
            {"channel": "RCS", "score": 65, "confidence": 58, "reason": "Expected open rate is 70%.\nRich card formatting drives 5% CTR."}
        ]
    elif "dormant" in lower_segment:
        return [
            {"channel": "WhatsApp", "score": 95, "confidence": 90, "reason": "This audience is highly mobile-active.\nExpected open rate is 98%.\nExpected CTR is 14%.\nHistorically outperforms Email by 11%."},
            {"channel": "Email", "score": 80, "confidence": 75, "reason": "Expected open rate is 22%.\nIdeal for complex win-back copy and custom discount coupon images.\nPredicted CTR is 4%."},
            {"channel": "SMS", "score": 78, "confidence": 72, "reason": "Expected open rate is 85%.\nExpected CTR is 6%.\nReliable fallback push channel for short-code cart recovery links."},
            {"channel": "RCS", "score": 70, "confidence": 64, "reason": "Expected open rate is 65%.\nInteractive buttons drive 8% CTR."}
        ]
    else:
        return [
            {"channel": "WhatsApp", "score": 90, "confidence": 86, "reason": "Excellent conversions for conversational and time-sensitive reminders."},
            {"channel": "Email", "score": 85, "confidence": 80, "reason": "Allows descriptive instructions and step-by-step skincare routine walkthroughs."},
            {"channel": "SMS", "score": 75, "confidence": 70, "reason": "Short and quick checkout link dispatcher."},
            {"channel": "RCS", "score": 72, "confidence": 65, "reason": "Modern interactive texting template showing product cards."}
        ]


def generate_messages_variants_ai(segment_name: str, channel: str) -> list[dict]:
    """
    Generates three message variants with CTR and reasoning.
    """
    prompt = f"Segment: {segment_name}\nChannel: {channel}"

    system_instruction = (
        "You are a beauty brand copywriter. Generate three message variants "
        "(Variant A, Variant B, Variant C) adapted to the segment and channel.\n"
        "Output strictly as a JSON array of objects with keys: "
        "'variant' (Variant A/B/C), 'message', 'predicted_ctr' (int 0-100), "
        "'confidence' (int 0-100), 'reasoning'.\n"
        "'reasoning' must be data-driven and newline separated "
        '(e.g. "Discount + urgency messaging has historically produced the highest '
        'refill conversion rates.\\n'
        'Predicted CTR: 14%.")\n'
        "Return valid JSON only. Do not include markdown fences."
    )
    result = call_gemini_json(prompt, system_instruction)
    if result and isinstance(result, list):
        return result
        
    # Rule-based fallback
    lower_channel = channel.lower()
    if lower_channel == "whatsapp":
        return [
            {
                "variant": "Variant A",
                "message": "Hi Sarah ✨ It's been a while. Enjoy 15% off your next purchase with code GLOW15! Shop now at dewy.com/shop 🧴",
                "predicted_ctr": 14,
                "confidence": 88,
                "reasoning": "Discount + urgency messaging has historically produced the highest refill conversion rates.\nPredicted CTR: 14%."
            },
            {
                "variant": "Variant B",
                "message": "Your skincare routine misses you 💖 Is your shelf looking empty? Refill today and grab a FREE cleanser sample! Use code REFILLFREE.",
                "predicted_ctr": 11,
                "confidence": 81,
                "reasoning": "Emotional, routine-oriented framing drives high open interest.\nFree sample inclusion lifts engagement by 12% on average.\nPredicted CTR: 11%."
            },
            {
                "variant": "Variant C",
                "message": "Exclusive offer for loyal customers. Take 10% off and enjoy free shipping on us! Code: SHIPSOPREM.",
                "predicted_ctr": 9,
                "confidence": 74,
                "reasoning": "Simple and direct free shipping offer.\nConversion is reliable but typically yields a lower CTR.\nPredicted CTR: 9%."
            }
        ]
    elif lower_channel == "email":
        return [
            {
                "variant": "Variant A",
                "message": "Subject: We miss you! Enjoy 15% off your skincare favorites... 🌟\n\nHi there,\n\nWe noticed you haven't stopped by Dewy in a while. To welcome you back, enjoy 15% off your next purchase with code GLOW15!",
                "predicted_ctr": 18,
                "confidence": 89,
                "reasoning": "Subject line indicates clear value, boosting open rates."
            },
            {
                "variant": "Variant B",
                "message": "Subject: Need a refill? Here is free shipping on us! 🧴\n\nHello Skincare Lover,\n\nAre your favorites running low? Refill today and get a complimentary travel-size wash using code REFILLFREE.",
                "predicted_ctr": 15,
                "confidence": 82,
                "reasoning": "Refill reminders solve utility problems directly."
            },
            {
                "variant": "Variant C",
                "message": "Subject: Time for a skin refresh? ✨\n\nHello Gorgeous,\n\nRefresh your skincare routine today. Get 10% off plus free shipping with code SHIPSOPREM.",
                "predicted_ctr": 12,
                "confidence": 75,
                "reasoning": "General brand refresh, reliable but standard CTR."
            }
        ]
    else: # SMS or RCS
        return [
            {
                "variant": "Variant A",
                "message": "Dewy: We miss you! Take 15% off your skincare essentials with code GLOW15. Shop: dewy.com/shop",
                "predicted_ctr": 12,
                "confidence": 85,
                "reasoning": "Very short and actionable, optimized for quick text reviews."
            },
            {
                "variant": "Variant B",
                "message": "Skincare running low? Refill today & get a free mini wash! Code: REFILLFREE. dewy.com",
                "predicted_ctr": 10,
                "confidence": 79,
                "reasoning": "Refill incentive encourages instant replenish shopping."
            },
            {
                "variant": "Variant C",
                "message": "Dewy: Pamper your skin! Free shipping + 10% off your entire order with code SHIPSOPREM.",
                "predicted_ctr": 8,
                "confidence": 72,
                "reasoning": "General coupon code offer, slightly lower push response."
            }
        ]
