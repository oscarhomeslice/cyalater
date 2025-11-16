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
  try {
    const body: RequestBody = await request.json()
    const { location, budgetPerPerson, currency, groupSize, vibe, inspirationActivities } = body

    console.log("[Viator API] Incoming request:", { location, budgetPerPerson, currency, groupSize, vibe })

    // Calculate search date range
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Calculate price range from budgetPerPerson
    let minPrice: number | undefined
    let maxPrice: number | undefined
    
    if (budgetPerPerson) {
      minPrice = Math.floor(budgetPerPerson * 0.5)
      maxPrice = Math.ceil(budgetPerPerson * 1.5)
    }

    // Call searchViatorProducts
    const viatorResults = await searchViatorProducts({
      destination: location,
      minPrice,
      maxPrice,
      currency,
      startDate,
      endDate,
      count: 12,
      confirmationType: "INSTANT"
    })

    console.log("[Viator API] Search results count:", viatorResults.products.length)

    // Handle empty results
    if (viatorResults.products.length === 0) {
      const popularDestinations = await getPopularDestinations(5)
      const message = location
        ? `No activities found in ${location}. Try adjusting your budget or dates.`
        : "No activities found. Try being more specific with your location."
      
      return NextResponse.json(
        {
          success: false,
          message,
          suggestions: popularDestinations.map(d => d.destinationName)
        },
        { status: 404 }
      )
    }

    // Transform Viator products to our activity format
    const activities = viatorResults.products.map((product: any) => {
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
    console.error("[Viator API] Error:", error)

    // Handle specific error types
    if (error.message?.includes("Destination not found")) {
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

    // Generic error
    return NextResponse.json(
      { success: false, error: "Failed to search activities. Please try again." },
      { status: 500 }
    )
  }
}
