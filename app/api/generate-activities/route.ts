import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const rateLimit = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userRequests = rateLimit.get(ip) || []

  const recentRequests = userRequests.filter((time: number) => now - time < 60000)

  if (recentRequests.length >= 5) {
    return false
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
    
    const { groupSize, budgetPerPerson, currency = "EUR", location, vibe, category, activityType } = body

    // Validate required fields
    if (!groupSize || !groupSize.trim()) {
      return NextResponse.json({ error: "Group size is required" }, { status: 400 })
    }

    if (!budgetPerPerson || budgetPerPerson.trim() === "") {
      return NextResponse.json({ error: "Budget per person is required" }, { status: 400 })
    }

    if (!activityType || (activityType !== "diy" && activityType !== "experiences")) {
      return NextResponse.json({ error: "Activity type is required" }, { status: 400 })
    }

    const parts: string[] = []
    parts.push(`Group of ${groupSize}`)
    
    const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"
    parts.push(`${currencySymbol}${budgetPerPerson} per person budget`)

    if (activityType === "diy") {
      parts.push("looking for DIY activities they can organize themselves")
    } else {
      parts.push("looking for bookable experiences and tours")
    }

    if (location && location.trim()) {
      parts.push(`in ${location}`)
    } else {
      parts.push("location-flexible (activities that work anywhere)")
    }

    if (category && category !== "all") {
      const categoryMap: Record<string, string> = {
        "food-wine": "Food & Wine experiences",
        "outdoor": "Outdoor Adventures",
        "cultural": "Cultural Experiences",
        "water": "Water Activities",
        "adventure": "Adventure & Sports activities",
        "workshops": "Classes & Workshops"
      }
      parts.push(`focused on ${categoryMap[category] || category}`)
    }

    if (vibe && vibe.trim()) {
      parts.push(`vibe: ${vibe}`)
    }

    const userInput = parts.join(", ")
    console.log("[v0] Constructed user input for OpenAI:", userInput)

    const randomSeed = Date.now() + Math.random()

    const systemPrompt = `You are a creative group activity planner. Generate 6-8 diverse, realistic activity ideas that match the group's needs.

CRITICAL GUIDELINES:
- Names should be clear and concise (e.g., "Pottery Workshop" not "Mystical Clay Journey")
- AVOID overused suggestions like: escape rooms, painting & wine nights, basic cooking classes, go-karting UNLESS they have a unique twist
- Think of unexpected, memorable activities that still match the criteria
- Cost should be realistic ballpark number per person (not necessarily equal to budget)
- ${activityType === "diy" ? "Focus on activities they can organize themselves without booking" : "Focus on bookable experiences with venues/operators"}

VARIETY REQUIREMENTS:
- Include: creative expression, physical activity, social bonding, problem-solving, sensory experiences
- Must include: ONE introvert-friendly option, ONE surprising wildcard option
- Mix intensity levels: some calm, some energetic, some in-between
- Vary settings: indoor, outdoor, hybrid options

${location && location.trim() ? `LOCATION CONTEXT: Leverage ${location}'s unique culture, geography, climate, and local attractions for authentic suggestions.` : "LOCATION-FLEXIBLE: Suggest activities that work in most places or can be adapted to any location."}

${category && category !== "all" ? `CATEGORY FOCUS: Prioritize ${category} activities but include 1-2 activities from other categories for variety.` : ""}

Creative seed for uniqueness: ${randomSeed}

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 5000,
      temperature: 1.0,
      top_p: 0.95,
      frequency_penalty: 0.6,
      presence_penalty: 0.4,
      messages: [
        {
          role: "system",
          content: systemPrompt
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
        location: location || null,
        vibe: vibe || null,
        category: category || null,
        activity_type: activityType
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
