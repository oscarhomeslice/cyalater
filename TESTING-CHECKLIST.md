# Activity Search Form Testing Checklist

## Purpose
This document provides comprehensive test scenarios to validate the new form structure, context enrichment, and AI variety improvements.

---

## Pre-Testing Setup

1. **Open Browser Console**: Monitor logs prefixed with `[API]` and `[v0]`
2. **Clear Cache**: Ensure fresh state between test runs
3. **Check Environment Variables**: Verify `OPENAI_API_KEY` is set
4. **Network Tab**: Monitor API response times and payloads

---

## Test Scenarios

Run each scenario **3 times consecutively** to verify variety in outputs.

### Scenario A: Intimate DIY Budget
**Goal**: Test small group, low-cost DIY activities with specific vibe

**Input Parameters**:
- Group Size: `2-5 people`
- Budget: `€25`
- Currency: `EUR`
- Activity Category: `DIY`
- Location: *(leave empty)*
- Group Relationship: `Friends`
- Time of Day: `Evening`
- Indoor/Outdoor: *(leave empty)*
- Accessibility: *(leave empty)*
- Vibe: `cozy`

**Expected Output**:
- ✅ 6-8 DIY activities
- ✅ All activities have specific materials lists in "Materials You'll Need"
- ✅ Cost estimates ≤ €30 per person
- ✅ Evening-appropriate activities (not morning hikes)
- ✅ Cozy, intimate vibes emphasized
- ✅ Category badge shows "DIY" with Wrench icon
- ✅ Activities differ substantially across 3 runs

