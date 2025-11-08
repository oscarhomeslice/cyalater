import OpenAI from "openai"
import type { EnrichedLocation } from "./types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ParsedQuery {
  location: string
  groupSize?: number
  budget?: number
  preferences?: string[]
  activityTypes?: string[]
  duration?: string
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
          content: `You are an expert at extracting structured information from natural language descriptions of group activities.
Extract the following information from the user's input:
- location: The city or destination (required)
- groupSize: Number of people (optional)
- budget: Budget per person in euros (optional)
- preferences: Array of preferences like "outdoor", "indoor", "creative", "adventurous", etc.
- activityTypes: Specific types of activities mentioned
- duration: Preferred duration if mentioned

Return ONLY a JSON object with these fields. If a field is not mentioned, omit it or set to null.`,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.3,
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
  enrichedLocations: EnrichedLocation[],
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
    const safeEnrichedLocations = Array.isArray(enrichedLocations) ? enrichedLocations : []

    if (!safeEnrichedLocations || safeEnrichedLocations.length === 0) {
      console.warn("[openai-helper] No enriched locations provided, will generate generic recommendations")
    }

    const safeLocationData = safeEnrichedLocations
      .slice(0, 15)
      .map((loc) => {
        if (!loc) return null
        return {
          name: loc.name || "Unknown Location",
          rating: loc.rating || 0,
          reviewCount: loc.reviewCount || 0,
          tripAdvisorUrl: loc.tripAdvisorUrl || "",
          image: loc.image || "",
          category: loc.category || "attraction",
          ranking: loc.ranking || "",
          locationId: loc.locationId || "",
        }
      })
      .filter(Boolean) // Remove any null entries

    let locationDataString = "[]"
    try {
      locationDataString = JSON.stringify(safeLocationData, null, 2)
    } catch (stringifyError) {
      console.error("[openai-helper] Failed to stringify location data:", stringifyError)
      locationDataString = "[]"
    }

    const systemPrompt = `You are an expert group activity planner. Based on the user's description and available TripAdvisor locations, recommend the best activities.

CRITICAL: Always use the exact "name" field from TripAdvisor data for each activity. DO NOT make up activity names.

Available TripAdvisor locations with enriched details:
${locationDataString}

Return a JSON object with:
{
  "activities": [
    {
      "id": "unique-id",
      "name": "EXACT name from TripAdvisor enriched data - DO NOT modify",
      "description": "Compelling description explaining why this is perfect for their group",
      "tags": ["Outdoor", "Adventure", "Team Building"] (2-3 relevant tags),
      "cost": estimated_cost_per_person_in_euros (number),
      "currency": "EUR",
      "duration": "2h" (estimated duration like "1h", "2h", "3h", "Half day", "Full day"),
      "activityLevel": "Low" | "Moderate" | "High",
      "locationType": "Indoor" | "Outdoor" | "Both",
      "specialFeature": "What makes this activity unique and memorable",
      "details": "Additional practical information and what to expect",
      "rating": preserve exact rating from enriched data,
      "reviewCount": preserve exact reviewCount from enriched data,
      "tripAdvisorUrl": preserve exact URL from enriched data,
      "image": preserve image URL from enriched data if available,
      "category": preserve category from enriched data,
      "ranking": preserve ranking from enriched data if available
    }
  ],
  "backupOptions": {
    "weatherAlternative": {
      "name": "Indoor alternative activity",
      "description": "Brief description",
      "cost": number,
      "duration": "2h"
    },
    "timeSaver": {
      "name": "Quick activity option",
      "description": "Brief description",
      "cost": number,
      "duration": "1h"
    },
    "budgetFriendly": {
      "name": "Affordable alternative",
      "description": "Brief description",
      "cost": number,
      "duration": "2h"
    }
  },
  "refinementPrompts": [
    "More adventurous options",
    "Indoor alternatives",
    "Budget-friendly choices"
  ] (3-5 suggestions),
  "proTips": [
    "Book popular attractions in advance to avoid disappointment",
    "Consider the activity level and ensure it matches your group's fitness",
    "Check the weather forecast and have backup plans"
  ] (3-4 practical tips as strings)
}

Guidelines:
- Select 6-8 activities that match the user's needs
- Prioritize highly-rated locations (4+ stars) from TripAdvisor
- USE THE EXACT "name" FIELD FROM TRIPADVISOR DATA - DO NOT CREATE NEW NAMES
- CRITICAL: You MUST include name (from TripAdvisor 'name' field), rating, reviewCount, tripAdvisorUrl, and image fields in every activity. Do not return any activity without a valid 'name'.
- Preserve all TripAdvisor fields: name, rating, reviewCount, tripAdvisorUrl, image, category, ranking
- Ensure variety in activity types and intensity levels
- Make descriptions compelling and specific to their group
- Pro tips should be plain strings, not objects`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `User request: "${userInput}"\n\nCreate personalized activity recommendations using the EXACT names from TripAdvisor data provided above. Preserve all enriched fields (name, rating, reviewCount, tripAdvisorUrl, image, category, ranking).`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    let recommendations: any = { activities: [] }
    try {
      recommendations = JSON.parse(completion.choices[0].message.content || "{}")
    } catch (parseError) {
      console.error("[openai-helper] Failed to parse OpenAI response:", parseError)
      throw new Error("Failed to parse AI recommendations")
    }

    if (recommendations.activities && Array.isArray(recommendations.activities)) {
      recommendations.activities = recommendations.activities.map((activity: any, index: number) => {
        const matchedLocation = safeEnrichedLocations.find(
          (loc) =>
            loc &&
            (loc.name === activity.name ||
              loc.locationId === activity.id ||
              loc.tripAdvisorUrl === activity.tripAdvisorUrl),
        )

        // Try to match with enriched location data
        if (matchedLocation) {
          activity.name = matchedLocation.name
          activity.rating = matchedLocation.rating
          activity.reviewCount = matchedLocation.reviewCount
          activity.tripAdvisorUrl = matchedLocation.tripAdvisorUrl
          activity.image = matchedLocation.image
          activity.category = matchedLocation.category
          activity.ranking = matchedLocation.ranking

          console.log(
            `[v0] ✅ Matched activity: ${activity.name} (${activity.rating}★, ${activity.reviewCount} reviews)`,
          )
        } else {
          console.warn(`[v0] ⚠️ No TripAdvisor match found for activity: ${activity.name}`)
        }

        return activity
      })
    }

    console.log("[v0] Generated recommendations:", {
      activitiesCount: recommendations.activities?.length || 0,
      activitiesWithNames: recommendations.activities?.filter((a: any) => a.name).length || 0,
      activitiesWithImages: recommendations.activities?.filter((a: any) => a.image).length || 0,
      activitiesWithRatings: recommendations.activities?.filter((a: any) => a.rating).length || 0,
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

// Keep the old function for backward compatibility
export async function generateRecommendations(
  userInput: string,
  enrichedLocations: EnrichedLocation[],
): Promise<{
  activities: any[]
  backupOptions?: any
  refinementPrompts?: string[]
  proTips?: string[]
}> {
  return generateActivityRecommendations(userInput, enrichedLocations)
}
