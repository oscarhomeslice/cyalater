import { NextResponse } from "next/server"
import { fetchDestinations, findDestinationId } from "@/lib/viator-helper"

export async function GET(request: Request) {
  try {
    console.log("[Test] Fetching Viator destinations...")
    
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("search")
    
    // Fetch all destinations
    const destinations = await fetchDestinations()
    
    // If a search query is provided, also test finding that destination
    let searchResult = null
    if (searchQuery) {
      console.log(`[Test] Searching for destination: "${searchQuery}"`)
      const destinationId = await findDestinationId(searchQuery)
      searchResult = {
        query: searchQuery,
        foundId: destinationId,
        foundDestination: destinationId 
          ? destinations.find(d => d.destinationId === destinationId)
          : null
      }
    }
    
    // Return detailed information
    return NextResponse.json({
      success: true,
      totalDestinations: destinations.length,
      searchResult,
      sampleDestinations: destinations.slice(0, 50), // First 50 destinations
      citiesCount: destinations.filter(d => d.destinationType === "CITY").length,
      countriesCount: destinations.filter(d => d.destinationType === "COUNTRY").length,
      regionCount: destinations.filter(d => d.destinationType === "REGION").length,
      popularCities: destinations
        .filter(d => d.destinationType === "CITY")
        .slice(0, 20)
        .map(d => ({
          id: d.destinationId,
          name: d.destinationName
        }))
    })
  } catch (error) {
    console.error("[Test] Error fetching destinations:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
