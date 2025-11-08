// Mock data for simulated AI responses
// This file will be replaced with actual AI API calls in production

export interface Activity {
  id: string
  title: string
  description: string
  tags: string[]
  cost: number
  currency: string
  duration: string
  activityLevel: "Low" | "Moderate" | "High"
  locationType: "Indoor" | "Outdoor"
  specialFeature: string
  details: string
}

export interface MockResponse {
  activities: Activity[]
  backupOptions: Activity[]
  proTips: string[]
  refinementPrompts: string[]
}

// Preset 1: Corporate team in Berlin, €100 budget
const corporateBerlinResponse: MockResponse = {
  activities: [
    {
      id: "corp-1",
      title: "Berlin Street Art & Graffiti Workshop",
      description:
        "Transform your team into street artists with a guided graffiti workshop in Berlin's famous urban art district. Learn spray paint techniques from local artists and create a collaborative mural.",
      tags: ["Creative", "Outdoor", "Team Building", "Cultural"],
      cost: 75,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Moderate",
      locationType: "Outdoor",
      specialFeature:
        "Your team mural gets professionally photographed and each participant receives a custom canvas piece to take home.",
      details:
        "Includes all materials, protective gear, professional instruction from Berlin street artists, and refreshments. Perfect for teams of 8-20 people. Weather backup plan included with indoor studio option.",
    },
    {
      id: "corp-2",
      title: "Escape Room: Cold War Spy Mission",
      description:
        "Immerse your team in Berlin's history with this Cold War-themed escape room. Work together to decode secret messages, navigate through a recreated East Berlin apartment, and complete your spy mission.",
      tags: ["Team Building", "Adventure", "Historical", "Indoor"],
      cost: 45,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Features authentic Cold War artifacts and technology. Teams receive a debriefing session with historical context and team performance analysis.",
      details:
        "Includes pre-game briefing with historical context, 75-minute game time, and post-game analysis. Available in English and German. Photo opportunities in period costume included.",
    },
    {
      id: "corp-3",
      title: "Spree River Team Kayaking",
      description:
        "Paddle through Berlin's waterways as a team, exploring the city from a unique perspective. Navigate past government buildings, museums, and historic sites while building team coordination.",
      tags: ["Outdoor", "Active", "Team Building", "Sightseeing"],
      cost: 65,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Moderate",
      locationType: "Outdoor",
      specialFeature:
        "Includes a surprise stop at a riverside beer garden with traditional German snacks and team photo session at the Oberbaum Bridge.",
      details:
        "All equipment provided including life jackets and waterproof bags. Professional guide with historical commentary. Suitable for beginners. May-September only.",
    },
    {
      id: "corp-4",
      title: "Berlin Food Market Challenge",
      description:
        "Split into teams and compete in a culinary scavenger hunt through Berlin's famous street food markets. Taste, discover, and learn about the city's diverse food culture.",
      tags: ["Food", "Cultural", "Team Building", "Social"],
      cost: 55,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Low",
      locationType: "Outdoor",
      specialFeature:
        "Teams use a custom app to complete challenges, earn points, and discover hidden food gems. Winners receive a gourmet food basket.",
      details:
        "Includes market entry, food vouchers worth €20 per person, digital scavenger hunt app, and guide. Covers 3-4 different markets. Dietary accommodations available.",
    },
    {
      id: "corp-5",
      title: "Innovation Workshop at Startup Campus",
      description:
        "Spend an afternoon at one of Berlin's famous startup campuses learning design thinking and innovation methodologies. Work on real business challenges in a creative environment.",
      tags: ["Creative", "Team Building", "Professional Development", "Indoor"],
      cost: 95,
      currency: "EUR",
      duration: "4h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Led by successful startup founders. Teams develop and pitch ideas, with the winning concept receiving mentorship and potential implementation support.",
      details:
        "Includes workshop materials, lunch, coffee, and access to startup campus facilities. Professional facilitator with startup experience. Takeaway innovation toolkit provided.",
    },
    {
      id: "corp-6",
      title: "Berlin Wall History Bike Tour",
      description:
        "Cycle along the former Berlin Wall route, stopping at key historical sites. Learn about the city's division and reunification while enjoying a healthy team activity.",
      tags: ["Outdoor", "Active", "Cultural", "Historical"],
      cost: 50,
      currency: "EUR",
      duration: "4h",
      activityLevel: "Moderate",
      locationType: "Outdoor",
      specialFeature:
        "Includes audio guide with survivor stories, photo stops at iconic locations, and a traditional German lunch at a historic restaurant.",
      details:
        "All bikes and helmets provided. Professional historian guide. Covers 15km at leisurely pace. Suitable for all fitness levels. Rain gear available.",
    },
  ],
  backupOptions: [
    {
      id: "corp-backup-1",
      title: "Virtual Reality Team Building",
      description:
        "Experience cutting-edge VR technology with multiplayer team challenges in a premium Berlin VR arcade.",
      tags: ["Indoor", "Team Building", "Technology"],
      cost: 55,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Moderate",
      locationType: "Indoor",
      specialFeature: "Latest VR technology with exclusive corporate team challenges and performance analytics.",
      details: "All equipment provided. No prior VR experience needed. Includes refreshments and team photo.",
    },
    {
      id: "corp-backup-2",
      title: "Craft Beer Brewing Workshop",
      description: "Learn the art of craft beer brewing from Berlin's master brewers and create your own team brew.",
      tags: ["Creative", "Social", "Food"],
      cost: 70,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature: "Your team's beer recipe is brewed professionally and delivered to your office in 4 weeks.",
      details: "Includes all ingredients, equipment, tasting session, and lunch. Custom labels for your team brew.",
    },
  ],
  proTips: [
    "Berlin venues often offer group discounts for 10+ people. Don't hesitate to negotiate, especially for weekday bookings.",
    "Many outdoor activities in Berlin have excellent indoor alternatives. Always ask about weather backup options when booking.",
    "Consider booking activities in the former East Berlin districts (Friedrichshain, Kreuzberg) for more authentic and budget-friendly experiences.",
  ],
  refinementPrompts: [
    "Make it more adventurous",
    "Keep it indoors",
    "More budget-friendly",
    "Add team-building focus",
    "Include food & drinks",
    "Focus on Berlin history",
  ],
}

