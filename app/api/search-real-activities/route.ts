import { NextRequest, NextResponse } from "next/server"
import { searchViatorProducts, getPopularDestinations } from "@/lib/viator-helper"

interface RequestBody {
  location?: string
  budgetPerPerson?: number
  currency: string
  groupSize: string
  vibe?: string
  inspirationActivities?: any[]
}

// Helper function to truncate text
function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Helper function to format duration
function formatDuration(duration: any): string {
  if (!duration) return "Varies"
  
  if (duration.fixedDurationInMinutes) {
    const minutes = duration.fixedDurationInMinutes
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${remainingMinutes}m`
    }
  }
  
  if (duration.variableDurationFromMinutes) {
    const hours = Math.floor(duration.variableDurationFromMinutes / 60)
    return `${hours}+ hours`
  }
  
  return "Varies"
}

// Helper function to infer location type from tags
function inferLocationType(tags: number[] | undefined): string {
  // TODO: Map specific Viator tag IDs to types (requires /products/tags endpoint)
  // For now, return hybrid as default
  return "hybrid"
}

// Helper function to infer activity level from tags
function inferActivityLevel(tags: number[] | undefined): string {
  // TODO: Map specific Viator tag IDs to activity levels (requires /products/tags endpoint)
  // For now, return moderate as default
  return "moderate"
}

// Helper function to build preparation text
function buildPreparationText(product: any): string {
  const texts: string[] = []
  
  if (product.bookingConfirmationSettings?.confirmationType === "INSTANT") {
    texts.push("Instant confirmation")
  }
  
  if (product.cancellationPolicy?.type === "FREE_CANCELLATION") {
    texts.push("Free cancellation available")
  }
  
  if (texts.length === 0) {
    return "Check booking details carefully"
  }
  
  return texts.join(". ") + "."
}

// Helper function to select best image
function selectBestImage(images: any[] | undefined): string | undefined {
  if (!images || images.length === 0) return undefined
  
  // Try to find high-resolution image (width >= 1024)
  for (const img of images) {
    if (img.variants) {
      const highRes = img.variants.find((v: any) => v.width >= 1024)
      if (highRes) return highRes.url
    }
  }
  
  // Fallback to any available variant
  if (images[0]?.variants && images[0].variants.length > 0) {
    return images[0].variants[0].url
  }
  
  return undefined
}

// Helper function to extract readable tags
function extractReadableTags(viatorTags: number[] | undefined): string[] {
  // TODO: Fetch actual tag names from /products/tags endpoint
  // For now, return generic tags
  return ["Experience", "Activity"]
}

export async function POST(request: NextRequest) {
  let body: RequestBody | null = null
  
  try {
    const viatorEnvVars = Object.keys(process.env).filter(k => k.includes('VIATOR'))
    console.log("[Viator API] Available VIATOR env vars:", viatorEnvVars)
    console.log("[Viator API] Environment check:", {
      hasApiKey: !!process.env.VIATOR_API_KEY,
      hasBaseUrl: !!process.env.VIATOR_API_BASE_URL,
      apiKeyLength: process.env.VIATOR_API_KEY?.length || 0,
      apiKeyPreview: process.env.VIATOR_API_KEY 
        ? `${process.env.VIATOR_API_KEY.slice(0, 4)}...${process.env.VIATOR_API_KEY.slice(-4)}`
        : 'NOT SET',
      baseUrl: process.env.VIATOR_API_BASE_URL || 'using default'
    })

    try {
      body = await request.json()
      console.log("[Viator API] Request body received:", JSON.stringify(body, null, 2))
    } catch (parseError: any) {
      console.error("[Viator API] Failed to parse request body:", parseError.message)
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { location, budgetPerPerson, currency, groupSize, vibe, inspirationActivities } = body

    console.log("[Viator API] Extracted parameters:", { location, budgetPerPerson, currency, groupSize, vibe })

    if (!location) {
      console.warn("[Viator API] No location provided")
      return NextResponse.json(
        { success: false, error: "Location is required to search real activities" },
        { status: 400 }
      )
    }

    if (!process.env.VIATOR_API_KEY) {
      console.error("[Viator API] VIATOR_API_KEY is not set!")
      return NextResponse.json(
        { success: false, error: "Viator API is not configured. Please add VIATOR_API_KEY to your environment variables." },
        { status: 503 }
      )
    }

    const searchParams: any = {
      destination: location,
      currency: currency || "USD",
      count: 20
    }

    // Only add price filters if budget is provided and valid
    if (budgetPerPerson && !isNaN(Number(budgetPerPerson))) {
      const budget = typeof budgetPerPerson === 'string' ? parseFloat(budgetPerPerson) : budgetPerPerson
      searchParams.minPrice = Math.floor(budget * 0.3)
      searchParams.maxPrice = Math.ceil(budget * 2)
    }

    console.log("[Viator API] About to call searchViatorProducts with:", searchParams)

    let viatorResults: any
    try {
      viatorResults = await searchViatorProducts(searchParams)
      console.log("[Viator API] Search successful, got", viatorResults.products.length, "products")
    } catch (viatorError: any) {
      console.error("[Viator API] searchViatorProducts threw error:", {
        message: viatorError.message,
        stack: viatorError.stack,
        name: viatorError.name
      })
      
      // Re-throw to be caught by outer catch
      throw viatorError
    }

    console.log("[Viator API] Search results count:", viatorResults.products.length)

    // Handle empty results
    if (viatorResults.products.length === 0) {
      const popularDestinations = await getPopularDestinations(5)
      const message = location
        ? `No activities found in ${location}. Try adjusting your search criteria.`
        : "No activities found. Try being more specific with your location."
      
      return NextResponse.json(
        {
          success: false,
          message,
          suggestions: popularDestinations
        },
        { status: 404 }
      )
    }

    let activities: any[]
    try {
      activities = viatorResults.products.map((product: any) => {
        const reviewText = product.reviews?.totalReviews
          ? `Rated ${product.reviews.combinedAverageRating}/5 by ${product.reviews.totalReviews} travelers`
          : "New experience"

        return {
          id: product.productCode,
          name: product.title,
          experience: truncateText(product.description, 200),
          bestFor: `Ideal for ${groupSize} seeking ${vibe || 'memorable experiences'}. ${reviewText}`,
          cost: product.pricing?.summary?.fromPrice || 0,
          currency: currency,
          duration: formatDuration(product.duration),
          locationType: inferLocationType(product.tags),
          activityLevel: inferActivityLevel(product.tags),
          specialElement: product.highlights?.[0] || "Unique local experience",
          preparation: buildPreparationText(product),
          tags: extractReadableTags(product.tags),
          viatorUrl: product.productUrl,
          rating: product.reviews?.combinedAverageRating,
          reviewCount: product.reviews?.totalReviews,
          image: selectBestImage(product.images),
          isBookable: true
        }
      })
      console.log("[Viator API] Successfully transformed", activities.length, "activities")
    } catch (transformError: any) {
      console.error("[Viator API] Error transforming products:", {
        message: transformError.message,
        stack: transformError.stack
      })
      throw new Error("Failed to process activity data: " + transformError.message)
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      recommendations: {
        activities,
        proTips: [
          "Most Viator activities offer free cancellation up to 24 hours before",
          "Instant confirmation means you'll receive your voucher immediately",
          "Check meeting point details carefully before booking"
        ],
        refinementPrompts: [
          "Show only 5-star rated activities",
          "More budget-friendly options",
          "Full-day experiences only",
          "Instant confirmation only"
        ]
      },
      query: {
        location: location || "Worldwide",
        budget_per_person: budgetPerPerson,
        currency: currency,
        group_size: groupSize,
        vibe: vibe
      },
      isRealActivities: true,
      totalCount: viatorResults.totalCount
    })

  } catch (error: any) {
    console.error("[Viator API] ===== ERROR CAUGHT =====")
    console.error("[Viator API] Error type:", error.constructor.name)
    console.error("[Viator API] Error message:", error.message)
    console.error("[Viator API] Error stack:", error.stack)
    console.error("[Viator API] Request body was:", body ? JSON.stringify(body) : "null")
    console.error("[Viator API] ========================")

    if (error.message?.includes("VIATOR_API_KEY") || error.message?.includes("API key")) {
      return NextResponse.json(
        { success: false, error: "Viator API is not configured. Please contact support." },
        { status: 503 }
      )
    }

    if (error.message?.includes("Destination not found") || error.message?.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    if (error.message?.includes("Rate limit exceeded")) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Generic error with more details for debugging
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to search activities. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        debugInfo: {
          errorType: error.constructor.name,
          hasApiKey: !!process.env.VIATOR_API_KEY,
          requestedLocation: body?.location || 'unknown'
        }
      },
      { status: 500 }
    )
  }
}
