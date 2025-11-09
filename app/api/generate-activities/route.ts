import { type NextRequest, NextResponse } from "next/server"
import { parseUserInput, generateRecommendations } from "@/lib/openai-helper"
import { searchActivities } from "@/lib/amadeus-helper"
import { createClient } from "@/lib/supabase/client"

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
  const startTime = Date.now()
  const supabase = createClient()

  const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous"
  const sessionId = crypto.randomUUID()

  try {
    if (!checkRateLimit(userIp)) {
      return NextResponse.json({ error: "Whoa! Too many requests. Wait 60 seconds and try again." }, { status: 429 })
    }

    const body = await request.json()
    let userInput: string

    if (typeof body.userInput === "string") {
      userInput = body.userInput
    } else if (body.formData) {
      const { groupSize, budgetPerPerson, currency, locationMode, location, inspirationPrompt, vibe } = body.formData

      const parts: string[] = []

      if (groupSize) parts.push(`Group of ${groupSize} people`)
      if (budgetPerPerson && currency) {
        const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"
        parts.push(`${symbol}${budgetPerPerson} per person`)
      }
      if (locationMode === "have-location" && location) {
        parts.push(`in ${location}`)
      } else if (inspirationPrompt) {
        parts.push(inspirationPrompt)
      }
      if (vibe) parts.push(vibe)

      userInput = parts.join(", ")
    } else {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    if (!userInput || userInput.trim().length < 10) {
      return NextResponse.json({ error: "Please provide more details about your group activity" }, { status: 400 })
    }

    if (userInput.length > 500) {
      return NextResponse.json({ error: "Description is too long (maximum 500 characters)" }, { status: 400 })
    }

    console.log("[v0] Parsing user input:", userInput)
    const parsedQuery = await parseUserInput(userInput)
    console.log("[v0] Parsed query:", parsedQuery)

    console.log("[v0] Searching Amadeus for:", parsedQuery.location)
    let amadeusResults: any[] = []

    if (
      parsedQuery.location &&
      parsedQuery.location !== "not_specified" &&
      parsedQuery.location !== "remote" &&
      parsedQuery.location !== "virtual"
    ) {
      amadeusResults = await searchActivities(parsedQuery.location, 30)
    }

    if (amadeusResults.length === 0) {
      console.log("[v0] No results for location, trying Paris...")
      amadeusResults = await searchActivities("Paris", 30)
    }

    console.log(`[v0] Found ${amadeusResults.length} activities from Amadeus`)

    if (amadeusResults.length === 0) {
      return NextResponse.json(
        { error: "No activities found. Try a different location or check back later." },
        { status: 404 },
      )
    }

    console.log("[v0] Generating personalized recommendations...")
    const recommendations = await generateRecommendations(userInput, parsedQuery, amadeusResults)

    if (!recommendations || !recommendations.activities || recommendations.activities.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No suitable activities found. Try adjusting your search criteria.",
        },
        { status: 200 },
      )
    }

    const { data: searchData } = await supabase
      .from("activity_searches")
      .insert({
        user_input: userInput,
        parsed_query: parsedQuery,
        location: parsedQuery.location,
        group_size: parsedQuery.group_size,
        budget_per_person: parsedQuery.budget_per_person,
        activity_type: parsedQuery.activity_type,
        results_count: recommendations.activities.length,
        user_ip: userIp,
        session_id: sessionId,
      })
      .select()
      .single()

    if (searchData) {
      const activitiesData = recommendations.activities.map((activity: any) => ({
        search_id: searchData.id,
        activity_name: activity.name,
        experience: activity.experience,
        best_for: activity.bestFor,
        cost: activity.cost,
        duration: activity.duration,
        location_type: activity.locationType,
        activity_level: activity.activityLevel,
        special_element: activity.specialElement,
        preparation: activity.preparation,
        amadeus_url: activity.bookingLink,
        amadeus_id: activity.amadeusId,
        rating: activity.rating,
        review_count: activity.reviewCount,
        raw_data: activity,
      }))

      await supabase.from("generated_activities").insert(activitiesData)
    }

    await supabase.from("api_usage").insert({
      endpoint: "/api/generate-activities",
      user_ip: userIp,
      session_id: sessionId,
      response_time_ms: Date.now() - startTime,
      status_code: 200,
    })

    return NextResponse.json({
      success: true,
      searchId: searchData?.id,
      query: parsedQuery,
      recommendations,
    })
  } catch (error: any) {
    console.error("[v0] API Error:", error)

    await supabase.from("api_usage").insert({
      endpoint: "/api/generate-activities",
      user_ip: userIp,
      session_id: sessionId,
      response_time_ms: Date.now() - startTime,
      status_code: 500,
      error_message: error.message,
    })

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
