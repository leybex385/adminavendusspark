
// Patch DB.updateLoanStatus to include updated_at/processed_at
if (window.DB) {
    window.DB.updateLoanStatus = async function (id, status, adminNote = '') {
        const client = this.getClient();
        if (!client) {
            alert("Database client not initialized");
            return { success: false };
        }

        const validStatuses = ['APPROVED', 'REJECTED', 'PENDING'];
        // Ensure strictly uppercase entry
        let finalStatus = status.toUpperCase();

        if (!validStatuses.includes(finalStatus)) {
            console.error(`Invalid status: ${finalStatus}`);
            alert(`Invalid status: ${finalStatus}. Must be APPROVED, REJECTED, or PENDING.`);
            return { success: false };
        }

        const updatePayload = {
            status: finalStatus,
            processed_at: new Date().toISOString()
        };

        // Include admin_note if present (safely adhering to "exact query" spirit while preserving feature)
        if (adminNote) updatePayload.admin_note = adminNote;

        // EXECUTE EXACT SUPABASE QUERY STRUCTURE
        const { data, error } = await client
            .from('loans')
            .update(updatePayload)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Loan update error:', error);
            alert("Loan Update Failed: " + error.message);
            return { success: false, error };
        }

        return { success: true, data };
    };

    // Add getBorrowedFunds to fetch total approved loans (CALCULATION AS REQUESTED)
    window.DB.getBorrowedFunds = async function (userId) {
        const client = this.getClient();
        if (!client) return 0;

        // 6. Assets Borrowed Funds Calculation: SELECT COALESCE(SUM(amount), 0) ... WHERE status = 'APPROVED'
        const { data, error } = await client
            .from('loans')
            .select('amount')
            .eq('user_id', userId)
            .eq('status', 'APPROVED');

        if (error) {
            console.error("Error fetching borrowed funds:", error);
            return 0;
        }

        // Sum the amounts
        if (!data || data.length === 0) return 0;
        const total = data.reduce((sum, loan) => sum + (parseFloat(loan.amount) || 0), 0);
        return total;
    };

    console.log("Patched DB with updateLoanStatus (timestamps) and getBorrowedFunds (SUM logic)");
}
