import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { product } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // 🔥 FETCH FROM YAHOO (SERVER SIDE, NO CORS ISSUE)
        const yahooRes = await fetch(
            `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${product.market_symbol || product.symbol}`
        );

        const yahooData = await yahooRes.json();
        const result = yahooData?.quoteResponse?.result?.[0];

        if (!result || !result.regularMarketPrice) {
            return new Response(
                JSON.stringify({ error: "Yahoo price not found" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const livePrice = result.regularMarketPrice;

        // ✅ INSERT PRODUCT
        const { error: productError } = await supabase
            .from("products")
            .insert(product);

        if (productError) throw productError;

        // ✅ UPSERT MARKET CACHE
        const { error: cacheError } = await supabase
            .from("market_cache")
            .upsert({
                symbol: product.market_symbol || product.symbol,
                price: livePrice,
                source: "yahoo",
                updated_at: new Date().toISOString()
            }, { onConflict: 'symbol' });

        if (cacheError) throw cacheError;

        return new Response(
            JSON.stringify({ success: true, price: livePrice }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
