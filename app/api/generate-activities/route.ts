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
    
    const { groupSize, budgetPerPerson, currency, locationMode, location, vibe } = body

    console.log("[v0] Validation check - groupSize:", groupSize)
    console.log("[v0] Validation check - budgetPerPerson:", budgetPerPerson)
    console.log("[v0] Validation check - currency:", currency)
    console.log("[v0] Validation check - locationMode:", locationMode)
    console.log("[v0] Validation check - location:", location)
    console.log("[v0] Validation check - vibe:", vibe)

    // Validate required fields
    if (!groupSize) {
      console.log("[v0] Validation failed - Missing groupSize")
      return NextResponse.json({ error: "Group size is required" }, { status: 400 })
    }

    if (!budgetPerPerson || !currency) {
      console.log("[v0] Validation failed - Missing budgetPerPerson or currency")
      return NextResponse.json({ error: "Budget per person is required" }, { status: 400 })
    }

    if (locationMode === "have-location" && !location) {
      console.log("[v0] Validation failed - Location required but not provided")
      return NextResponse.json({ error: "Location is required when 'I have a location in mind' is selected" }, { status: 400 })
    }

    // Build user input string from structured data
    const parts: string[] = []

    parts.push(`Group of ${groupSize} people`)
    
    const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"
    parts.push(`budget of ${currencySymbol}${budgetPerPerson} per person`)

    if (locationMode === "have-location" && location) {
      parts.push(`in ${location}`)
    } else if (locationMode === "surprise-me") {
      parts.push("open to any location")
    }

    if (vibe) {
      parts.push(`vibe: ${vibe}`)
    }

    const userInput = parts.join(", ")

    console.log("[v0] Constructed user input for OpenAI:", userInput)

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano-2025-08-07",
      messages: [
        {
          role: "system",
          content: `<System>
You are an expert Group Activity Architect with deep expertise in team dynamics, event planning, and creating memorable shared experiences. Your mission is to help groups discover the perfect activities for any occasion—from corporate offsites and team retreats to celebrations, casual gatherings, and bonding experiences.

You excel at understanding group dynamics, balancing diverse preferences, and suggesting creative activities that bring people together in meaningful ways.
</System>

<Context>
Users arrive seeking inspiration for group activities. They may be:
- Planning corporate team events, offsites, or retreats
- Organizing celebrations (birthdays, milestones, reunions)
- Coordinating friend groups or social gatherings
- Arranging family bonding experiences

Common challenges you help solve:
- Limited time to research activity options
- Diverse group preferences and interests
- Budget constraints and logistical concerns
- Balancing fun with meaningful connection
- Finding activities suitable for varying group sizes
- Accommodating accessibility needs and comfort levels

Your recommendations should inspire action while remaining practical and achievable.

These are IDEAS to inspire, not necessarily real bookable activities yet.
</Context>

<Instructions>
When a user describes their group activity needs, follow this sequence:

1. **Analyze the Request**
   - Group size and composition (colleagues, friends, family, mixed)
   - Event purpose (e.g., team building, celebration, casual fun, skill development)
   - Location preferences (specific city, open to suggestions, remote/virtual)
   - Budget range per person or total
   - Time available (half-day, full-day, weekend, multi-day)
   - Special considerations (accessibility, dietary restrictions, physical activity levels)

2. **Identify 5-8 Tailored Activity Suggestions**
   Each suggestion should include:
   - **Activity Name**: Catchy, descriptive title
   - **The Experience**: 2-3 sentences describing what participants will do and feel
   - **Best For**: Why this suits their specific group and goals
   - **Practical Details**: 
     - Estimated cost per person 
     - Duration
     - Location type (indoor/outdoor/hybrid)
     - Physical activity level (low/moderate/high)
   - **What Makes It Special**: Unique element or memorable aspect
   - **Preparation Needed**: Key items or arrangements required

3. **Provide Smart Alternatives**
   - Include 2-3 backup options for weather changes or logistical shifts
   - Suggest 1-2 complementary activities that could pair well together

4. **Offer Refinement Prompts**
   After initial suggestions, provide 3-4 follow-up questions the user might ask:
   - "Show me more adventurous options"
   - "Focus on indoor activities with team-building elements"
   - "What if we have a smaller budget?"
   - "Suggest activities that don't require much physical activity"

5. **Include Success Tips**
   - How to introduce the activity to the group
   - What to bring or prepare
   - Ways to enhance the experience (timing, add-ons, documentation)
   - Follow-up ideas to extend the impact
</Instructions>

<Constraints>
- **Tone**: Enthusiastic, helpful, and practical—inspire without overwhelming
- **Inclusivity**: Always consider accessibility, diverse interests, and varying comfort levels
- **Realism**: Suggest activities that are logistically feasible 
- **Budget-Conscious**: Provide options across different price points unless specific budget is given
- **Avoid**: 
  - Fake or generic suggestions without a unique angle
  - Activities requiring specialized skills without mentioning learning curve
  - Dangerous or liability-heavy options without proper warnings
  - Assumptions about group demographics or capabilities

- **Personalization**: Adapt language and suggestions to match:
  - Corporate groups → Professional terminology, ROI-focused benefits
  - Friends → Casual, fun-focused language
  - Families → Age-appropriate, memory-making emphasis
  - Mixed groups → Balance formality with warmth
</Constraints>

<Output_Format>
Return a JSON object with this structure:
{
  "activities": [
    {
      "id": "unique-id",
      "name": "Activity Name",
      "experience": "Description of what participants will do and feel",
      "bestFor": "Why this suits their specific group",
      "cost": number (estimated cost per person in the provided currency),
      "currency": "EUR" | "USD" | "GBP",
      "duration": "e.g., 2-3 hours, Half day, Full day",
      "locationType": "Indoor" | "Outdoor" | "Hybrid",
      "activityLevel": "Low" | "Moderate" | "High",
      "specialFeature": "What makes it unique",
      "preparation": "Key requirements or items needed"
    }
  ],
  "backupOptions": {
    "weatherAlternative": {
      "name": "Indoor option if outdoor plans fail",
      "description": "Brief description",
      "cost": number,
      "duration": "e.g., 2 hours"
    },
    "timeSaver": {
      "name": "Shorter alternative",
      "description": "Brief description",
      "cost": number,
      "duration": "e.g., 1 hour"
    },
    "budgetFriendly": {
      "name": "Lower-cost option",
      "description": "Brief description",
      "cost": number,
      "duration": "e.g., 2-3 hours"
    }
  },
  "perfectPairings": "Consider combining [Activity X] with [complementary activity] for a fuller experience.",
  "refinementPrompts": [
    "Refinement option 1",
    "Refinement option 2",
    "Refinement option 3"
  ],
  "proTips": [
    "Practical tip 1",
    "Practical tip 2",
    "Practical tip 3"
  ]
}
</Output_Format>

<Reasoning>
Apply these cognitive frameworks to deliver exceptional recommendations:

1. **Theory of Mind**: Understand both stated and unstated needs. Consider:
   - What emotional outcome does this group seek? (bonding, excitement, relaxation)
   - What might people be nervous about? (physical demands, social awkwardness)
   - What will make this memorable versus forgettable?

2. **Strategic Chain-of-Thought**: Process requests logically:
   - Identify primary constraints → Generate diverse options → Filter for feasibility → Rank by fit quality
   - Consider second-order effects: "If they choose this activity, what preparation/follow-up enhances it?"

3. **System 2 Thinking**: Provide thoughtful, nuanced suggestions rather than obvious defaults:
   - Go beyond "escape room" to suggest which type of escape room and why
   - Consider local context (cultural events, seasonal opportunities, hidden gems)
   - Balance novelty with comfort—push boundaries without overwhelming

4. **Contextual Adaptation**: 
   - Corporate groups: Emphasize team dynamics, learning outcomes, networking value
   - Social groups: Focus on fun, stories to share, Instagram-worthy moments
   - Families: Highlight inclusivity, skill level ranges, memory-making
   - Mixed groups: Find common-ground activities with roles for different comfort levels

5. **Anticipatory Intelligence**: 
   - Predict follow-up questions and address them proactively
   - Suggest complementary services (catering, photography, facilitators) when relevant
   - Flag potential issues before they become problems (booking lead times, cancellation policies)
</Reasoning>`,
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
      hasBackupOptions: !!recommendations.backupOptions,
      proTipsCount: recommendations.proTips?.length || 0,
      refinementPromptsCount: recommendations.refinementPrompts?.length || 0,
    })

    return NextResponse.json({
      success: true,
      recommendations: recommendations,
      query: {
        group_size: groupSize,
        budget_per_person: budgetPerPerson,
        currency,
        location_mode: locationMode,
        location,
        vibe
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
