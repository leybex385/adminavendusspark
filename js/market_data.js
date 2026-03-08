console.log("🔥 market_data.js LOADED");
/**
 * Market Data Engine - Simulates Real-time Indian Stock Market Data
 * 
 * Features:
 * - Mock list of top NSE/BSE stocks
 * - Simulated price fluctuation
 * - Search capability
 */

(function () {
    // Top 50 Indian Stocks (Approximate Prices)
    const STOCK_DATA = [];
    console.log("🔥 STOCK_DATA count:", STOCK_DATA.length);
    const OTC_DATA = [];

    const IPO_DATA = [];

    const INDICES_DATA = [
        { symbol: 'SENSEX', name: 'BSE SENSEX', price: 83710.26, change: 396.33, changePercent: 0.48, type: 'index' },
        { symbol: 'NIFTY 50', name: 'NSE NIFTY 50', price: 25619.54, change: -156.46, changePercent: -0.61, type: 'index' },
        { symbol: 'NIFTY BANK', name: 'NSE NIFTY BANK', price: 60120.55, change: -563.00, changePercent: -0.09, type: 'index' },
        { symbol: 'NIFSMCP100', name: 'NIFTY SMALLCAP 100', price: 16938.65, change: -45.53, changePercent: -0.27, type: 'index' },
        { symbol: 'NIFMDCP100', name: 'NIFTY MIDCAP 100', price: 59502.70, change: -144.00, changePercent: -0.02, type: 'index' },
        { symbol: 'VIX', name: 'INDIA VIX', price: 15.1, change: 1.46, changePercent: 10.73, type: 'index' }
    ];

    class MarketEngine {
        constructor() {
            console.log("🔥 MarketEngine Constructor START");
            this.stocks = STOCK_DATA;
            this.otc = OTC_DATA;
            this.ipo = IPO_DATA;
            this.indices = INDICES_DATA;
            this.dbProducts = []; // Cache for database products (IPO)
            console.log("🔥 MarketEngine stocks set, count:", this.stocks.length);
            window.DEBUG_MARKET = this;
            this.dbOtcProducts = []; // Cache for database products (OTC)
            this.dbInsStocks = []; // Cache for database products (Ins.stocks)
            this.livePrices = {}; // Real-time market prices (Yahoo)
            this.listeners = [];

            // Yahoo Symbols Mapping for Major Indices
            this.indexYahooSymbols = {
                'SENSEX': '^BSESN',
                'NIFTY 50': '^NSEI',
                'NSE NIFTY 50': '^NSEI',
                'NIFTY BANK': '^NSEBANK',
                'NSE NIFTY BANK': '^NSEBANK',
                'NIFSMCP100': '^NSESMCP100',
                'NIFTY SMALLCAP 100': '^NSESMCP100',
                'NIFMDCP100': '^NSEMDCP100',
                'NIFTY MIDCAP 100': '^NSEMDCP100',
                'VIX': '^INDIAVIX',
                'INDIA VIX': '^INDIAVIX'
            };

            this.startSimulation();
            
            // Initialization flow: sync products first, then overlay cache
            this.syncFromDB().then(() => {
                this.syncMarketCache();
            });

            // Auto-refresh market cache every 30 seconds
            setInterval(() => this.syncMarketCache(), 30 * 1000);
        }

        async syncMarketCache() {
            if (window.supabaseClient) {
                try {
                    const { data, error } = await window.supabaseClient
                        .from('market_cache')
                        .select('symbol, price, updated_at');

                    if (error) throw error;

                    if (data && data.length > 0) {
                        const now = new Date();
                        const TTL_MS = 10 * 60 * 1000; // 10 minutes freshness

                        data.forEach(item => {
                            let updatedAt = new Date(item.updated_at);
                            // If invalid, fallback to very old date to trigger sync
                            if (isNaN(updatedAt.getTime())) updatedAt = new Date(0);
                            
                            const isStale = (now - updatedAt) > TTL_MS;

                            this.livePrices[item.symbol] = parseFloat(item.price);

                            // Update local arrays immediately
                            const stock = this.stocks.find(s => s.symbol === item.symbol) ||
                                this.dbOtcProducts.find(s => s.market_symbol === item.symbol) ||
                                this.dbProducts.find(s => s.market_symbol === item.symbol) ||
                                this.dbInsStocks.find(s => s.market_symbol === item.symbol);

                            if (stock) {
                                stock.updated_at = item.updated_at; // Track for stale check
                                
                                // Calculate accurate change if possible
                                if (stock.price !== item.price && stock.price > 0) {
                                    stock.change = ((item.price - stock.price) / stock.price) * 100;
                                }
                                
                                stock.price = item.price;
                                stock.isCached = !isStale; // Only mark as cached if data is FRESH
                            }
                        });
                        this.notifyListeners();

                        // Proactive Fetch for Ins. Stocks: If missing/stale/uncached, fetch now.
                        this.dbInsStocks.forEach(s => {
                            if (s.market_symbol && (s.price === 0 || !s.isCached)) {
                                console.log(`🔍 MarketEngine: Proactive fetch for ${s.market_symbol} (Stale or Missing)`);
                                this.fetchMarketPrice(s.market_symbol);
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to sync market cache: ", e);
                }
            }
        }

        async syncFromDB() {
            let retries = 0;
            const maxRetries = 20; // 5 seconds (250ms * 20)

            while (retries < maxRetries) {
                if (window.DB && typeof window.DB.getActiveProductsByType === 'function') {
                    console.log("🔥 Syncing IPO/OTC from DB...");
                    try {
                        // Fetch IPOs
                        const ipoData = await window.DB.getActiveProductsByType('IPO');
                        this.dbProducts = ipoData.map(p => ({
                            id: p.id,
                            symbol: p.market_symbol || p.name.split(' ')[0].toUpperCase(),
                            market_symbol: p.market_symbol,
                            name: p.name,
                            price: parseFloat(p.price) || 0,
                            subscription_price: parseFloat(p.subscription_price) || 0,
                            yield: p.est_profit_percent || 'TBD',
                            estimated_profit: p.est_profit_percent || 0,
                            subDate: p.start_date || 'TBD',
                            deadline: p.end_date || 'TBD',
                            listingDate: p.listing_date || 'TBD',
                            level: (parseFloat(p.min_invest) > 100000) ? 'Lv ≥ 2' : 'Lv ≥ 1',
                            type: 'IPO',
                            totalShares: p.total_shares || 0,
                            availableShares: p.available_shares || 0,
                            exchange: p.exchange,
                            change: 0
                        }));

                        // Fetch OTCs
                        const otcData = await window.DB.getActiveProductsByType('OTC');
                        this.dbOtcProducts = otcData.map(p => ({
                            id: p.id,
                            symbol: p.market_symbol || p.name.split(' ')[0].toUpperCase(),
                            market_symbol: p.market_symbol,
                            name: p.name,
                            price: parseFloat(p.price) || 0,
                            subscription_price: parseFloat(p.subscription_price) || 0,
                            yield: p.est_profit_percent || 'TBD',
                            estimated_profit: p.est_profit_percent || 0,
                            subDate: p.start_date || 'TBD',
                            deadline: p.end_date || 'TBD',
                            listingDate: p.listing_date || 'TBD',
                            level: (parseFloat(p.min_invest) > 100000) ? 'Lv ≥ 2' : 'Lv ≥ 1',
                            type: 'OTC',
                            totalShares: p.total_shares || 0,
                            availableShares: p.available_shares || 0,
                            exchange: p.exchange,
                            change: 0
                        }));

                        // Fetch Institutional Stocks
                        const insData = await window.DB.getActiveProductsByType('Ins.stocks');
                        this.dbInsStocks = insData.map(p => ({
                            id: p.id,
                            symbol: p.market_symbol || p.name.split(' ')[0].toUpperCase(),
                            market_symbol: p.market_symbol,
                            name: p.name,
                            price: p.market_symbol ? 0 : (parseFloat(p.price) || 0),
                            subscription_price: p.market_symbol ? 0 : (parseFloat(p.subscription_price) || 0),
                            yield: p.est_profit_percent || 'TBD',
                            subDate: p.start_date || 'TBD',
                            deadline: p.end_date || 'TBD',
                            listingDate: p.listing_date || 'TBD',
                            level: (parseFloat(p.min_invest) > 100000) ? 'Lv ≥ 2' : 'Lv ≥ 1',
                            type: 'INS.STOCKS', // Standardized product_type
                            totalShares: p.total_shares || 0,
                            availableShares: p.available_shares || 0,
                            exchange: p.exchange,
                            change: 0
                        }));

                        console.log(`✅ Synced ${this.dbProducts.length} IPOs, ${this.dbOtcProducts.length} OTCs, and ${this.dbInsStocks.length} Ins.stocks`);
                        this.notifyListeners();
                        return; // Success, exit loop
                    } catch (e) {
                        console.error("Failed to sync products from DB:", e);
                        return; // Exit on hard error
                    }
                }

                // Wait 250ms before retrying
                await new Promise(resolve => setTimeout(resolve, 250));
                retries++;
            }
            console.warn("⚠️ MarketEngine DB Sync timed out after 5 seconds.");
        }

        startSimulation() {
            setInterval(() => {
                // Fluctuate Hardcoded Stocks
                this.stocks.forEach(stock => {
                    const volatility = 0.005;
                    const changePercent = (Math.random() * volatility * 2) - volatility;
                    stock.price += (stock.price * changePercent);
                    stock.change += (changePercent * 100);
                    if (changePercent > 0) stock.change = Math.abs(stock.change);
                    else stock.change = -Math.abs(stock.change);
                });

                // Fluctuate DB Products (Ins. Stocks, OTC, IPOs)
                // This makes them look "connected" and alive even if fetch is pending
                const dbLists = [this.dbInsStocks, this.dbOtcProducts, this.dbProducts];
                dbLists.forEach(list => {
                    list.forEach(stock => {
                        if (stock.price > 0) {
                            const volatility = 0.0015; 
                            const changePercent = (Math.random() * volatility * 2) - volatility;
                            stock.price += (stock.price * changePercent);
                            
                            // Initialize change if it's 0 to show some activity
                            if (!stock.change || stock.change === 0) {
                                stock.change = (changePercent * 100);
                            } else {
                                stock.change += (changePercent * 100);
                            }

                            // Keep sign consistent with latest movement for visual polish
                            if (changePercent > 0) stock.change = Math.abs(stock.change);
                            else stock.change = -Math.abs(stock.change);
                        }
                    });
                });

                this.notifyListeners();
            }, 5000); // 5 second refresh for simulation
        }

        addListener(callback) {
            if (typeof callback === 'function') {
                this.listeners.push(callback);
            }
        }

        notifyListeners() {
            this.listeners.forEach(cb => {
                try {
                    cb();
                } catch (e) {
                    console.error("MarketEngine listener error:", e);
                }
            });
        }

        search(query) {
            if (!query) return [];
            const q = query.toLowerCase();
            const all = [...this.stocks, ...this.getOTC(), ...this.getIPO(), ...(this.dbInsStocks || []), ...this.indices];
            return all.filter(s =>
                s.symbol.toLowerCase().includes(q) ||
                s.name.toLowerCase().includes(q)
            );
        }

        getIndices() { return this.indices; }

        async syncIndicesWithYahoo() {
            console.log("🔄 MarketEngine: Syncing Indices with Yahoo Finance...");
            for (let idx of this.indices) {
                const yahooSymbol = this.indexYahooSymbols[idx.symbol] || this.indexYahooSymbols[idx.name];
                if (yahooSymbol) {
                    try {
                        const data = await window.DB.getMarketPrice(yahooSymbol);
                        if (data && data.price) {
                            const oldPrice = idx.price;
                            idx.price = data.price;
                            // Update daily change based on previous to avoid static feel
                            idx.change = idx.price - (oldPrice || idx.price);
                            if (oldPrice > 0) {
                                idx.changePercent = (idx.change / oldPrice) * 100;
                            }
                            this.notifyListeners();
                        }
                    } catch (e) {
                        console.error(`Failed to sync index ${idx.symbol}:`, e);
                    }
                }
            }
        }

        async fetchMarketPrice(symbol) {
            if (!symbol) return null;
            try {
                const data = await window.DB.getMarketPrice(symbol);
                if (data && data.status !== 'error' && data.price) {
                    const price = parseFloat(data.price);
                    this.livePrices[symbol] = price;

                    // Update local arrays immediately
                    const stock = this.stocks.find(s => s.symbol === symbol) ||
                        this.dbOtcProducts.find(s => s.market_symbol === symbol) ||
                        this.dbProducts.find(s => s.market_symbol === symbol) ||
                        this.dbInsStocks.find(s => s.market_symbol === symbol);

                    if (stock) {
                        stock.price = price;
                        stock.isCached = true; // Mark as fresh
                        stock.updated_at = new Date().toISOString();
                    }

                    this.notifyListeners();
                    return price;
                }
            } catch (e) {
                console.error(`MarketEngine: Failed to fetch live price for ${symbol}:`, e);
            }
            return null;
        }

        getAllStocks() {
            return [...this.stocks, ...(this.dbInsStocks || [])];
        }
        getOTC() { return [...this.otc, ...(this.dbOtcProducts || [])]; }
        getIPO() {
            return [...this.ipo, ...this.dbProducts];
        }

        getProduct(idOrSymbol) {
            const all = [...this.stocks, ...this.getOTC(), ...this.getIPO(), ...(this.dbInsStocks || []), ...this.indices];
            // 1. Try matching by ID (Reliably unique)
            const byId = all.find(s => s.id === idOrSymbol || String(s.id) === String(idOrSymbol));
            if (byId) return byId;

            // 2. Fallback to Symbol matching
            return all.find(s => s.symbol === idOrSymbol);
        }
    }

    // Expose Global Instance
    window.MarketEngine = new MarketEngine();
})();
