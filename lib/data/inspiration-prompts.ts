export interface InspirationPrompt {
  id: string
  title: string
  description?: string
  location: string
  activityTypes: string[]
  estimatedBudget?: string
  vibe: string
}

export const INSPIRATION_PROMPTS: InspirationPrompt[] = [
  // European Destinations
  {
    id: "lisbon-surf-creative",
    title: "Creative offsite near Lisbon with surf sessions",
    location: "Lisbon",
    activityTypes: ["creative", "outdoor", "team-building", "surf"],
    estimatedBudget: "€80-120",
    vibe: "adventurous",
  },
  {
    id: "berlin-nature-retreat",
    title: "Nature retreat under €100pp within 2 hours of Berlin",
    location: "Berlin",
    activityTypes: ["nature", "retreat", "outdoor", "relaxation"],
    estimatedBudget: "€60-100",
    vibe: "relaxed",
  },
  {
    id: "alps-cabin-teambuilding",
    title: "Remote cabin with team-building in the Alps",
    location: "Alps",
    activityTypes: ["team-building", "mountain", "nature", "adventure"],
    estimatedBudget: "€100-150",
    vibe: "focused",
  },
  {
    id: "barcelona-food-culture",
    title: "Barcelona food & wine tour with cooking class",
    location: "Barcelona",
    activityTypes: ["food", "cultural", "celebration", "indoor"],
    estimatedBudget: "€70-110",
    vibe: "casual",
  },
  {
    id: "amsterdam-creative-workshop",
    title: "Amsterdam creative workshop with canal tour",
    location: "Amsterdam",
    activityTypes: ["creative", "cultural", "team-building", "outdoor"],
    estimatedBudget: "€60-90",
    vibe: "creative",
  },
  {
    id: "paris-culinary-adventure",
    title: "Parisian culinary experience with market visit",
    location: "Paris",
    activityTypes: ["food", "cultural", "celebration"],
    estimatedBudget: "€80-130",
    vibe: "professional",
  },
  {
    id: "porto-coastal-wine",
    title: "Coastal retreat in Porto with wine tasting",
    location: "Porto",
    activityTypes: ["coastal", "food", "relaxation", "outdoor"],
    estimatedBudget: "€70-100",
    vibe: "relaxed",
  },
  {
    id: "edinburgh-whisky-highland",
    title: "Edinburgh whisky trail & Highland adventure",
    location: "Edinburgh",
    activityTypes: ["cultural", "food", "nature", "adventure"],
    estimatedBudget: "€90-140",
    vibe: "adventurous",
  },
  {
    id: "copenhagen-design-innovation",
    title: "Copenhagen design thinking & innovation workshop",
    location: "Copenhagen",
    activityTypes: ["creative", "professional", "team-building", "indoor"],
    estimatedBudget: "€100-150",
    vibe: "professional",
  },
  {
    id: "prague-brewery-escape",
    title: "Prague brewery tour & escape room challenge",
    location: "Prague",
    activityTypes: ["team-building", "food", "cultural", "indoor"],
    estimatedBudget: "€50-80",
    vibe: "casual",
  },

  // Mediterranean & Southern Europe
  {
    id: "santorini-sunset-sailing",
    title: "Santorini sailing & sunset wine tasting",
    location: "Santorini",
    activityTypes: ["outdoor", "celebration", "food", "coastal"],
    estimatedBudget: "€120-180",
    vibe: "relaxed",
  },
  {
    id: "tuscany-villa-cooking",
    title: "Tuscan villa cooking retreat with vineyard tour",
    location: "Tuscany",
    activityTypes: ["food", "cultural", "relaxation", "nature"],
    estimatedBudget: "€100-160",
    vibe: "relaxed",
  },
  {
    id: "croatia-island-sailing",
    title: "Croatian island-hopping sailing adventure",
    location: "Croatia",
    activityTypes: ["outdoor", "adventure", "coastal", "team-building"],
    estimatedBudget: "€80-120",
    vibe: "adventurous",
  },
  {
    id: "mallorca-wellness-yoga",
    title: "Mallorca wellness retreat with yoga & meditation",
    location: "Mallorca",
    activityTypes: ["wellness", "relaxation", "nature", "outdoor"],
    estimatedBudget: "€90-140",
    vibe: "relaxed",
  },

  // Mountain & Adventure
  {
    id: "swiss-alps-skiing",
    title: "Swiss Alps winter sports & fondue experience",
    location: "Swiss Alps",
    activityTypes: ["adventure", "sports", "food", "mountain"],
    estimatedBudget: "€150-200",
    vibe: "adventurous",
  },
  {
    id: "dolomites-hiking-wellness",
    title: "Dolomites hiking retreat with spa sessions",
    location: "Dolomites",
    activityTypes: ["nature", "wellness", "outdoor", "mountain"],
    estimatedBudget: "€100-150",
    vibe: "focused",
  },
  {
    id: "pyrenees-rafting-camping",
    title: "Pyrenees white-water rafting & glamping",
    location: "Pyrenees",
    activityTypes: ["adventure", "outdoor", "sports", "nature"],
    estimatedBudget: "€70-110",
    vibe: "adventurous",
  },

  // UK & Ireland
  {
    id: "lake-district-hiking",
    title: "Lake District hiking & traditional pub experience",
    location: "Lake District",
    activityTypes: ["nature", "outdoor", "cultural", "food"],
    estimatedBudget: "€60-90",
    vibe: "casual",
  },
  {
    id: "dublin-craft-brewery",
    title: "Dublin craft brewery tour & Irish music session",
    location: "Dublin",
    activityTypes: ["cultural", "food", "celebration", "indoor"],
    estimatedBudget: "€50-80",
    vibe: "casual",
  },
  {
    id: "scottish-highlands-castle",
    title: "Scottish Highlands castle stay with outdoor pursuits",
    location: "Scottish Highlands",
    activityTypes: ["adventure", "cultural", "nature", "outdoor"],
    estimatedBudget: "€120-180",
    vibe: "adventurous",
  },

  // Remote & Virtual
  {
    id: "virtual-escape-global",
    title: "Virtual escape room challenge with global team",
    location: "Virtual",
    activityTypes: ["team-building", "indoor", "creative"],
    estimatedBudget: "$30-50",
    vibe: "professional",
  },
  {
    id: "virtual-cooking-chef",
    title: "Virtual cooking class with celebrity chef",
    location: "Virtual",
    activityTypes: ["food", "creative", "celebration"],
    estimatedBudget: "$40-70",
    vibe: "casual",
  },
  {
    id: "virtual-art-workshop",
    title: "Virtual art workshop & creative brainstorming",
    location: "Virtual",
    activityTypes: ["creative", "team-building", "indoor"],
    estimatedBudget: "$35-60",
    vibe: "creative",
  },

  // Unique Experiences
  {
    id: "iceland-northern-lights",
    title: "Iceland Northern Lights & hot springs adventure",
    location: "Iceland",
    activityTypes: ["adventure", "nature", "outdoor", "wellness"],
    estimatedBudget: "€150-220",
    vibe: "adventurous",
  },
  {
    id: "marrakech-cooking-souk",
    title: "Marrakech cooking class & souk treasure hunt",
    location: "Marrakech",
    activityTypes: ["cultural", "food", "team-building", "adventure"],
    estimatedBudget: "€60-100",
    vibe: "adventurous",
  },
  {
    id: "norway-fjord-kayaking",
    title: "Norwegian fjord kayaking & wilderness camping",
    location: "Norway",
    activityTypes: ["adventure", "nature", "outdoor", "sports"],
    estimatedBudget: "€100-150",
    vibe: "adventurous",
  },
  {
    id: "vienna-classical-concert",
    title: "Vienna classical concert & palace tour experience",
    location: "Vienna",
    activityTypes: ["cultural", "celebration", "indoor"],
    estimatedBudget: "€80-120",
    vibe: "professional",
  },
]

