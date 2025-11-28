import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { EnrichedUserContext } from "@/lib/types"

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

const rateLimit = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userRequests = rateLimit.get(ip) || []

  // Filter requests from last minute
  const recentRequests = userRequests.filter((time: number) => now - time < 60000)

  if (recentRequests.length >= 5) {
    return false // Too many requests
  }

  recentRequests.push(now)
  rateLimit.set(ip, recentRequests)
  return true
}

function generateVarietySeed(): {
  creativeFocus: string
  distributionHint: string
  locationPrompt: string
} {
  const creativeFocuses = [
    "Think laterally - what would surprise them?",
    "Channel your inner creative chaos",
    "What would make this group talk about this for months?",
    "Forget trends - what's authentically memorable?",
    "Add an unexpected twist to familiar concepts",
    "What would YOU plan for YOUR best friends?",
  ]

  const distributionHints = [
    "Ensure at least 2 activities are completely different from typical suggestions",
    "Include one wildcard idea that challenges assumptions",
    "Mix intimacy levels - from cozy conversations to energetic group dynamics",
    "Vary the sensory experiences - tactile, visual, culinary, competitive",
    "Balance structured activities with freeform social time",
    "Include at least one option for introverts to shine",
  ]

  const locationPrompts = [
    "If location provided: weave in local culture, hidden gems, regional specialties",
    "If location provided: reference neighborhood vibes and local insider knowledge",
    "If location provided: consider seasonal events and local traditions",
    "If no location: design universally adaptable activities with local flavor anywhere",
    "If no location: focus on human connection over place-specific details",
  ]

  return {
    creativeFocus: creativeFocuses[Math.floor(Math.random() * creativeFocuses.length)],
    distributionHint: distributionHints[Math.floor(Math.random() * distributionHints.length)],
    locationPrompt: locationPrompts[Math.floor(Math.random() * locationPrompts.length)],
  }
}

