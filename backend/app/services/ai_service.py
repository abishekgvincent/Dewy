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
