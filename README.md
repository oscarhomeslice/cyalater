# CyaLater - Group Activity Planner

An AI-powered activity suggestion engine that generates personalized group activity ideas using GPT-4 with enriched context.

## Overview

CyaLater helps groups discover unique activity ideas by understanding their specific context: group size, budget, location, vibe, and preferences. The system uses advanced prompt engineering and context enrichment to ensure fresh, unexpected suggestions every time.

## Key Features

- **Context Enrichment**: Automatically derives budget tiers, group dynamics, and seasonal awareness from user inputs
- **Variety Injection**: Randomized creative seeds ensure different suggestions across requests
- **Category-Specific Guidance**: DIY activities with materials lists vs bookable experiences with booking details
- **Location-Aware**: Weaves in local culture when location provided, universal when not
- **Accessibility First**: Ensures all suggestions accommodate specified needs

## Activity Generation System

### How It Works

The system uses GPT-4 with a sophisticated prompt that:

1. **Enriches Context**: Transforms basic inputs into nuanced parameters
   - Budget → Budget tier (budget/moderate/premium/luxury)
   - Group size → Intimacy level (intimate/small/medium/large)
   - Current date → Seasonal context (spring/summer/fall/winter)

2. **Injects Variety**: Each request gets unique creative direction
   - Randomized creative focus ("Think laterally", "Channel chaos", etc.)
   - Dynamic distribution hints (sensory experiences, intimacy levels)
   - Location-specific prompts (local culture vs universal adaptability)

3. **Generates Activities**: Returns 6-8 diverse ideas with:
   - Specific names (not generic)
   - Vivid experience descriptions
   - Realistic costs and durations
   - Materials needed (DIY) or booking details (Experience)
   - Pro tips and refinement prompts

### Key Parameters

| Parameter | Influence | Example |
|-----------|-----------|---------|
| **Group Size** | Affects intimacy and structure | "2-5" → intimate experiences, "20+" → team competitions |
| **Budget** | Determines quality tier | < €30: resourceful, €30-70: moderate, €70-150: premium, > €150: luxury |
| **Category** | Changes activity type | DIY: materials lists, Experience: booking info |
| **Location** | Adds cultural context | "Berlin" → techno clubs, "Tokyo" → karaoke |
| **Vibe** | Primary creative direction | "adventurous" → outdoor challenges, "relaxed" → conversation-friendly |
| **Group Type** | Influences social dynamics | Coworkers vs friends vs family |
| **Time of Day** | Timing considerations | Morning vs night activities |
| **Indoor/Outdoor** | Setting preference | Weather considerations |
| **Accessibility** | Ensures inclusivity | Wheelchair access, sensory needs |

### Ensuring Variety

The system prevents repetitive suggestions through:

1. **High Temperature**: 0.95 for maximum creativity
2. **Penalties**: Presence penalty (0.4) + Frequency penalty (0.3) reduce repetition
3. **Creative Seeds**: Randomized focus for each generation
4. **Explicit Rules**: Blacklist of overused activities (escape rooms, cooking classes, etc.)
5. **Context Enrichment**: Nuanced parameters prevent formulaic patterns

### Tuning Suggestions

To adjust the variety/quality of suggestions:

#### 1. Adjust Temperature
Location: `app/api/generate-activities/route.ts`
\`\`\`typescript
temperature: 0.95, // Range: 0.9-0.99 (higher = more creative)
\`\`\`

#### 2. Modify Variety Seeds
Location: `app/api/generate-activities/route.ts` → `generateVarietySeed()`
\`\`\`typescript
const creativeFocuses = [
  "Your custom creative direction here",
  // Add more variety seeds
]
\`\`\`

#### 3. Update Budget Tiers
Location: `app/api/generate-activities/route.ts` → `enrichUserContext()`
\`\`\`typescript
if (budgetNum < 30) budgetTier = "budget"
else if (budgetNum < 70) budgetTier = "moderate"
// Adjust thresholds as needed
\`\`\`

#### 4. Customize System Prompt
Location: `app/api/generate-activities/route.ts`
- Update the blacklist of overused activities
- Modify variety distribution requirements
- Adjust category-specific guidance

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   └── generate-activities/
│   │       └── route.ts              # Main API endpoint with GPT-4 integration
│   └── page.tsx                       # Home page with search interface
├── components/
│   ├── activity-search-form.tsx      # Form component with validation
│   ├── activity-card.tsx             # Activity display component
│   └── activity-results.tsx          # Results grid with context summary
├── lib/
│   ├── types.ts                      # TypeScript interfaces
│   ├── hooks/
│   │   └── useActivityForm.ts        # Form state management
│   └── utils/
│       └── validate-budget.ts        # Budget validation helpers
└── TESTING-CHECKLIST.md              # Testing scenarios
\`\`\`

## Environment Variables

Required:
- `OPENAI_API_KEY`: OpenAI API key for GPT-4 access

Optional (Supabase integration):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- See `.env.example` for complete list

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\`\`\`

## Testing

See `TESTING-CHECKLIST.md` for comprehensive testing scenarios covering:
- DIY vs Experience categories
- Budget tiers (budget/moderate/premium/luxury)
- Group sizes (intimate/small/medium/large)
- Location-specific vs universal suggestions
- Variety verification across multiple runs

## Debugging

The API route includes comprehensive debug logging:
- Request lifecycle tracking
- Field extraction and validation
- Variety seed generation
- Activity breakdown analysis
- Token usage and performance metrics

Enable in browser console to see detailed logs prefixed with `[API]` and `[v0]`.

## Contributing

When modifying the activity generation:
1. Test with the scenarios in `TESTING-CHECKLIST.md`
2. Verify variety across 3+ consecutive runs
3. Check console logs for variety seed confirmation
4. Ensure budget guidance and category badges display correctly

## License

MIT
