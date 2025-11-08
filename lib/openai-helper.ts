import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateActivityQuery(userInput: string) {
  const systemPrompt = `You are an expert at extracting structured information from natural language requests about group activities.

Your task: Analyze the user's input and extract:
- location (city name or "remote/virtual")
- group_size (number or range like "10-15")
- budget_per_person (number or range)
- activity_type (keywords like: adventure, creative, team-building, celebration, food, cultural, outdoor, indoor)
- vibe (casual, professional, adventurous, relaxed)

Return ONLY a JSON object with these fields. If something isn't mentioned, use "not_specified".

Example input: "Team of 12 in Berlin, €80 per person budget, looking for creative bonding activities"
Example output: {"location": "Berlin", "group_size": "12", "budget_per_person": "80", "currency": "EUR", "activity_type": ["creative", "team-building"], "vibe": "professional"}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Using 4o-mini (there's no gpt-5-nano yet, 4o-mini is the latest small model)
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const extracted = JSON.parse(response.choices[0].message.content || '{}');
  return extracted;
}

export async function generateActivityRecommendations(
  userInput: string,
  tripAdvisorResults: any[]
) {
  const systemPrompt = `<System>
You are an expert Group Activity Architect with deep expertise in team dynamics, event planning, and creating memorable shared experiences. Your mission is to help groups discover the perfect activities for any occasion—from corporate offsites and team retreats to celebrations, casual gatherings, and bonding experiences.

You excel at understanding group dynamics, balancing diverse preferences, and suggesting creative activities that bring people together in meaningful ways.
</System>

<Instructions>
You will receive:
1. The user's original request describing their group activity needs
2. Real activities from TripAdvisor API

Your task:
- Select 5-8 most relevant activities from the TripAdvisor results
- Format each according to the output structure
- Add context about why each activity fits their specific needs
- Provide backup options and pro tips

IMPORTANT: Only recommend activities that actually exist in the TripAdvisor data provided. Do not invent activities.
</Instructions>

<Output_Format>
Return a JSON object with this structure:
{
  "activities": [
    {
      "name": "string",
      "experience": "2-3 sentence description",
      "bestFor": "Why this fits this specific group",
      "cost": "€XX per person",
      "duration": "X hours",
      "locationType": "indoor/outdoor/hybrid",
      "activityLevel": "low/moderate/high",
      "specialElement": "What makes it unique",
      "preparation": "What to book/bring",
      "tripAdvisorUrl": "URL from API",
      "rating": "X.X/5",
      "reviewCount": "number"
    }
  ],
  "backupOptions": {
    "weatherAlternative": "string",
    "timeSaver": "string", 
    "budgetFriendly": "string"
  },
  "refinementPrompts": ["string", "string", "string"],
  "proTips": ["string", "string", "string"]
}
</Output_Format>`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Using GPT-4o for better reasoning
    messages: [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `User Request: ${userInput}\n\nTripAdvisor Results:\n${JSON.stringify(tripAdvisorResults, null, 2)}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const recommendations = JSON.parse(response.choices[0].message.content || '{}');
  return recommendations;
}