/**
 * Get N random inspiration prompts
 */
export function getRandomInspirations(count = 3): InspirationPrompt[] {
  const shuffled = [...INSPIRATION_PROMPTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get inspirations filtered by criteria
 */
export function getFilteredInspirations(
  filters: {
    budget?: number
    activityTypes?: string[]
    vibe?: string
  },
  count = 3,
): InspirationPrompt[] {
  let filtered = [...INSPIRATION_PROMPTS]

  // Filter by budget if specified
  if (filters.budget) {
    filtered = filtered.filter((prompt) => {
      if (!prompt.estimatedBudget) return true
      const budgetRange = prompt.estimatedBudget.match(/\d+/g)
      if (budgetRange) {
        const maxBudget = Number.parseInt(budgetRange[budgetRange.length - 1])
        return maxBudget <= filters.budget! * 1.2 // Allow 20% flexibility
      }
      return true
    })
  }

  // Filter by activity types if specified
  if (filters.activityTypes && filters.activityTypes.length > 0) {
    filtered = filtered.filter((prompt) => prompt.activityTypes.some((type) => filters.activityTypes!.includes(type)))
  }

  // Filter by vibe if specified
  if (filters.vibe) {
    const vibeFiltered = filtered.filter((prompt) => prompt.vibe === filters.vibe)
    if (vibeFiltered.length >= count) {
      filtered = vibeFiltered
    }
  }

  // Shuffle and return requested count
  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
