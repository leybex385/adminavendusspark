/**
 * Trading Logic - Close Order / Sell Trade
 */

let sellingTimer = null;
let isExecutingSell = false; // Flag to prevent double execution

// Attach to window for global access
window.openCloseOrderModal = function (tradeOrId) {
    let trade;
    if (typeof tradeOrId === 'object') {
        trade = tradeOrId;
    } else {
        // Fallback to searching in global transactionData if available
        const dataSource = window.transactionData || (typeof transactionData !== 'undefined' ? transactionData : null);
        trade = (dataSource && dataSource.all) ?
            dataSource.all.find(t => t.id == tradeOrId) : null;
    }

    if (!trade) {
        console.error("Trade not found for selling:", tradeOrId);
        alert("Trade details could not be found. Please try again.");
        return;
    }

    const tradeId = trade.id;

    const updateSellingData = () => {
        const me = window.MarketEngine || {};
        const livePriceData = me.getProduct ? me.getProduct(trade.symbol) : null;
        const currentPrice = livePriceData ? livePriceData.price : trade.price;
        const totalOrderValue = parseFloat(trade.total_amount);
        const currentSaleValue = currentPrice * trade.quantity;

        // Stat Fees for Premium Modal
        const sellTax = currentSaleValue * 0.0012;
        const sellTxn = currentSaleValue * 0.0003;
        const netProceeds = currentSaleValue - sellTax - sellTxn;

        const priceEl = document.getElementById('coCurrPrice');
        const qtyEl = document.getElementById('coQty');
        const valEl = document.getElementById('coOrderVal');
        const taxEl = document.getElementById('coTaxAmt');
        const txnEl = document.getElementById('coTxnCharge');
        const netEl = document.getElementById('coNetReturn');

        if (priceEl) priceEl.innerText = '₹' + currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (qtyEl) qtyEl.innerText = trade.quantity;
        if (valEl) valEl.innerText = '₹' + currentSaleValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (taxEl) taxEl.innerText = '-₹' + sellTax.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (txnEl) txnEl.innerText = '-₹' + sellTxn.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (netEl) netEl.innerText = '₹' + netProceeds.toLocaleString('en-IN', { minimumFractionDigits: 2 });

        // Update confirm button properties
        const confirmBtn = document.getElementById('coConfirmBtn');
        if (confirmBtn) {
            confirmBtn.dataset.tradeId = tradeId;
            confirmBtn.dataset.sellPrice = currentPrice;
            confirmBtn.dataset.netReturn = netProceeds;
        }
    };

    const stockTitleEl = document.getElementById('coStockTitle');
    const symbolEl = document.getElementById('coSymbol');
    const buyPriceEl = document.getElementById('coBuyPrice');
    const qtyEl = document.getElementById('coQty');
    const orderValEl = document.getElementById('coOrderVal');

    if (stockTitleEl) stockTitleEl.innerText = trade.name;
    if (symbolEl) symbolEl.innerText = trade.symbol;
    if (buyPriceEl) buyPriceEl.innerText = '₹' + parseFloat(trade.price).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (qtyEl) qtyEl.innerText = trade.quantity;
    if (orderValEl) orderValEl.innerText = '₹' + parseFloat(trade.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });

    updateSellingData();

    const modal = document.getElementById('closeOrderModal');
    if (modal) modal.style.display = 'flex';

    // Timer logic
    let totalSeconds = 20;
    let currentSeconds = totalSeconds;
    const bar = document.getElementById('coProgressBar');
    const txt = document.getElementById('coTimerText');

    if (bar && txt) {
        // Initial bar state
        bar.style.width = '100%';
        bar.style.transition = 'none'; // reset transition
        void bar.offsetWidth; // trigger reflow
        bar.style.transition = 'width 1s linear';
        txt.innerText = `Quotation expires in ${currentSeconds}s`;

        if (sellingTimer) clearInterval(sellingTimer);
        sellingTimer = setInterval(() => {
            currentSeconds--;
            txt.innerText = `Quotation expires in ${currentSeconds}s`;
            bar.style.width = (currentSeconds / totalSeconds * 100) + '%';

            // Real-time price update during quotation
            updateSellingData();

            if (currentSeconds <= 0) {
                clearInterval(sellingTimer);
                window.closeSellingModal();
            }
        }, 1000);
    }

    // Refresh button
    const refreshBtn = document.getElementById('coRefreshBtn');
    if (refreshBtn) refreshBtn.onclick = updateSellingData;

    // Redundant onclick binding removed to avoid double execution with HTML onclick="executeCloseOrder()"
    if (window.lucide) window.lucide.createIcons();
};

