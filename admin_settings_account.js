
// Admin Settings Logic using Supabase built-in methods

document.addEventListener('DOMContentLoaded', async () => {
    const client = window.DB.getClient();

    if (!client) {
        console.error("Supabase client not available");
        return;
    }

    // Check local admin session
    const adminAuth = sessionStorage.getItem('admin_auth');
    if (!adminAuth) {
        window.location.href = 'admin_login.html';
        return;
    }

    let adminUser;
    try {
        adminUser = JSON.parse(adminAuth);
        if (!adminUser || !adminUser.id) throw new Error("Invalid admin data");
    } catch (e) {
        console.error("Session invalid:", e);
        window.location.href = 'admin_login.html';
        return;
    }

    // --- Selectors ---

    // Password fields are in a grid, selecting by type
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    // Assuming order: Current, New, Confirm (based on HTML structure)
    // Actually HTML structure is: 
    // 1. Current Password (grid-2 -> form-group -> input)
    // 2. New Password (grid-2 -> form-group -> input)
    // 3. Confirm New Password (grid-2 -> form-group -> input)
    // 4. Update Button (button)
    // Let's be more precise with selectors if possible, or rely on order.
    // The HTML shows 3 password inputs followed by "Update Password" button.
    const currentPassInput = passwordInputs[0];
    const newPassInput = passwordInputs[1];
    const confirmPassInput = passwordInputs[2];
    const updatePassBtn = document.querySelector('button.vsl-btn-primary:last-of-type'); // Warning: Selectors need to be robust

    // Better strategy: Add IDs to HTML elements first for reliability? 
    // The instructions say "Implement button functionality", implied we can edit the HTML to add IDs or scripts.
    // I will use more robust traversal or add IDs in the next step if I was modifying HTML heavily.
    // But since I have to "Implement button functionality in admin_settings_account.html", I can modify HTML in the same turn.
    // I will write this JS file assuming I will update the HTML with IDs for clarity.



    // --- Load User Info ---

    // --- 4. Update Password ---
    // Make sure we select the button correctly. 
    // In the HTML structure it's the button AFTER the grid of password inputs.
    // We'll rely on adding IDs in the HTML file for safety.

    // Bind click based on ID (which I will add in the next step)
    const btnUpdatePass = document.getElementById('btnUpdatePassword');

    if (btnUpdatePass) {
        btnUpdatePass.addEventListener('click', async () => {
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (!newPass || !confirmPass) return showAlert('warning', window.i18n('err_fill_all_pass_fields', "Please fill in the new password fields."));
            if (newPass !== confirmPass) return showAlert('warning', window.i18n('err_passwords_no_match', "Passwords do not match."));
            if (newPass.length < 6) return showAlert('warning', window.i18n('err_password_6chars', "Password must be at least 6 characters."));

            btnUpdatePass.textContent = window.i18n('lbl_updating', 'Updating...');
            btnUpdatePass.disabled = true;

            try {
                // Re-validate session
                const adminAuthStr = sessionStorage.getItem('admin_auth');
                if (!adminAuthStr) {
                    showAlert('error', window.i18n('err_session_not_found', 'Admin session not found. Please login again.'));
                    window.location.href = 'admin_login.html';
                    return;
                }

                let adminData;
                try {
                    adminData = JSON.parse(adminAuthStr);
                } catch (e) {
                    throw new Error(window.i18n('err_invalid_session_format', "Invalid session format"));
                }

                if (!adminData || !adminData.id) {
                    showAlert('error', window.i18n('err_admin_id_not_found', 'Admin ID not found in session. Please login again.'));
                    window.location.href = 'admin_login.html';
                    return;
                }

                const adminId = parseInt(adminData.id);
                if (isNaN(adminId)) {
                    throw new Error(window.i18n('err_invalid_id_format', "Invalid admin ID format in session"));
                }

                // Update password in 'admins' table (NOT 'users' table)
                const { error } = await client
                    .from('admins')
                    .update({ password: newPass })
                    .eq('id', adminId);

                if (error) {
                    if (error.message.includes('Could not find the table')) {
                        throw new Error(window.i18n('err_table_missing', "The 'admins' table is missing in your Supabase database. Please run the SQL patch in 'create_admins_table.sql' to create it."));
                    }
                    throw error;
                }

                showAlert('success', window.i18n('msg_password_updated', "Password updated successfully."));

                // Clear inputs
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

            } catch (e) {
                console.error(e);
                showAlert('error', window.i18n('err_updating_password', "Error updating password: ") + e.message);
            } finally {
                btnUpdatePass.textContent = window.i18n('btn_update_password', 'Update Password');
                btnUpdatePass.disabled = false;
            }
        });
    }

    // --- 5. Logout All Sessions ---

});
