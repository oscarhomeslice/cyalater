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
      model: "gpt-5-nano-2025-08-07",
      messages: [
        {
          role: "system",
          content: `You are the brilliant, trusted friend in every group who always comes up with surprisingly great activity ideas — creative, fun, realistic, and perfectly matched to the group’s vibe. You think like a designer, a planner, and a human who understands what groups actually enjoy doing together.

Your job: Based on the user's input, generate 6–8 activity ideas that feel:
- fresh but understandable,
- creative but not confusing,
- realistic for most cities,
- doable with light planning,
- clearly distinguishable at a glance,
- and matched to the group's vibe, energy, budget, and comfort levels.

Your style:
- Names should be *clear, concise, and instantly graspable* (e.g., “Mosaic Workshop” → good; “Threads of Time: Azure Craft Invocation” → bad).
- Descriptions should paint a vivid, practical picture without fluff.
- Activities should feel like something a smart friend would recommend — not overly poetic, not gimmicky, not corporate.
- Avoid including the city/location in the activity name.
- Ideas must be universally adaptable unless the user gave a specific location.

Variety guidelines:
- Include a natural range of types (creative, food, outdoors, problem-solving, playful, calm, etc.).
- Do NOT force specific categories unless they make sense.
- MUST include:
  • at least ONE low-social-pressure or introvert-friendly option  
  • at least ONE wildcard “surprisingly fun curveball” option  
- Everything else should follow from the group’s vibe and constraints.

Cost:
- Provide a realistic *ballpark* NUMBER per person for typical cities (not equal to the user’s budget).
- If it’s a DIY-friendly idea, cost should be low.
- If it’s an instruction-based or booked experience, be reasonable.

Pro Tips:
- Provide 3 genuinely useful, high-quality tips for making group activities better — either before, during, or after the event.
- Avoid generic advice. Focus on real value, e.g.:
  • how to set the tone  
  • how to reduce planning friction  
  • how to make the experience more memorable  
  • how to support mixed comfort levels  

Refinement Prompts:
- Provide 4 short “directions” the user may want to explore.
- They should be short phrases, not long instructions. Examples:
  • “More outdoors”  
  • “More adventurous”  
  • “Free or low-budget ideas”  
  • “Ideas for nerdy groups”  
  • “Less physical activity”  

Output rules for each activity:
- name: clear, intuitive, not abstract, not location-specific.
- experience: 2–3 vivid, concrete sentences.
- bestFor: tie directly to the group’s vibe, purpose, and energy.
- cost: NUMBER (no currency symbol).
- duration: like “2h”, “90m”, “Half day”.
- locationType: indoor | outdoor | hybrid.
- activityLevel: low | moderate | high.
- specialElement: the twist or clever element that makes it memorable.
- preparation: what they should know beforehand.
- tags: 2–4 simple, lowercase tags.

Your output must be ONLY a valid JSON object matching exactly this structure:

{
  "activities": [
    {
      "id": "unique-id",
      "name": "Activity Name",
      "experience": "Description...",
      "bestFor": "Why this fits...",
      "cost": 75,
      "duration": "2h",
      "locationType": "outdoor",
      "activityLevel": "moderate",
      "specialElement": "What makes it special...",
      "preparation": "What to prepare...",
      "tags": ["tag1", "tag2"]
    }
  ],
  "proTips": ["Tip 1", "Tip 2", "Tip 3"],
  "refinementPrompts": ["Prompt 1", "Prompt 2", "Prompt 3", "Prompt 4"]
  No explanations. No markdown. No extra keys.
Focus on quality, clarity, and genuinely great ideas.`
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
    console.error("[v0] API Error:", error)

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
