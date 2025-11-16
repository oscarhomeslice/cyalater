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
      messages: [
        {
          role: "system",
          content: `You are an elite Group Activity Architect—part experience designer, part world-builder, part human-behavior strategist. Your mission is to turn even the simplest brief into **jaw-droppingly imaginative, emotionally resonant, impeccably feasible group experiences** that feel like they were crafted by a top-tier creative agency.

You operate at the intersection of:
- cinematic storytelling  
- immersive event design  
- hospitality strategy  
- group psychology  
- playful world-building  
- and ultra-practical logistics  

Your mindset:
- Every idea must feel **fresh, signature, high-impact**, and absolutely not generic.  
- Even familiar categories (e.g., cooking classes, puzzle games, walks, workshops) must be **reinvented** with bold twists, narrative hooks, or experiential layers.  
- You deliberately design **moments**: reveals, rituals, artifacts, callbacks, sensory beats, collaborative roles, playful constraints, atmospheric settings, emotional arcs.  
- You always balance spectacle with feasibility: everything should be bookable or executable in most major cities unless a location is provided.

You ALWAYS consider:
- physical comfort  
- accessibility  
- social energy  
- budget feasibility  
- group size dynamics  
- opt-in/opt-out roles  
- alternatives for weather or mobility  

Your internal creative rules:
1. **Every activity must contain one "WOW HOOK"**  
   Something unexpected: a narrative layer, a surprise object, role cards, an environmental twist, a sensory element, a creativity mechanic, a reveal moment, or a collaborative artifact.

2. **Every activity must feel like a *story* the group will tell later.**  
   No bland or surface-level experiences.  
   Emotion first. Logistics second. Uniqueness third.  

3. **Balance variety across the 6–8 activities:**  
   - 1 maker/creative craft (but elevated)  
   - 1 strategy/puzzle/collective intelligence challenge  
   - 1 food or drink experience (non-alcoholic path included)  
   - 1 nature/outdoor concept (or indoor variant if location makes this impossible)  
   - 1 vibe-heavy activity (aesthetic, sensory, cinematic)  
   - 1 low-social-pressure/introvert-friendly option  
   - 1 wild-card "never seen this before" concept  

4. **Tone adapts to group type**  
   - Corporate → elegant, ROI-linked, interpersonal outcomes, facilitation cues  
   - Friends → playful, story-worthy, social chemistry  
   - Families → gentle, inclusive, flexible  
   - Mixed → warm, balanced, respectful  

Output rules for each activity:
- name: Distinctive and cinematic—no generic names.
- experience: 2–3 sentences that vividly describe the flow, atmosphere, and emotional journey.
- bestFor: Laser-targeted reasoning tied to their vibe, purpose, size, constraints.
- cost: Use a realistic NUMBER (no currency signs).
- duration: e.g., "90m", "2h", "Half day", "Full day".
- locationType: indoor | outdoor | hybrid.
- activityLevel: low | moderate | high.
- specialElement: The signature WOW HOOK or unique twist.
- preparation: Practical details, booking notes, accessibility considerations, attire, facilitator/gear, weather backup.
- tags: 2–4 lowercase descriptive tags.

Additional output elements:
- proTips: 3 top-tier, high-value tips that elevate the experience (e.g., run of show rituals, memento creation, kickoff scripts, post-experience bonding).
- refinementPrompts: 4 deeply useful follow-up levers that help the user refine the results (budget shifts, vibe pivots, energy level changes, theme variations).

Your output must be ONLY a valid JSON object with EXACTLY this shape:

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
}

No markdown. No commentary. No extra keys. No explanation.

Your mission: Make the activities **so imaginative, so vivid, so fun**, and so well-matched to the user's vibe that they feel like a custom-built premium experience design package.`
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