// Preset 2: Friend group celebration, Barcelona, adventurous
const friendsBarcelonaResponse: MockResponse = {
  activities: [
    {
      id: "bcn-1",
      title: "Coasteering Adventure at Costa Brava",
      description:
        "Jump off cliffs, swim through caves, and climb rocky coastlines in this adrenaline-pumping adventure along Barcelona's stunning coast. Perfect for thrill-seekers who want an unforgettable experience.",
      tags: ["Outdoor", "Adventure", "Active", "Water Sports"],
      cost: 85,
      currency: "EUR",
      duration: "4h",
      activityLevel: "High",
      locationType: "Outdoor",
      specialFeature:
        "Includes GoPro footage of your jumps and climbs, plus a beachside paella feast to celebrate your adventure.",
      details:
        "All safety equipment provided including wetsuits and helmets. Professional guides with rescue certification. Transportation from Barcelona included. Swimming ability required.",
    },
    {
      id: "bcn-2",
      title: "Sunset Sailing & Beach Party",
      description:
        "Charter a private sailboat for your group and cruise the Mediterranean at sunset. Swim in hidden coves, enjoy drinks on deck, and finish with a beach bonfire party.",
      tags: ["Outdoor", "Relaxing", "Social", "Water Sports", "Party"],
      cost: 95,
      currency: "EUR",
      duration: "5h",
      activityLevel: "Low",
      locationType: "Outdoor",
      specialFeature:
        "Includes unlimited sangria, DJ on the boat, and a surprise fireworks display at sunset. Professional photographer captures your celebration.",
      details:
        "Private boat for up to 12 people. Includes captain, drinks, snacks, and beach party setup. Bluetooth speakers for your playlist. Towels and snorkel gear provided.",
    },
    {
      id: "bcn-3",
      title: "Barcelona Tapas & Flamenco Night",
      description:
        "Experience authentic Spanish culture with a guided tapas crawl through Barcelona's Gothic Quarter, ending with a passionate flamenco show and dance lesson.",
      tags: ["Cultural", "Food", "Social", "Party", "Indoor"],
      cost: 75,
      currency: "EUR",
      duration: "4h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "VIP seating at the flamenco show, unlimited wine during tapas, and a private dance lesson from professional flamenco dancers.",
      details:
        "Includes 5 tapas stops with drinks, flamenco show tickets, and dance lesson. Local guide shares hidden gems and history. Vegetarian options available.",
    },
    {
      id: "bcn-4",
      title: "Montserrat Hiking & Wine Tasting",
      description:
        "Hike the dramatic mountain trails of Montserrat, visit the famous monastery, then descend to a family vineyard for wine tasting and traditional Catalan lunch.",
      tags: ["Outdoor", "Adventure", "Food", "Cultural", "Active"],
      cost: 90,
      currency: "EUR",
      duration: "8h",
      activityLevel: "Moderate",
      locationType: "Outdoor",
      specialFeature:
        "Includes monastery tour with choir performance (if available), 6 wine tastings, and a surprise visit to a local cheese maker.",
      details:
        "Transportation from Barcelona included. Professional guide. Moderate 2-hour hike with stunning views. Lunch features local specialties. Suitable for most fitness levels.",
    },
    {
      id: "bcn-5",
      title: "E-Bike Tour to Secret Beaches",
      description:
        "Explore Barcelona's coastline on electric bikes, discovering hidden beaches and local spots tourists never find. Stop for swimming, snacks, and photo opportunities.",
      tags: ["Outdoor", "Active", "Adventure", "Sightseeing"],
      cost: 65,
      currency: "EUR",
      duration: "4h",
      activityLevel: "Moderate",
      locationType: "Outdoor",
      specialFeature:
        "Includes a secret beach BBQ with local delicacies, waterproof phone cases for photos, and a custom map of hidden spots to explore later.",
      details:
        "E-bikes make it easy for all fitness levels. Includes helmet, lock, and waterproof bag. Guide shares local knowledge and best photo spots. Covers 25km.",
    },
    {
      id: "bcn-6",
      title: "Paintball Battle at Abandoned Factory",
      description:
        "Compete in an epic paintball tournament in a massive abandoned factory complex. Multiple game modes, professional equipment, and bragging rights for the winning team.",
      tags: ["Adventure", "Active", "Team Building", "Outdoor"],
      cost: 55,
      currency: "EUR",
      duration: "3h",
      activityLevel: "High",
      locationType: "Outdoor",
      specialFeature:
        "Includes unlimited paintballs, action camera footage edited into a highlight reel, and winners receive custom champion medals.",
      details:
        "All equipment and protective gear provided. Multiple game scenarios. Includes 500 paintballs per person. Refreshments and changing facilities available.",
    },
    {
      id: "bcn-7",
      title: "Helicopter Tour & Rooftop Celebration",
      description:
        "See Barcelona from above with a private helicopter tour, then land on an exclusive rooftop for champagne and celebration with panoramic city views.",
      tags: ["Adventure", "Luxury", "Sightseeing", "Party"],
      cost: 180,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Low",
      locationType: "Outdoor",
      specialFeature:
        "Includes professional aerial photography, champagne toast on exclusive rooftop, and VIP access to a rooftop club afterward.",
      details:
        "15-minute helicopter flight over Barcelona landmarks. Rooftop venue with DJ and premium drinks. Perfect for special celebrations. Weather dependent.",
    },
  ],
  backupOptions: [
    {
      id: "bcn-backup-1",
      title: "Indoor Skydiving Experience",
      description:
        "Feel the thrill of skydiving without jumping from a plane in Barcelona's state-of-the-art wind tunnel.",
      tags: ["Indoor", "Adventure", "Active"],
      cost: 70,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Moderate",
      locationType: "Indoor",
      specialFeature: "Includes video of your flights, professional instruction, and certificate of completion.",
      details: "All equipment provided. No experience needed. Multiple flights per person. Spectator area for friends.",
    },
    {
      id: "bcn-backup-2",
      title: "Escape Room: Gaudi's Secret",
      description: "Solve puzzles inspired by Gaudi's architecture in this Barcelona-themed escape room adventure.",
      tags: ["Indoor", "Adventure", "Team Building"],
      cost: 35,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature: "Features actual Gaudi-inspired art and architecture. Winners receive Gaudi museum tickets.",
      details: "Available in multiple languages. Difficulty adjustable. Includes pre-game drinks and post-game photos.",
    },
  ],
  proTips: [
    "Barcelona's best weather is May-June and September-October. Avoid August when locals are on vacation and prices peak.",
    "Book water activities for morning slots - the Mediterranean is calmest before noon and you'll avoid afternoon crowds.",
    "Many Barcelona venues offer 'celebration packages' for groups. Mention it's a special occasion for complimentary extras like champagne or desserts.",
  ],
  refinementPrompts: [
    "More water activities",
    "Add nightlife options",
    "Include cultural experiences",
    "Make it more relaxing",
    "Focus on food & wine",
    "Extreme adventure only",
  ],
}