function enrichUserContext(formData: any): EnrichedUserContext {
  const budgetNum = Number.parseFloat(formData.budgetPerPerson)

  // Derive budget tier
  let budgetTier: "budget" | "moderate" | "premium" | "luxury"
  if (budgetNum < 30) budgetTier = "budget"
  else if (budgetNum < 70) budgetTier = "moderate"
  else if (budgetNum < 150) budgetTier = "premium"
  else budgetTier = "luxury"

  // Derive group size category
  let groupSizeCategory: "intimate" | "small" | "medium" | "large"
  if (formData.groupSize === "2-5 people") groupSizeCategory = "intimate"
  else if (formData.groupSize === "6-10 people") groupSizeCategory = "small"
  else if (formData.groupSize === "11-20 people") groupSizeCategory = "medium"
  else groupSizeCategory = "large"

  // Derive seasonal context
  const month = new Date().getMonth() + 1
  let seasonalContext: string
  if ([12, 1, 2].includes(month)) seasonalContext = "winter"
  else if ([3, 4, 5].includes(month)) seasonalContext = "spring"
  else if ([6, 7, 8].includes(month)) seasonalContext = "summer"
  else seasonalContext = "fall"

  return {
    groupSize: formData.groupSize,
    budgetPerPerson: budgetNum,
    currency: formData.currency || "EUR",
    location: formData.location,
    activityCategory: formData.activityCategory,
    groupRelationship: formData.groupRelationship,
    timeOfDay: formData.timeOfDay,
    indoorOutdoor: formData.indoorOutdoor,
    accessibilityNeeds: formData.accessibilityNeeds,
    vibe: formData.vibe,
    budgetTier,
    groupSizeCategory,
    seasonalContext,
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] === NEW REQUEST STARTED ===")
    console.log("[API] Timestamp:", new Date().toISOString())

    if (!process.env.OPENAI_API_KEY || !openai) {
      console.error("[API] OPENAI_API_KEY is not configured")
      return NextResponse.json(
        {
          success: false,
          error: "AI service is not configured. Please contact support.",
          query: null,
        },
        { status: 503 },
      )
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Whoa! Too many requests. Wait 60 seconds and try again.",
          query: null,
        },
        { status: 429 },
      )
    }

    const body = await request.json()

    console.log("[API] Raw request body:", JSON.stringify(body, null, 2))

    const {
      groupSize,
      budgetPerPerson,
      currency = "EUR",
      location,
      activityCategory,
      groupRelationship,
      timeOfDay,
      indoorOutdoor,
      accessibilityNeeds,
      vibe,
    } = body

    console.log("[API] Extracted fields:", {
      groupSize,
      budgetPerPerson,
      currency,
      location,
      activityCategory,
      groupRelationship,
      timeOfDay,
      indoorOutdoor,
      accessibilityNeeds,
      vibe,
    })

    console.log("[v0] Received request body:", JSON.stringify(body, null, 2))

    console.log("[v0] Validation check - groupSize:", groupSize)
    console.log("[v0] Validation check - budgetPerPerson:", budgetPerPerson)
    console.log("[v0] Validation check - activityCategory:", activityCategory)

    // Validate required fields
    if (!groupSize?.trim()) {
      console.log("[v0] Validation failed - Missing groupSize")
      return NextResponse.json(
        {
          success: false,
          error: "Group size is required",
          query: { groupSize, budgetPerPerson, activityCategory },
        },
        { status: 400 },
      )
    }

    if (!budgetPerPerson || budgetPerPerson.toString().trim() === "") {
      console.log("[v0] Validation failed - Missing budgetPerPerson")
      return NextResponse.json(
        {
          success: false,
          error: "Budget per person is required",
          query: { groupSize, budgetPerPerson, activityCategory },
        },
        { status: 400 },
      )
    }

    // Validate budget is numeric and in range
    const budget = Number.parseFloat(budgetPerPerson)
    if (isNaN(budget) || budget < 0 || budget > 2000) {
      console.log("[v0] Validation failed - Budget out of range:", budget)
      return NextResponse.json(
        {
          success: false,
          error: "Budget must be between 0 and 2000",
          query: { groupSize, budgetPerPerson, activityCategory },
        },
        { status: 400 },
      )
    }

    if (!activityCategory || !["diy", "experience"].includes(activityCategory)) {
      console.log("[v0] Validation failed - Invalid activityCategory:", activityCategory)
      return NextResponse.json(
        {
          success: false,
          error: "Activity category is required (diy or experience)",
          query: { groupSize, budgetPerPerson, activityCategory },
        },
        { status: 400 },
      )
    }

    // Optional fields don't need validation, just pass through

    const enrichedContext = enrichUserContext(body)
    console.log("[API] Enriched context:", JSON.stringify(enrichedContext, null, 2))
    console.log("[API] Derived insights:", {
      budgetTier: enrichedContext.budgetTier,
      groupSizeCategory: enrichedContext.groupSizeCategory,
      seasonalContext: enrichedContext.seasonalContext,
    })

    const varietySeed = generateVarietySeed()
    console.log("[API] Variety seed generated:", {
      creativeFocus: varietySeed.creativeFocus,
      distributionHint: varietySeed.distributionHint,
      locationPrompt: varietySeed.locationPrompt,
    })

    const systemPrompt = `You are a wildly creative activity planner with eclectic taste and deep knowledge of how groups bond. Your job is to surprise users with activity ideas they haven't considered.

CONTEXT PROVIDED:
- Group: ${enrichedContext.groupSize} (${enrichedContext.groupSizeCategory} group dynamic)
- Budget: ${enrichedContext.currency}${enrichedContext.budgetPerPerson} per person (${enrichedContext.budgetTier} tier)
- Category: ${enrichedContext.activityCategory === "diy" ? "DIY - they organize themselves" : "Experience - they want to discover bookable options"}
${enrichedContext.location ? `- Location: ${enrichedContext.location} (weave in local cultural context and hidden gems)` : "- Location: Not specified (design universally adaptable activities)"}
${enrichedContext.groupRelationship ? `- Group Type: ${enrichedContext.groupRelationship}` : ""}
${enrichedContext.timeOfDay ? `- Preferred Time: ${enrichedContext.timeOfDay}` : ""}
${enrichedContext.indoorOutdoor ? `- Setting Preference: ${enrichedContext.indoorOutdoor}` : ""}
${enrichedContext.accessibilityNeeds ? `- Accessibility: ${enrichedContext.accessibilityNeeds}` : ""}
${enrichedContext.vibe ? `- Desired Vibe: ${enrichedContext.vibe} (let this be your creative North Star)` : ""}
- Season: ${enrichedContext.seasonalContext} (consider weather and seasonal opportunities)

VARIETY DIRECTIVES FOR THIS GENERATION:
${varietySeed.creativeFocus}
${varietySeed.distributionHint}
${varietySeed.locationPrompt}

YOUR MISSION:
Generate 6-8 activity ideas that feel FRESH, UNEXPECTED, and perfectly suited to their situation.

CRITICAL RULES:

1. AVOID THE OBVIOUS
   If your first instinct is generic (escape room, cooking class, paint night) - dig three levels deeper.
   What's the twist? What makes it memorable? What would make them say "I never would have thought of that"?

2. HONOR THE CATEGORY:
   
   For DIY activities:
   - These people are organizing it themselves
   - Provide the complete recipe/gameplan
   - Include SPECIFIC MATERIALS LIST in the "preparation" field
   - Examples of materials: "deck of cards, poster board, prizes", "ingredients for 3 courses", "craft supplies from hardware store"
   - Emphasize: resourcefulness, creativity, authentic bonding
   - Budget manifests as: simpler materials (budget) vs premium ingredients/supplies (luxury)
   
   For Experience activities:
   - These are things they'd discover and book through vendors
   - Describe what professionals typically handle
   - Include what's usually included in booking (guide, equipment, etc.)
   - These help them search for similar experiences later
   - Emphasize: convenience, expertise, unique access
   - Budget manifests as: group deals (budget) vs exclusive access (luxury)

3. LET PARAMETERS GUIDE YOU ORGANICALLY:
   - ${enrichedContext.groupSizeCategory} groups: ${
     enrichedContext.groupSizeCategory === "intimate"
       ? "Deep conversations, meaningful experiences, personal connections"
       : enrichedContext.groupSizeCategory === "small"
         ? "Interactive dynamics, everyone participates, flexible formats"
         : enrichedContext.groupSizeCategory === "medium"
           ? "Team challenges, organized structure, competitive elements welcome"
           : "Spectacle, clear facilitation, scalable logistics, subgroup activities"
   }
   - ${enrichedContext.budgetTier} budget: ${
     enrichedContext.budgetTier === "budget"
       ? "Scrappy brilliance, clever resourcefulness, DIY magic"
       : enrichedContext.budgetTier === "moderate"
         ? "Solid quality, thoughtful touches, good value"
         : enrichedContext.budgetTier === "premium"
           ? "Elevated experiences, premium materials, professional guidance"
           : "Luxury details, unique access, unforgettable moments"
   }

4. BE SPECIFIC AND EVOCATIVE:
   Paint the scene. Make them FEEL it. Use vivid, specific details.
   Bad: "Wine tasting event"
   Good: "Blind wine tournament with scorecards, regional cheese pairings, and a ridiculous trophy ceremony"

5. VARIETY DISTRIBUTION:
   - Include exactly 1 low-energy option (where people can actually talk)
   - Include at least 2 ideas that break conventional patterns
   - Mix activity levels: low, moderate, high
   - Vary settings if possible: indoor/outdoor/hybrid

6. SPECIAL CONSIDERATION:
   If this is a ${enrichedContext.groupRelationship || "group"}, tailor the social dynamics accordingly.
   ${enrichedContext.accessibilityNeeds ? `IMPORTANT: Ensure all suggestions accommodate: ${enrichedContext.accessibilityNeeds}` : ""}

OUTPUT FORMAT (JSON):
{
  "activities": [
    {
      "id": "unique-id",
      "name": "Punchy, intriguing name (NOT generic)",
      "experience": "2-3 sentences painting the scene and why it's special",
      "bestFor": "Why this perfectly fits their specific context",
      "cost": estimated_number_per_person,
      "duration": "realistic estimate (1h, 2.5h, Half day, Full day, Weekend)",
      "locationType": "indoor" | "outdoor" | "hybrid",
      "activityLevel": "low" | "moderate" | "high",
      "specialElement": "The ONE unforgettable detail",
      "preparation": "FOR DIY: Complete materials list with specifics. FOR EXPERIENCE: What's typically included in booking",
      "tags": ["2-4 relevant descriptors"]
    }
  ],
  "proTips": ["3-4 genuinely useful tips as plain strings"],
  "refinementPrompts": ["3-5 ways to adjust direction"]
}

Think like you're planning for friends who trust your taste. Be bold. Be specific. Above all: BE ORIGINAL.`

    console.log("[API] System prompt stats:", {
      length: systemPrompt.length,
      contextProvided: {
        hasLocation: !!enrichedContext.location,
        hasVibe: !!enrichedContext.vibe,
        hasAccessibility: !!enrichedContext.accessibilityNeeds,
        hasTimePreference: !!enrichedContext.timeOfDay,
        hasGroupType: !!enrichedContext.groupRelationship,
      },
    })

    const userMessage = `Generate ${enrichedContext.activityCategory === "diy" ? "DIY" : "bookable experience"} ideas for this group.`

    console.log("[API] Calling OpenAI with parameters:", {
      model: "gpt-4o-mini",
      temperature: 0.95,
      presence_penalty: 0.4,
      frequency_penalty: 0.3,
      top_p: 0.95,
      max_tokens: 5000,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 5000,
      temperature: 0.95,
      presence_penalty: 0.4,
      frequency_penalty: 0.3,
      top_p: 0.95,
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
      response_format: { type: "json_object" },
    })

    let recommendations
    try {
      recommendations = JSON.parse(completion.choices[0].message.content || "{}")
    } catch (parseError) {
      console.error("[API] Failed to parse OpenAI response:", parseError)
      console.error("[API] Raw response:", completion.choices[0].message.content)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse AI response. Please try again.",
          query: {
            group_size: groupSize,
            budget_per_person: budgetPerPerson,
            currency,
            location: location || null,
            activity_category: activityCategory,
          },
        },
        { status: 500 },
      )
    }

    console.log("[API] OpenAI response received:", {
      activitiesCount: recommendations.activities?.length || 0,
      proTipsCount: recommendations.proTips?.length || 0,
      refinementPromptsCount: recommendations.refinementPrompts?.length || 0,
      firstActivityName: recommendations.activities?.[0]?.name || "N/A",
      activityNames: recommendations.activities?.map((a: any) => a.name) || [],
      tokensUsed: completion.usage,
    })

    if (recommendations.activities && recommendations.activities.length > 0) {
      const originalCount = recommendations.activities.length

      recommendations.activities = recommendations.activities.filter((activity: any) => {
        const isValid =
          activity.name &&
          activity.name.trim() !== "" &&
          activity.name !== "Activity" &&
          activity.experience &&
          activity.experience.trim() !== "" &&
          activity.experience !== "Experience description coming soon" &&
          activity.bestFor &&
          activity.bestFor.trim() !== "" &&
          activity.cost &&
          activity.duration &&
          activity.duration !== "TBD" &&
          activity.specialElement &&
          activity.specialElement.trim() !== ""

        if (!isValid) {
          console.log("[API] Filtered out incomplete activity:", activity)
        }

        return isValid
      })

      const filteredCount = recommendations.activities.length

      if (filteredCount < originalCount) {
        console.log(
          `[API] Filtered out ${originalCount - filteredCount} incomplete activities. Remaining: ${filteredCount}`,
        )
      }

      if (filteredCount === 0) {
        console.error("[API] No valid activities after filtering")
        return NextResponse.json(
          {
            success: false,
            error: "No valid activities were generated. Please try again with different parameters.",
            query: {
              group_size: groupSize,
              budget_per_person: budgetPerPerson,
              currency,
              location: location || null,
              activity_category: activityCategory,
              group_relationship: groupRelationship || null,
              time_of_day: timeOfDay || null,
              indoor_outdoor: indoorOutdoor || null,
              accessibility_needs: accessibilityNeeds || null,
              vibe: vibe || null,
            },
          },
          { status: 500 },
        )
      }

      console.log("[API] Activity breakdown:")
      recommendations.activities.forEach((activity: any, index: number) => {
        console.log(`  [${index + 1}] ${activity.name}:`, {
          cost: activity.cost,
          duration: activity.duration,
          locationType: activity.locationType,
          activityLevel: activity.activityLevel,
          tags: activity.tags,
        })
      })
    }

    console.log("[API] === REQUEST COMPLETED SUCCESSFULLY ===\n")

    return NextResponse.json({
      success: true,
      recommendations: {
        activities: recommendations.activities || [],
        proTips: recommendations.proTips || [],
        refinementPrompts: recommendations.refinementPrompts || [],
      },
      query: {
        group_size: groupSize,
        budget_per_person: budgetPerPerson,
        currency,
        location: location || null,
        activity_category: activityCategory,
        group_relationship: groupRelationship || null,
        time_of_day: timeOfDay || null,
        indoor_outdoor: indoorOutdoor || null,
        accessibility_needs: accessibilityNeeds || null,
        vibe: vibe || null,
        enriched: {
          budget_tier: enrichedContext.budgetTier,
          group_size_category: enrichedContext.groupSizeCategory,
          seasonal_context: enrichedContext.seasonalContext,
        },
        variety_seed: varietySeed,
      },
    })
  } catch (error: any) {
    console.error("[API] === ERROR OCCURRED ===")
    console.error("[API] Error type:", error.constructor.name)
    console.error("[API] Error message:", error.message)
    console.error("[API] Error stack:", error.stack)

    let statusCode = 500
    let errorMessage = "Something went wrong. Please try again."

    if (error.code === "insufficient_quota" || error.message?.includes("quota")) {
      statusCode = 503
      errorMessage = "AI service quota exceeded. Please contact support."
    } else if (error.code === "invalid_api_key" || error.message?.includes("API key")) {
      statusCode = 503
      errorMessage = "AI service configuration error. Please contact support."
    } else if (error.name === "AbortError") {
      statusCode = 499
      errorMessage = "Request was cancelled."
    } else if (error.message?.includes("timeout")) {
      statusCode = 504
      errorMessage = "Request timed out. Please try again."
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        query: null,
      },
      { status: statusCode },
    )
  }
}
