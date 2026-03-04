import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { symbol } = await req.json()
        console.log(`[Diagnostic] Incoming request for symbol: ${symbol}`)

        if (!symbol) {
            console.error(`[Diagnostic] Missing symbol in request body`)
            return new Response(JSON.stringify({ status: "error", message: "Symbol is required" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            console.error(`[Diagnostic] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`)
        }

        const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')

        // 1. Check market_cache
        console.log(`[Diagnostic] Checking market_cache for ${symbol}`)
        const { data: cachedData, error: cacheLookupError } = await supabase
            .from('market_cache')
            .select('*')
            .eq('symbol', symbol)
            .maybeSingle()

        if (cacheLookupError) {
            console.error(`[Diagnostic] Cache lookup error:`, cacheLookupError)
        }

        const now = new Date()

        // 2. Logic: If cache exists AND is < 60s old, return cached price
        if (cachedData) {
            const updatedAt = new Date(cachedData.updated_at)
            const diffSeconds = (now.getTime() - updatedAt.getTime()) / 1000
            console.log(`[Diagnostic] Found cache for ${symbol}. Age: ${diffSeconds.toFixed(2)}s`)

            if (diffSeconds < 60) {
                console.log(`[Diagnostic] Returning fresh cached price for ${symbol}: ${cachedData.price}`)
                return new Response(JSON.stringify({
                    price: cachedData.price,
                    source: cachedData.source,
                    isDelayed: false
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                })
            }
        }

        // 3. Stale or None -> Try Yahoo
        try {
            console.log(`[Diagnostic] Calling fetchYahoo for ${symbol}`)
            const newPrice = await fetchYahoo(symbol)
            console.log(`[Diagnostic] Yahoo returned price for ${symbol}: ${newPrice}`)

            // 4. Update cache (upsert)
            console.log(`[Diagnostic] Attempting upsert into market_cache for ${symbol}`)
            const { data: upsertData, error: upsertError } = await supabase
                .from('market_cache')
                .upsert({
                    symbol: symbol,
                    price: newPrice,
                    source: 'yahoo',
                    updated_at: now.toISOString()
                })
                .select()

            if (upsertError) {
                console.error(`[Diagnostic] Upsert FAILED for ${symbol}:`, upsertError)
            } else {
                console.log(`[Diagnostic] Upsert SUCCESSFUL for ${symbol}. Data:`, upsertData)
            }

            return new Response(JSON.stringify({
                price: newPrice,
                source: 'yahoo',
                isDelayed: false
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        } catch (yahooError) {
            console.error(`[Diagnostic] Yahoo Flow Error for ${symbol}:`, yahooError.message)

            // 5. Yahoo fails -> Return stale cache if exists
            if (cachedData) {
                console.log(`[Diagnostic] Falling back to stale cache for ${symbol}`)
                return new Response(JSON.stringify({
                    price: cachedData.price,
                    source: "cache",
                    isDelayed: true
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                })
            }

            // 6. No cache AND Yahoo fails
            console.warn(`[Diagnostic] No data available for ${symbol}. Returning market_delayed.`)
            return new Response(JSON.stringify({ status: "market_delayed" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            })
        }

    } catch (error) {
        console.error(`[Diagnostic] Global Error:`, error.message)
        return new Response(JSON.stringify({ status: "error", message: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Returning 200 with error status as per request
        })
    }
})

async function fetchYahoo(symbol: string): Promise<number> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    const response = await fetch(url)

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Yahoo API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const json = await response.json()
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice

    if (price === undefined || price === null) {
        throw new Error(`Invalid price data in Yahoo response for ${symbol}`)
    }

    return price
}