// Preset 3: Family gathering, remote/virtual, low budget
const familyRemoteResponse: MockResponse = {
  activities: [
    {
      id: "remote-1",
      title: "Virtual Cooking Class: Family Recipes",
      description:
        "Connect with family members across the globe by cooking the same meal together. A professional chef guides everyone through a family-friendly recipe via video call.",
      tags: ["Creative", "Food", "Social", "Virtual"],
      cost: 15,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Chef helps adapt the recipe for different skill levels and dietary needs. Everyone eats together at the end via video call.",
      details:
        "Ingredient list sent 3 days in advance. Works on Zoom, Teams, or Google Meet. Includes recipe cards and cooking tips PDF. Suitable for ages 8+.",
    },
    {
      id: "remote-2",
      title: "Online Family Trivia Night",
      description:
        "Custom trivia game featuring questions about your family history, inside jokes, and shared memories. Hosted by a professional game master with fun graphics and music.",
      tags: ["Social", "Games", "Virtual", "Fun"],
      cost: 8,
      currency: "EUR",
      duration: "1.5h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Includes custom questions based on family photos and stories you submit. Winners receive digital certificates and bragging rights.",
      details:
        "Professional host manages technical aspects. Interactive scoreboard. Breakout rooms for team rounds. Works with any video platform. All ages welcome.",
    },
    {
      id: "remote-3",
      title: "Virtual Escape Room: Family Mystery",
      description:
        "Solve puzzles together in this family-friendly online escape room. Work as a team across different locations to crack codes and solve the mystery.",
      tags: ["Games", "Team Building", "Virtual", "Adventure"],
      cost: 12,
      currency: "EUR",
      duration: "1.5h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Story can be customized with family member names and inside jokes. Includes digital photo booth at the end.",
      details:
        "No downloads required - plays in browser. Professional game master guides you. Difficulty adjustable for mixed ages. Includes hints system.",
    },
    {
      id: "remote-4",
      title: "Online Art Class: Paint Together",
      description:
        "Create art together with a professional artist guiding your family through a painting session. Everyone creates the same piece and shares results at the end.",
      tags: ["Creative", "Relaxing", "Social", "Virtual"],
      cost: 18,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Artist provides step-by-step guidance suitable for all skill levels. Includes digital gallery to share your finished paintings.",
      details:
        "Supply list sent in advance (basic materials under €10). Recorded session available for 7 days. Suitable for ages 6+. No experience needed.",
    },
    {
      id: "remote-5",
      title: "Virtual Scavenger Hunt",
      description:
        "Race against family members to find items in your homes based on creative clues. Hilarious challenges and photo opportunities throughout.",
      tags: ["Games", "Fun", "Social", "Virtual", "Active"],
      cost: 5,
      currency: "EUR",
      duration: "1h",
      activityLevel: "Moderate",
      locationType: "Indoor",
      specialFeature:
        "Includes surprise challenges like 'recreate a family photo' and 'show your worst fashion choice'. Automatic photo collage created.",
      details:
        "Professional host keeps energy high. Works on any video platform. Suitable for all ages. No preparation needed. Instant replay of funniest moments.",
    },
    {
      id: "remote-6",
      title: "Online Bingo & Storytelling Night",
      description:
        "Play bingo together while family members share stories from the past. Each bingo number triggers a story prompt or memory sharing.",
      tags: ["Social", "Games", "Relaxing", "Virtual"],
      cost: 6,
      currency: "EUR",
      duration: "1.5h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Digital bingo cards with family-themed squares. Stories are recorded and compiled into a family memory video.",
      details:
        "Printable bingo cards provided. Host facilitates story sharing. Multiple rounds with different themes. All ages welcome. Small prizes for winners.",
    },
  ],
  backupOptions: [
    {
      id: "remote-backup-1",
      title: "Virtual Movie Watch Party",
      description: "Watch a family-friendly movie together using synchronized streaming with video chat sidebar.",
      tags: ["Relaxing", "Social", "Virtual"],
      cost: 0,
      currency: "EUR",
      duration: "2.5h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature: "Includes movie voting system and synchronized playback so everyone watches together.",
      details: "Works with Netflix, Disney+, or Amazon Prime. Free browser extension. Includes chat and reactions.",
    },
    {
      id: "remote-backup-2",
      title: "Online Karaoke Party",
      description: "Sing together using a virtual karaoke platform with thousands of songs and video features.",
      tags: ["Fun", "Social", "Virtual", "Party"],
      cost: 10,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature: "Includes duet features, scoring system, and recordings of performances to share later.",
      details: "Huge song library in multiple languages. Works on any device. No downloads needed. All ages welcome.",
    },
  ],
  proTips: [
    "Send calendar invites with time zone conversions to avoid confusion. Include a backup time in case someone can't make it.",
    "Test technology 15 minutes before the event. Have a backup communication method (like a family group chat) ready.",
    "Keep virtual events under 2 hours for best engagement. Consider scheduling a break for longer activities.",
  ],
  refinementPrompts: [
    "More interactive games",
    "Add creative activities",
    "Focus on storytelling",
    "Include kids activities",
    "Make it more relaxing",
    "Add competitive elements",
  ],
}