window.closeSellingModal = function () {
    const modal = document.getElementById('closeOrderModal');
    if (modal) modal.style.display = 'none';
    if (sellingTimer) clearInterval(sellingTimer);
    isExecutingSell = false;
};

window.handleSellTrade = async function (tradeId, sellPrice, netReturn) {
    if (!tradeId || isExecutingSell) return;

    const btn = document.getElementById('coConfirmBtn');
    if (!btn) return;

    isExecutingSell = true;
    const originalText = btn.innerText;
    btn.innerText = "EXECUTING...";
    btn.disabled = true;

    const client = window.DB ? window.DB.getClient() : null;
    const user = window.DB ? window.DB.getCurrentUser() : null;

    if (!client || !user) {
        btn.innerText = originalText;
        btn.disabled = false;
        isExecutingSell = false;
        return;
    }

    try {
        // 1. Fetch the latest trade data to ensure it hasn't been sold already
        const { data: trade, error: fetchErr } = await client.from('trades').select('*').eq('id', tradeId).single();
        if (fetchErr || !trade) throw new Error("Could not find the original trade record.");
        if (trade.status === 'Sold') throw new Error("This position is already closed.");

        // --- TRADING FREEZE GUARD ---
        if (user.trading_frozen) {
            throw new Error("Trading functions are temporarily unavailable. Please check your account status or try again later.");
        }

        // 2. Re-fetch real-time price
        const me = window.MarketEngine || {};
        const livePriceData = me.getProduct ? me.getProduct(trade.symbol) : null;
        const finalSellPrice = livePriceData ? livePriceData.price : sellPrice;

        // Calculations
        const qty = parseFloat(trade.quantity || 0);
        const grossValue = qty * finalSellPrice;
        const tax = grossValue * 0.0012;
        const txn = grossValue * 0.0003;
        const finalNetReturn = grossValue - tax - txn;
        const buyAmount = parseFloat(trade.total_amount) || 0;

        // 3. Update the original trade to 'Sold' with historical data
        const realisedProfit = finalNetReturn - buyAmount;
        const { error: tradeUpdateErr } = await client.from('trades').update({
            status: 'Sold',
            processed_at: new Date().toISOString(),
            sell_price: finalSellPrice,
            total_sale_value: finalNetReturn,
            realised_profit: realisedProfit,
            sell_timestamp: new Date().toISOString(),
            sell_tax: tax,
            sell_fees: txn,
            admin_note: `Sold at Market ₹${finalSellPrice.toLocaleString('en-IN')}`
        }).eq('id', tradeId);
        if (tradeUpdateErr) throw tradeUpdateErr;

        // 4. Record history (Secondary record for ledger/inflow)
        const { error: sellRecordErr } = await client.from('trades').insert([{
            user_id: user.id,
            symbol: trade.symbol,
            name: trade.name,
            type: trade.type, // Reverted to original type to satisfy DB check constraint (trades_type_check)
            quantity: qty,
            price: finalSellPrice,
            total_amount: finalNetReturn,
            tax_amount: tax,
            txn_charge: txn,
            status: 'Sold',
            processed_at: new Date().toISOString(),
            admin_note: `Proceeds from selling ${qty} shares of ${trade.symbol}`
        }]);
        if (sellRecordErr) throw sellRecordErr;

        // 5. Update financials
        const freshUser = await window.DB.refreshCurrentUser();
        const currentBalance = parseFloat(freshUser.balance) || 0;
        const currentInvested = parseFloat(freshUser.invested) || 0;

        const newBalance = currentBalance + finalNetReturn;
        const newInvested = Math.max(0, currentInvested - buyAmount);

        const { error: finErr } = await window.DB.updateUserFinancials(user.id, {
            balance: newBalance,
            invested: newInvested
        });
        if (finErr) throw finErr;

        if (window.showModal) {
            window.showModal('success', 'Trade Executed', `Sold ${qty} shares of ${trade.name} at ₹${finalSellPrice.toLocaleString('en-IN')}. ₹${finalNetReturn.toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been credited to your wallet.`, () => {
                window.closeSellingModal();
                if (window.fetchUserTransactions) {
                    window.fetchUserTransactions().then(() => {
                        if (window.syncUserData) window.syncUserData();
                        if (window.renderDetailHoldings) window.renderDetailHoldings();
                        // Force refresh the specific holding list tab to remove the sold item
                        if (window.switchTransactionTab) window.switchTransactionTab(null, 'holding');
                    });
                }
            });
        } else {
            alert("Trade Successful!");
            window.closeSellingModal();
            location.reload();
        }

    } catch (e) {
        console.error("Sell Error:", e);
        alert("Execution failed: " + e.message);
        isExecutingSell = false;
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

window.executeCloseOrder = async function () {
    if (isExecutingSell) return;
    const btn = document.getElementById('coConfirmBtn');
    if (!btn) return;
    const tradeId = btn.dataset.tradeId;
    const sellPrice = parseFloat(btn.dataset.sellPrice);
    const netReturn = parseFloat(btn.dataset.netReturn);
    await window.handleSellTrade(tradeId, sellPrice, netReturn);
};

// --- Delegated Event Handler ---
document.addEventListener("click", function (e) {
    // 1. Close Order / Sell Trade
    const closeBtn = e.target.closest(".close-order-btn");
    if (closeBtn) {
        const tradeId = closeBtn.dataset.id;
        console.log("Close Order Clicked:", tradeId);
        if (typeof window.openCloseOrderModal === "function") {
            window.openCloseOrderModal(tradeId);
        } else {
            console.error("openCloseOrderModal is not defined");
        }
        return;
    }

    // 2. OTC / IPO Subscribe
    const subBtn = e.target.closest(".subscribe-btn");
    if (subBtn) {
        const productId = subBtn.dataset.id;
        console.log("Subscribe Clicked:", productId);
        if (typeof window.openOTCSubscribeModal === "function") {
            window.openOTCSubscribeModal(productId);
        } else {
            console.error("openOTCSubscribeModal is not defined");
        }
        return;
    }
});

window.openStockTrade = function (product) {
    const productId = typeof product === 'string' ? product : (product.symbol || product.id);
    if (typeof window.openOTCSubscribeModal === "function") {
        window.openOTCSubscribeModal(productId);
    }
};

window.openOTCSubscribe = function (product) {
    const productId = typeof product === 'string' ? product : (product.symbol || product.id);
    if (typeof window.openOTCSubscribeModal === "function") {
        window.openOTCSubscribeModal(productId);
    }
};

window.openIPOSubscribe = function (product) {
    const productId = typeof product === 'string' ? product : (product.symbol || product.id);
    if (typeof window.openOTCSubscribeModal === "function") {
        window.openOTCSubscribeModal(productId);
    }
};

/**
 * Opens the subscription/detail view for OTC/IPO products
 */
window.openOTCSubscribeModal = function (productId) {
    if (!productId) return;
    console.log("Opening Subscription/Trade for:", productId);

    const me = window.MarketEngine;
    if (!me) {
        console.error("MarketEngine not found");
        return;
    }

    const product = me.getProduct(productId);
    if (!product) {
        console.error("Product not found:", productId);
        return;
    }

    if (typeof window.openStockDetail === "function") {
        const exchange = product.symbol.includes('NSE') ? 'NSE' : 'BSE';
        const priceStr = '₹' + product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 });

        let changeStr = '';
        if (product.type === 'IPO' || product.type === 'OTC') {
            changeStr = product.yield || 'Live';
        } else {
            changeStr = (product.change >= 0 ? '+' : '') + (product.change || 0).toFixed(2) + '%';
        }

        const color = (product.change >= 0 || product.type !== 'stock') ? '#10b981' : '#ef4444';

        window.openStockDetail(product.symbol, product.name, exchange, priceStr, changeStr, color, product.type);
    } else {
        console.error("openStockDetail not defined on this page");
    }
};

// Alias for backward compatibility
window.openSellingModal = window.openCloseOrderModal;
