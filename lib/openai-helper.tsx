import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ParsedQuery {
  location: string
  groupSize?: number
  budget?: number
  currency?: string
  preferences?: string[]
  activityTypes?: string[]
  duration?: string
  vibe?: string
}

interface ErrorResponse {
  success: false
  error: string
  recommendations: {
    activities: any[]
    backupOptions: {}
    proTips: string[]
    refinementPrompts: string[]
  }
}

export async function generateActivityQuery(
  userInput: string,
): Promise<ParsedQuery | { success: false; error: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured information from natural language requests about group activities.

Your task: Analyze the user's input and extract:
- location (city name, country, or "remote/virtual" or "not_specified")
  * If input mentions "near [city]" extract that city
  * If input is an inspiration prompt like "Creative offsite near Lisbon", extract "Lisbon"
- groupSize (extract the number or range, e.g., "2-5", "10", "11-20")
- budget (extract just the number, no currency symbol)
- currency (EUR, USD, GBP - infer from context or symbols like €, $, £)
- activityTypes (array of keywords like: adventure, creative, team-building, celebration, food, cultural, outdoor, indoor, sports, wellness, surf, mountain, coastal, nature, retreat, workshop)
- vibe (casual, professional, adventurous, relaxed, creative, focused)
- duration (half-day, full-day, multi-day, weekend, or "not_specified")
- preferences (array of other relevant preferences)

Special handling for inspiration prompts:
- "Creative offsite near Lisbon with surf" → location: "Lisbon", activityTypes: ["creative", "team-building", "surf", "outdoor"]
- "Nature retreat under €100pp near Berlin" → location: "Berlin", activityTypes: ["nature", "retreat", "outdoor"], budget: 100, currency: "EUR"
- "Remote cabin team-building Alps" → location: "Alps", activityTypes: ["team-building", "nature", "mountain"]

Return ONLY a JSON object with these exact fields.`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      response_format: { type: "json_object" },
    })

    const parsed = JSON.parse(completion.choices[0].message.content || "{}")

    // Ensure location exists
    if (!parsed.location) {
      parsed.location = "popular destinations"
    }

    console.log("[v0] Parsed user query:", parsed)
    return parsed
  } catch (error: any) {
    console.error("[OpenAI Error] Failed to parse user query:", error.message)
    return {
      success: false,
      error: `Failed to understand your request: ${error.message || "Unknown error"}`,
    }
  }
}

export async function generateActivityRecommendations(
  userInput: string,
  amadeusResults: any[], // Changed from enrichedLocations to match Amadeus data
): Promise<
  | {
      activities: any[]
      backupOptions?: any
      refinementPrompts?: string[]
      proTips?: string[]
    }
  | ErrorResponse
> {
  try {
    const safeAmadeusResults = Array.isArray(amadeusResults) ? amadeusResults : []

    if (!safeAmadeusResults || safeAmadeusResults.length === 0) {
      console.warn("[openai-helper] No Amadeus results provided, cannot generate recommendations")
    }

    const systemPrompt = `<System>
You are an expert Group Activity Architect with deep expertise in team dynamics, event planning, and creating memorable shared experiences.
</System>

<Context>
You will receive:
1. The user's original request
2. Real activities from Amadeus API

Your task is to select 5-8 most relevant activities from the Amadeus data and format them according to the output structure.
</Context>

<Instructions>
CRITICAL: Only recommend activities that ACTUALLY EXIST in the Amadeus data provided. Do not invent activities.

For each activity from Amadeus data:
1. Use the actual name from the API
2. Use the shortDescription as the base for your experience description
3. Expand on why this fits their group's specific needs
4. Extract price information (price.amount and price.currencyCode)
5. Estimate duration from minimumDuration field or make reasonable estimate
6. Determine if indoor/outdoor/hybrid based on activity type
7. Rate physical activity level: low/moderate/high based on description
8. Identify what makes this unique from the description
9. Create practical preparation steps

Amadeus API provides:
- name: Activity title
- shortDescription: Brief description
- description: Longer description (if available)
- rating: User rating (0-5 scale)
- price.amount: Cost
- price.currencyCode: Currency
- bookingLink: Direct booking URL
- pictures: Array of image URLs
- geoCode: Latitude/longitude
- minimumDuration: Minimum time needed

Format price as: "€XX per person" or "$XX per person" based on currencyCode.
Use rating field directly (it's already 0-5 scale).
Include bookingLink as the activity URL for users to book.

Provide backup options for weather changes and budget constraints.
Suggest 3-4 refinement prompts they might ask next.
Give 3 practical pro tips for their specific situation.
</Instructions>

<Output_Format>
Return a JSON object with this exact structure:
{
  "activities": [
    {
      "name": "Activity name from Amadeus",
      "experience": "2-3 sentence engaging description based on shortDescription",
      "bestFor": "Why this fits this specific group",
      "cost": "€XX per person" or "Free" or "Price varies",
      "duration": "X hours" (from minimumDuration or estimated),
      "locationType": "indoor" or "outdoor" or "hybrid",
      "activityLevel": "low" or "moderate" or "high",
      "specialElement": "What makes it unique",
      "preparation": "What to book/bring in advance",
      "amadeusUrl": "bookingLink from API",
      "amadeusId": "id from API",
      "rating": 4.5,
      "reviewCount": null,
      "pictures": ["array of image URLs from API"]
    }
  ],
  "backupOptions": {
    "weatherAlternative": "Description of indoor backup option",
    "timeSaver": "Description of shorter alternative",
    "budgetFriendly": "Description of lower-cost option"
  },
  "refinementPrompts": [
    "Show me more adventurous options",
    "Focus on indoor activities",
    "What about something unique?"
  ],
  "proTips": [
    "Book at least 2 weeks in advance for group discounts",
    "Consider morning slots for better weather",
    "Bring water and snacks for outdoor activities"
  ]
}
</Output_Format>`

    const userMessage = `User Request: "${userInput}"

Amadeus Activities Available:
${JSON.stringify(safeAmadeusResults, null, 2)}

Select the best 5-8 activities from this Amadeus data and format them according to the structure.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 3000,
    })

    let recommendations: any = { activities: [] }
    try {
      recommendations = JSON.parse(completion.choices[0].message.content || "{}")
    } catch (parseError) {
      console.error("[openai-helper] Failed to parse OpenAI response:", parseError)
      throw new Error("Failed to parse AI recommendations")
    }

    console.log("[v0] Generated recommendations from Amadeus data:", {
      activitiesCount: recommendations.activities?.length || 0,
      activitiesWithNames: recommendations.activities?.filter((a: any) => a.name).length || 0,
      hasBackupOptions: !!recommendations.backupOptions,
      proTipsCount: recommendations.proTips?.length || 0,
      refinementPromptsCount: recommendations.refinementPrompts?.length || 0,
    })

    return recommendations
  } catch (error: any) {
    console.error("[OpenAI Error] Failed to generate recommendations:", error.message)
    return {
      success: false,
      error: error.message || "Failed to generate recommendations",
      recommendations: {
        activities: [],
        backupOptions: {},
        proTips: [],
        refinementPrompts: [],
      },
    }
  }
}

export { generateActivityQuery as parseUserInput, generateActivityRecommendations as generateRecommendations }