// Preset 4: Friend group, Amsterdam, creative vibe
const friendsAmsterdamResponse: MockResponse = {
  activities: [
    {
      id: "ams-1",
      title: "Canal House Art Workshop",
      description:
        "Create your own masterpiece in a historic Amsterdam canal house. Professional artist guides you through painting techniques while you enjoy wine and cheese.",
      tags: ["Creative", "Social", "Cultural", "Indoor"],
      cost: 65,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Your paintings are professionally framed and shipped to you. Includes unlimited wine and a cheese board from local artisans.",
      details:
        "All materials provided. No experience needed. Intimate group size (max 12). Located in authentic 17th-century canal house. Take your painting home same day.",
    },
    {
      id: "ams-2",
      title: "Vintage Bike Tour & Photography Walk",
      description:
        "Explore Amsterdam's most photogenic spots on vintage Dutch bikes. Professional photographer teaches composition and captures your group at iconic locations.",
      tags: ["Outdoor", "Creative", "Sightseeing", "Active"],
      cost: 55,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Moderate",
      locationType: "Outdoor",
      specialFeature:
        "Includes professional photos of your group, Instagram-worthy location guide, and a surprise stop at a hidden garden cafe.",
      details:
        "Vintage bikes and baskets provided. Photography tips throughout. Covers 15km at leisurely pace. Includes coffee break. All photos delivered within 48 hours.",
    },
    {
      id: "ams-3",
      title: "Craft Cocktail Making Workshop",
      description:
        "Learn mixology from Amsterdam's top bartenders in a speakeasy-style venue. Create and taste 4 signature cocktails while learning the art of drink crafting.",
      tags: ["Creative", "Social", "Food", "Indoor"],
      cost: 70,
      currency: "EUR",
      duration: "2.5h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Includes recipe cards for all cocktails, a custom shaker to take home, and VIP entry to the bar afterward.",
      details:
        "Professional bartender instruction. All ingredients and tools provided. Learn garnishing and presentation. Includes appetizers. Located in trendy Jordaan district.",
    },
    {
      id: "ams-4",
      title: "Street Art & Graffiti Tour + Workshop",
      description:
        "Discover Amsterdam's vibrant street art scene with a local artist, then create your own piece in a legal graffiti zone. Learn techniques and take home your canvas.",
      tags: ["Creative", "Cultural", "Outdoor", "Active"],
      cost: 60,
      currency: "EUR",
      duration: "4h",
      activityLevel: "Moderate",
      locationType: "Outdoor",
      specialFeature:
        "Your group creates a collaborative mural that's photographed and turned into prints for everyone. Includes all spray paint and materials.",
      details:
        "Professional street artist guide. All safety equipment provided. Tour covers NDSM wharf and other art districts. Canvas pieces to take home. Weather backup available.",
    },
    {
      id: "ams-5",
      title: "Cheese & Gin Tasting Experience",
      description:
        "Combine two Dutch specialties: artisan cheese and craft gin. Expert guides you through pairings in a historic tasting room with canal views.",
      tags: ["Food", "Social", "Cultural", "Indoor"],
      cost: 75,
      currency: "EUR",
      duration: "2h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Includes 6 cheese and gin pairings, a surprise jenever tasting, and a gift box of your favorite pairing to take home.",
      details:
        "Expert sommelier and cheese master. Located in 400-year-old building. Learn about Dutch cheese-making traditions. Vegetarian-friendly. Small group experience.",
    },
    {
      id: "ams-6",
      title: "Pottery & Wine Evening",
      description:
        "Get your hands dirty creating ceramic pieces on a pottery wheel while enjoying unlimited wine. Relaxed, creative atmosphere perfect for friends.",
      tags: ["Creative", "Social", "Relaxing", "Indoor"],
      cost: 68,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature:
        "Your creations are fired, glazed, and delivered to you within 2 weeks. Includes unlimited wine and a cheese platter.",
      details:
        "Professional potter instruction. All materials included. No experience needed. Aprons provided. Pieces can be shipped internationally. Cozy studio atmosphere.",
    },
    {
      id: "ams-7",
      title: "Canal Boat Picnic & Music",
      description:
        "Rent a private electric boat and cruise Amsterdam's canals with a gourmet picnic basket, Bluetooth speakers, and your own captain.",
      tags: ["Outdoor", "Relaxing", "Social", "Food"],
      cost: 85,
      currency: "EUR",
      duration: "3h",
      activityLevel: "Low",
      locationType: "Outdoor",
      specialFeature:
        "Includes gourmet picnic from local deli, unlimited drinks, and a surprise stop at a floating flower market.",
      details:
        "Private boat for up to 8 people. Captain handles navigation. Bluetooth speakers for your playlist. Blankets and cushions provided. Sunset timing available.",
    },
  ],
  backupOptions: [
    {
      id: "ams-backup-1",
      title: "Immersive Van Gogh Experience",
      description:
        "Step into Van Gogh's paintings with this cutting-edge digital art exhibition featuring floor-to-ceiling projections.",
      tags: ["Cultural", "Creative", "Indoor"],
      cost: 25,
      currency: "EUR",
      duration: "1.5h",
      activityLevel: "Low",
      locationType: "Indoor",
      specialFeature: "Includes VR experience of Van Gogh's studio and a drink at the exhibition cafe.",
      details: "Self-paced exploration. Perfect for photos. Audio guide included. Located in city center.",
    },
    {
      id: "ams-backup-2",
      title: "Vintage Shopping Tour",
      description: "Explore Amsterdam's best vintage and thrift shops with a local fashion expert as your guide.",
      tags: ["Creative", "Social", "Cultural"],
      cost: 20,
      currency: "EUR",
      duration: "2.5h",
      activityLevel: "Moderate",
      locationType: "Indoor",
      specialFeature: "Includes styling tips, discount vouchers for featured shops, and coffee break at trendy cafe.",
      details: "Visit 5-6 curated vintage shops. Learn about Dutch fashion history. Shopping budget not included.",
    },
  ],
  proTips: [
    "Amsterdam's creative scene thrives in neighborhoods like Jordaan, De Pijp, and NDSM. Venture beyond the tourist center for authentic experiences.",
    "Many workshops offer group discounts for 6+ people. Book directly and mention you're a group for better rates.",
    "Combine activities with Amsterdam's excellent cafe culture - most venues are happy to recommend nearby spots for drinks afterward.",
  ],
  refinementPrompts: [
    "More hands-on workshops",
    "Add food & drink focus",
    "Include nightlife",
    "More outdoor activities",
    "Focus on Dutch culture",
    "Make it more relaxing",
  ],
}

