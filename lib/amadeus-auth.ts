const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET
const TOKEN_URL = "https://test.api.amadeus.com/v1/security/oauth2/token"

interface AmadeusToken {
  access_token: string
  expires_in: number
  token_type: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get Amadeus API access token (with caching)
 */
export async function getAmadeusToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AMADEUS_API_KEY!,
        client_secret: AMADEUS_API_SECRET!,
      }),
    })

    if (!response.ok) {
      throw new Error(`Amadeus auth failed: ${response.status}`)
    }

    const data: AmadeusToken = await response.json()

    // Cache token (expires 30 seconds before actual expiry for safety)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 30) * 1000,
    }

    return data.access_token
  } catch (error) {
    console.error("Amadeus authentication error:", error)
    throw new Error("Failed to authenticate with Amadeus API")
  }
}
