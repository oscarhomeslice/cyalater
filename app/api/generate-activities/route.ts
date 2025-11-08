import { type NextRequest, NextResponse } from "next/server"
import { generateActivityQuery, generateActivityRecommendations } from "@/lib/openai-helper"
import { getNearbyAttractions } from "@/lib/tripadvisor-helper"

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

    const { userInput } = await request.json()

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json({ error: "Please describe your group activity" }, { status: 400 })
    }

    if (userInput.trim().length < 20) {
      return NextResponse.json({ error: "Please provide more details (minimum 20 characters)" }, { status: 400 })
    }

    if (userInput.length > 300) {
      return NextResponse.json({ error: "Description is too long (maximum 300 characters)" }, { status: 400 })
    }

    // Step 1: Use OpenAI to parse user intent
    console.log("[v0] Parsing user input...")
    let parsedQuery
    try {
      parsedQuery = await generateActivityQuery(userInput)
      console.log("[v0] Parsed query:", parsedQuery)
    } catch (error: any) {
      console.error("[v0] OpenAI parsing error:", error)
      return NextResponse.json({ error: "AI service busy. Please try again in a moment." }, { status: 503 })
    }

    // Step 2: Query TripAdvisor based on parsed intent
    console.log("[v0] Searching TripAdvisor...")
    let tripAdvisorResults
    try {
      const location = parsedQuery.location || "popular destinations"
      tripAdvisorResults = await getNearbyAttractions(location, "attractions")

      console.log(`[v0] Found ${tripAdvisorResults.length} activities from TripAdvisor`)

      if (!tripAdvisorResults || tripAdvisorResults.length === 0) {
        return NextResponse.json(
          { error: "Couldn't find activities for this location. Try another city?" },
          { status: 404 },
        )
      }
    } catch (error: any) {
      console.error("[v0] TripAdvisor error:", error)
      return NextResponse.json(
        { error: "Couldn't find activities for this location. Try another city?" },
        { status: 404 },
      )
    }

    // Step 3: Use OpenAI to generate recommendations from TripAdvisor results
    console.log("[v0] Generating personalized recommendations...")
    let recommendations
    try {
      recommendations = await generateActivityRecommendations(userInput, tripAdvisorResults)

      if (!recommendations || !recommendations.activities || recommendations.activities.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No suitable activities found. Try adjusting your search criteria.",
          },
          { status: 200 },
        )
      }
    } catch (error: any) {
      console.error("[v0] OpenAI recommendation error:", error)
      return NextResponse.json({ error: "AI service busy. Please try again in a moment." }, { status: 503 })
    }

    // Step 4: Return formatted response
    return NextResponse.json({
      success: true,
      query: parsedQuery,
      recommendations,
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