**Console Logs to Check**:
\`\`\`
[API] Enriched context: budgetTier: "budget", groupSizeCategory: "intimate"
[API] Activity breakdown: cost values should be ≤30
\`\`\`

---

### Scenario B: Large Experience Premium
**Goal**: Test large group, bookable experiences with location context

**Input Parameters**:
- Group Size: `20+ people`
- Budget: `€120`
- Currency: `EUR`
- Activity Category: `Find an Experience`
- Location: `Madrid`
- Group Relationship: `Coworkers`
- Time of Day: `Afternoon`
- Indoor/Outdoor: *(leave empty)*
- Accessibility: *(leave empty)*
- Vibe: `team building`

**Expected Output**:
- ✅ 6-8 bookable experiences (not DIY)
- ✅ All activities mention "What's Included" (guide, equipment, etc.)
- ✅ Madrid-specific activities (flamenco, tapas tours, Retiro Park, etc.)
- ✅ Suitable for 20+ people (no intimate 2-person activities)
- ✅ Team-building focused (collaborative, competitive, bonding)
- ✅ Category badge shows "Find Experience" with Ticket icon
- ✅ Cost estimates around €100-150

**Console Logs to Check**:
\`\`\`
[API] Enriched context: location: "Madrid", budgetTier: "premium", groupSizeCategory: "large"
[API] Activity names should include Madrid-specific references
\`\`\`

---

### Scenario C: Medium DIY Luxury with Accessibility
**Goal**: Test accessibility accommodations and premium DIY

**Input Parameters**:
- Group Size: `11-20 people`
- Budget: `€180`
- Currency: `EUR`
- Activity Category: `DIY`
- Location: *(leave empty)*
- Group Relationship: `Family`
- Time of Day: `Weekend`
- Indoor/Outdoor: *(leave empty)*
- Accessibility: `wheelchair accessible`
- Vibe: *(leave empty)*

**Expected Output**:
- ✅ All activities wheelchair accessible (no hiking, climbing, etc.)
- ✅ Premium DIY materials (high-quality ingredients, supplies)
- ✅ Family-friendly activities (no alcohol-focused, age-appropriate)
- ✅ Cost estimates closer to budget (€150-200)
- ✅ Materials lists show premium items
- ✅ "bestFor" mentions accessibility or family dynamics

**Console Logs to Check**:
\`\`\`
[API] Enriched context: accessibilityNeeds: "wheelchair accessible", budgetTier: "luxury"
[API] System prompt should include: "IMPORTANT: Ensure all suggestions accommodate: wheelchair accessible"
\`\`\`

---

### Scenario D: Small Experience Budget with Location
**Goal**: Test affordable bookable experiences with Barcelona context

**Input Parameters**:
- Group Size: `6-10 people`
- Budget: `€35`
- Currency: `EUR`
- Activity Category: `Find an Experience`
- Location: `Barcelona`
- Group Relationship: `Mixed`
- Time of Day: `Morning`
- Indoor/Outdoor: *(leave empty)*
- Accessibility: *(leave empty)*
- Vibe: *(leave empty)*

**Expected Output**:
- ✅ Budget-friendly bookable experiences (walking tours, group deals)
- ✅ Barcelona-specific (Sagrada Familia area, Gothic Quarter, beach, etc.)
- ✅ Morning-appropriate (breakfast tours, early market visits)
- ✅ Cost estimates ≤ €40
- ✅ Practical "What's Included" details

**Console Logs to Check**:
\`\`\`
[API] Enriched context: location: "Barcelona", budgetTier: "budget", groupSizeCategory: "small"
[API] Activity names should reflect Barcelona locations
\`\`\`

---

## Variety Validation

### Cross-Run Comparison
After running each scenario 3 times, verify:

1. **Activity Name Uniqueness**
   - ❌ FAIL: Same activity names appear across runs
   - ✅ PASS: <20% name overlap across 3 runs

2. **Category Diversity**
   - ❌ FAIL: All activities are same type (all food, all outdoor)
   - ✅ PASS: Mix of categories (physical, creative, social, intellectual)

3. **Cost Variation**
   - ❌ FAIL: All costs identical or within €5 range
   - ✅ PASS: Costs vary by ≥20% across activities

4. **Description Originality**
   - ❌ FAIL: Generic phrases ("fun for everyone", "great bonding")
   - ✅ PASS: Specific, evocative descriptions

5. **Variety Seed Impact**
   - Check console logs for different `varietySeed` values each run
   - Verify activity themes shift based on seed directives

---

## Output Quality Checks

### For DIY Activities:
- [ ] "Materials You'll Need" section has specific items (not vague "supplies")
- [ ] Materials match budget tier (basic for budget, premium for luxury)
- [ ] Materials are realistic and obtainable
- [ ] Card shows Wrench icon + "DIY" badge

### For Experience Activities:
- [ ] "What's Included" section mentions guide/equipment/etc.
- [ ] Descriptions suggest bookable nature
- [ ] Card shows Ticket icon + "Find Experience" badge

### General Quality:
- [ ] No generic suggestions from blacklist (escape room, paint night, etc.)
- [ ] Cost estimates are realistic for the budget
- [ ] Durations are appropriate (not "5 minutes" or "3 weeks")
- [ ] Tags are relevant and specific
- [ ] "bestFor" explains why it fits the context
- [ ] "specialElement" is unique and memorable

---

## Console Log Analysis

### What to Look For:

1. **Request Logging**:
   \`\`\`
   [API] === NEW REQUEST STARTED ===
   [API] Raw request body: {...}
   [API] Extracted fields: {...}
   \`\`\`

2. **Enrichment Validation**:
   \`\`\`
   [API] Enriched context: {
     budgetTier: "...",
     groupSizeCategory: "...",
     seasonalContext: "..."
   }
   \`\`\`

3. **Variety Seed Randomization**:
   \`\`\`
   [API] Variety seed generated: {
     creativeFocus: "...",
     distributionHint: "...",
     locationPrompt: "..."
   }
   \`\`\`
   - Verify these change between requests

4. **OpenAI Response**:
   \`\`\`
   [API] OpenAI response received: {
     activitiesCount: 6-8,
     activityNames: [...]
   }
   \`\`\`

5. **Activity Breakdown**:
   \`\`\`
   [API] Activity breakdown:
     [1] Name: { cost, duration, tags }
     [2] Name: { cost, duration, tags }
   \`\`\`

---

## Bug Reporting Template

If issues are found:

\`\`\`
**Issue**: [Brief description]
**Scenario**: [Which test scenario]
**Input**: [Form values used]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Console Logs**: [Relevant log entries]
**Screenshot**: [If applicable]
\`\`\`

---

## Success Criteria

The system passes if:
- ✅ All 4 scenarios produce valid outputs 3/3 times
- ✅ Variety validation shows <20% overlap across runs
- ✅ Budget logic is respected (no €200 suggestions for €30 budget)
- ✅ Location context appears when provided
- ✅ Accessibility needs are honored
- ✅ Category badges and sections display correctly
- ✅ DIY shows materials, Experience shows what's included
- ✅ No errors in console logs
- ✅ Response times are <10 seconds