// Response selection logic
export function selectMockResponse(inputs: {
  groupSize: string
  budget: string
  location: string
  vibe: string
}): MockResponse {
  const { location, budget, vibe } = inputs

  // Normalize inputs for matching
  const locationLower = location.toLowerCase()
  const vibeLower = vibe.toLowerCase()
  const budgetLower = budget.toLowerCase()

  // Match Berlin corporate
  if (
    locationLower.includes("berlin") &&
    (vibeLower.includes("team") ||
      vibeLower.includes("corporate") ||
      vibeLower.includes("work") ||
      vibeLower.includes("professional"))
  ) {
    return corporateBerlinResponse
  }

  // Match Barcelona adventurous
  if (
    locationLower.includes("barcelona") &&
    (vibeLower.includes("adventure") ||
      vibeLower.includes("celebration") ||
      vibeLower.includes("party") ||
      vibeLower.includes("fun"))
  ) {
    return friendsBarcelonaResponse
  }

  // Match remote/virtual family
  if (
    (locationLower.includes("remote") ||
      locationLower.includes("virtual") ||
      locationLower.includes("online") ||
      locationLower.includes("anywhere")) &&
    (budgetLower.includes("free") || budgetLower.includes("under"))
  ) {
    return familyRemoteResponse
  }

  // Match Amsterdam creative
  if (
    locationLower.includes("amsterdam") &&
    (vibeLower.includes("creative") || vibeLower.includes("art") || vibeLower.includes("cultural"))
  ) {
    return friendsAmsterdamResponse
  }

  // Default fallbacks based on individual criteria
  if (locationLower.includes("berlin")) return corporateBerlinResponse
  if (locationLower.includes("barcelona")) return friendsBarcelonaResponse
  if (locationLower.includes("amsterdam")) return friendsAmsterdamResponse
  if (
    locationLower.includes("remote") ||
    locationLower.includes("virtual") ||
    budgetLower.includes("free") ||
    budgetLower.includes("under")
  ) {
    return familyRemoteResponse
  }

  // Ultimate fallback - return the most versatile option
  return friendsAmsterdamResponse
}
