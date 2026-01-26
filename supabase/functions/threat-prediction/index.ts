import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  
  try {
    const { location, timeOfDay, recentAlerts, isLocationSharing, activeJourney } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Women Safety Device API key is not configured');
    }

    
    const currentHour = new Date().getHours();
    const timeContext = currentHour >= 22 || currentHour < 6 ? 'late night' : 
                        currentHour >= 18 ? 'evening' : 
                        currentHour >= 12 ? 'afternoon' : 'morning';

    const systemPrompt = `You are an AI safety analyst for a women's safety app called SafeHer. Your role is to analyze contextual data and predict potential safety threats.

Analyze the following user context and provide:
1. A threat level (low, moderate, high)
2. Specific safety recommendations (2-3 bullet points)
3. A brief safety tip relevant to their situation

Be helpful but not alarmist. Focus on practical, actionable advice.

Respond in JSON format:
{
  "threatLevel": "low" | "moderate" | "high",
  "riskFactors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "safetyTip": "A brief, actionable safety tip"
}`;

    const userContext = `
Current Context:
- Time: ${timeContext} (${currentHour}:00)
- Location sharing: ${isLocationSharing ? 'Enabled' : 'Disabled'}
- Active journey: ${activeJourney ? `Yes - traveling to ${activeJourney.destination}` : 'No'}
- Recent alerts in past 30 days: ${recentAlerts || 0}
- Current coordinates: ${location ? `${location.lat}, ${location.lng}` : 'Unknown'}

Analyze this context and provide threat prediction.`;

    console.log('Calling Women Safety Device AI for threat prediction...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI Response:', content);

    // Parse JSON from response
    let prediction;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      prediction = {
        threatLevel: "low",
        riskFactors: [],
        recommendations: ["Keep location sharing enabled", "Share your journey with trusted contacts"],
        safetyTip: "Stay aware of your surroundings and trust your instincts."
      };
    }

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in threat-prediction:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
