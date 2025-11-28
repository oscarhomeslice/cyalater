export const validateBudget = (value: string): string | undefined => {
  const num = Number.parseFloat(value)
  if (isNaN(num)) return "Budget must be a valid number"
  if (num < 0) return "Budget cannot be negative"
  if (num > 2000) return "Budget cannot exceed 2000"
  return undefined
}

export const getBudgetTier = (budget: number): "budget" | "moderate" | "premium" | "luxury" => {
  if (budget < 30) return "budget"
  if (budget < 100) return "moderate"
  if (budget < 300) return "premium"
  return "luxury"
}

export const getGroupSizeCategory = (groupSize: string): "intimate" | "small" | "medium" | "large" => {
  const firstNumber = Number.parseInt(groupSize.split("-")[0])
  if (firstNumber <= 2) return "intimate"
  if (firstNumber <= 5) return "small"
  if (firstNumber <= 10) return "medium"
  return "large"
}
