import { NextResponse } from "next/server"

export async function GET() {
  const envVars = Object.keys(process.env)
  const viatorVars = envVars.filter(k => k.toLowerCase().includes('viator'))
  
  const rawBaseUrl = process.env.VIATOR_API_BASE_URL || 'https://api.viator.com/partner'
  const correctedBaseUrl = rawBaseUrl.replace(/\/partner$/, '') + "/partner"
  
  const diagnostics = {
    viatorEnvVarsFound: viatorVars,
    hasViatorApiKey: !!process.env.VIATOR_API_KEY,
    hasViatorBaseUrl: !!process.env.VIATOR_API_BASE_URL,
    apiKeyLength: process.env.VIATOR_API_KEY?.length || 0,
    apiKeyPreview: process.env.VIATOR_API_KEY 
      ? `${process.env.VIATOR_API_KEY.substring(0, 4)}...${process.env.VIATOR_API_KEY.substring(process.env.VIATOR_API_KEY.length - 4)}`
      : 'NOT SET',
    baseUrlRaw: rawBaseUrl,
    baseUrlCorrected: correctedBaseUrl,
    destinationsEndpoint: `${correctedBaseUrl}/destinations`,
    productsSearchEndpoint: `${correctedBaseUrl}/products/search`,
    allEnvVarsCount: envVars.length,
    nodeEnv: process.env.NODE_ENV
  }
  
  return NextResponse.json(diagnostics)
}
