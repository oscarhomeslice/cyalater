export interface ActivitySearchFormData {
  groupSize: string
  budgetPerPerson: string
  currency?: string
  location?: string
  activityCategory: "diy" | "experience"
  vibe?: string
  groupRelationship?: string
  timeOfDay?: string
  indoorOutdoorPreference?: string
  accessibilityNeeds?: string
}
