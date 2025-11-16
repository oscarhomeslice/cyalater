import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Whoa! Too many requests. Wait 60 seconds and try again." }, { status: 429 })
    }

    const body = await request.json()
    
    console.log("[v0] Received request body:", JSON.stringify(body, null, 2))
    
    const { groupSize, budgetPerPerson, currency = "EUR", locationMode, location, vibe } = body

    console.log("[v0] Validation check - groupSize:", groupSize)
    console.log("[v0] Validation check - budgetPerPerson:", budgetPerPerson)
    console.log("[v0] Validation check - locationMode:", locationMode)

    // Validate required fields
    if (!groupSize || !groupSize.trim()) {
      console.log("[v0] Validation failed - Missing groupSize")
      return NextResponse.json({ error: "Group size is required" }, { status: 400 })
    }

    if (!budgetPerPerson || budgetPerPerson.trim() === "") {
      console.log("[v0] Validation failed - Missing budgetPerPerson")
      return NextResponse.json({ error: "Budget per person is required" }, { status: 400 })
    }

    if (locationMode === "have-location" && (!location || !location.trim())) {
      console.log("[v0] Validation failed - Location required but not provided")
      return NextResponse.json({ error: "Location is required when 'I have a location in mind' is selected" }, { status: 400 })
    }

    // Build user input string from structured data
    const parts: string[] = []
    parts.push(`Group of ${groupSize}`)
    
    const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"
    parts.push(`${currencySymbol}${budgetPerPerson} per person budget`)

    if (locationMode === "have-location" && location) {
      parts.push(`in ${location}`)
    } else if (locationMode === "surprise-me") {
      parts.push(`any location worldwide`)
    }

    if (vibe && vibe.trim()) {
      parts.push(`vibe: ${vibe}`)
    }

    const userInput = parts.join(", ")
    console.log("[v0] Constructed user input for OpenAI:", userInput)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2500,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `You are a creative group activity planner. Generate 6-8 diverse, realistic activity ideas that match the group's needs.

Guidelines:
- Names should be clear and concise (e.g., "Pottery Workshop" not "Mystical Clay Journey")
- Include variety: creative, outdoor, food, problem-solving, playful, calm activities
- Must include: ONE introvert-friendly option, ONE surprising wildcard option
- Cost should be realistic ballpark number per person (not necessarily equal to budget)
- Activities should be doable in most cities unless specific location given

Output ONLY valid JSON:
{
  "activities": [
    {
      "id": "unique-id",
      "name": "Activity Name",
      "experience": "2-3 concrete sentences describing the activity",
      "bestFor": "Why this fits the group",
      "cost": 50,
      "duration": "2h",
      "locationType": "indoor",
      "activityLevel": "moderate",
      "specialElement": "What makes it memorable",
      "preparation": "What to know beforehand",
      "tags": ["tag1", "tag2"]
    }
  ],
  "proTips": ["Tip 1", "Tip 2", "Tip 3"],
  "refinementPrompts": ["More outdoors", "Lower budget", "More adventurous", "Calmer vibe"]
}

No markdown, no explanations, just JSON.`
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      response_format: { type: "json_object" },
    })

    const recommendations = JSON.parse(completion.choices[0].message.content || "{}")

    console.log("[v0] Generated recommendations:", {
      activitiesCount: recommendations.activities?.length || 0,
      proTipsCount: recommendations.proTips?.length || 0,
      refinementPromptsCount: recommendations.refinementPrompts?.length || 0,
    })

    return NextResponse.json({
      success: true,
      recommendations: {
        activities: recommendations.activities || [],
        proTips: recommendations.proTips || [],
        refinementPrompts: recommendations.refinementPrompts || []
      },
      query: {
        group_size: groupSize,
        budget_per_person: budgetPerPerson,
        currency,
        location_mode: locationMode,
        location: location || null,
        vibe: vibe || null
      }
    })
  } catch (error: any) {
    console.error("[API Error]:", error)

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
