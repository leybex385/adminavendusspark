/* 
    Admin Language Switcher - Premium Translation Engine
    Supports Super Admin and CSR Admin Panels
*/
(function () {
    const adminTranslations = {
        cn: {
            // Sidebar
            "sidebar_front_page": "项目首页",
            "sidebar_kyc": "实名认证",
            "sidebar_users": "客户管理",
            "sidebar_bank_accounts": "银行账户",
            "sidebar_products": "产品管理",
            "sidebar_stock057": "机构股票057",
            "sidebar_financial": "财务管理",
            "sidebar_deposits": "充值记录",
            "sidebar_withdrawals": "提现记录",
            "sidebar_withdrawals_req": "提现申请",
            "sidebar_loans": "贷款记录",
            "sidebar_rewards": "积分记录",
            "sidebar_transactions": "正式交易记录",
            "sidebar_stock": "股票交易",
            "sidebar_bulk": "大宗交易",
            "sidebar_otc": "OTC管理",
            "sidebar_ipo": "IPO申购",
            "sidebar_communication": "通讯中心",
            "sidebar_notifications": "通知中心",
            "sidebar_livechat": "客服支持",
            "sidebar_admin_mgmt": "管理员管理",
            "sidebar_account_settings": "账号设置",
            "group_communication": "通讯中心",

            // Header/Top
            "header_logout": "退出登录",
            "header_settings": "账号设置",
            "btn_refresh": "刷新",

            // General Table Headers
            "th_id": "编号",
            "th_user": "用户",
            "th_name": "姓名",
            "th_mobile": "手机号",
            "th_amount": "金额",
            "th_balance": "可用余额",
            "th_invested": "在途资金",
            "th_status": "状态",
            "th_actions": "操作",
            "th_time": "提交时间",
            "th_operate": "操作",
            "th_client": "客户端",
            "th_vip": "VIP",
            "th_credit": "信用分",
            "th_pin": "密码",
            "th_trading_status": "交易状态",

            // Page Titles
            "title_dash": "控制台",
            "title_kyc": "实名认证审核",
            "title_users": "客户账号管理",
            "title_deposits": "充值明细",
            "title_withdrawals": "提现管理中心",
            "title_loans": "贷款申请记录",
            "title_products": "产品配置管理",
            "title_settings": "账户安全设置",

            // Buttons
            "btn_edit": "编辑",
            "btn_view": "查看",
            "btn_delete": "删除",
            "btn_deactivate": "封禁账号",
            "btn_activate": "解封账号",
            "btn_create_csr": "创建业务员账号",
            "btn_approve": "审核通过",
            "btn_reject": "审核拒绝",
            "btn_update_password": "更新登录密码",

            // Form Labels
            "lbl_current_pass": "当前密码",
            "lbl_new_pass": "新密码",
            "lbl_confirm_pass": "确认新新密码",

            // Login Page
            "admin_portal": "管理员后台",
            "sign_in_desc": "请登录以继续",
            "lbl_acc_type": "选择账户类型",
            "lbl_username": "用户名",
            "lbl_password": "密码",
            "btn_sign_in": "登录",
            "ph_username": "请输入管理员用户名",
            "ph_password": "请输入密码",
            "auth_progress": "认证中...",

            // Search
            "search_placeholder": "搜索..."
            // Login Roles
"role_super_admin": "超级管理员",
"role_csr": "业务员",

// Login Errors
"err_invalid_credentials": "账号或密码错误，请重试",
"err_wrong_password": "密码错误，请重新输入",
"err_role_mismatch": "账号角色不匹配",
"err_inactive": "该账号已被停用，请联系管理员",

// Login Status
"authenticating": "正在验证身份..."
        },
        en: {
            "sidebar_front_page": "Home",
            "sidebar_kyc": "Kyc Auth",
            "sidebar_users": "Users Center",
            "sidebar_bank_accounts": "Bank Acc.",
            "sidebar_products": "Products",
            "sidebar_stock057": "Stock 057",
            "sidebar_financial": "Financial",
            "sidebar_deposits": "Deposits",
            "sidebar_withdrawals": "Withdrawals",
            "sidebar_withdrawals_req": "Withdr. Req.",
            "sidebar_loans": "Loans",
            "sidebar_rewards": "Rewards",
            "sidebar_transactions": "Transactions",
            "sidebar_stock": "Stock Trade",
            "sidebar_bulk": "Bulk Trade",
            "sidebar_otc": "OTC",
            "sidebar_ipo": "IPO",
            "sidebar_communication": "Communication",
            "sidebar_notifications": "Notifications",
            "sidebar_livechat": "Live Chat",
            "sidebar_admin_mgmt": "Admins",
            "sidebar_account_settings": "Settings",
            "group_communication": "Communication",

            "header_logout": "Logout",
            "header_settings": "Settings",
            "btn_refresh": "Refresh",

            "th_id": "ID",
            "th_user": "User",
            "th_name": "Name",
            "th_mobile": "Mobile",
            "th_amount": "Amount",
            "th_balance": "Balance",
            "th_invested": "In-transit",
            "th_status": "Status",
            "th_actions": "Actions",
            "th_time": "Time",
            "th_operate": "Operate",
            "th_client": "Client",
            "th_vip": "VIP",
            "th_credit": "Credit",
            "th_pin": "PIN",
            "th_trading_status": "Trading",

            "title_dash": "Dashboard Summary",
            "title_kyc": "KYC Verification",
            "title_users": "Customer Management",
            "title_deposits": "Deposit Records",
            "title_withdrawals": "Withdrawal Records",
            "title_loans": "Loan Records",
            "title_products": "Product Management",
            "title_settings": "Account Settings",

            "btn_edit": "Edit",
            "btn_view": "View",
            "btn_delete": "Delete",
            "btn_deactivate": "Block User",
            "btn_activate": "Activate User",
            "btn_create_csr": "Create CSR",
            "btn_approve": "Approve",
            "btn_reject": "Reject",
            "btn_update_password": "Update Password",

            "lbl_current_pass": "Current Password",
            "lbl_new_pass": "New Password",
            "lbl_confirm_pass": "Confirm Password",

            // Login Page
            "admin_portal": "Admin Portal",
            "sign_in_desc": "Please sign in to continue",
            "lbl_acc_type": "Select Account Type",
            "lbl_username": "Username",
            "lbl_password": "Password",
            "btn_sign_in": "Sign In",
            "ph_username": "Enter admin username",
            "ph_password": "Enter password",
            "auth_progress": "Authenticating...",
"role_super_admin": "Super Admin",
"role_csr": "CSR",

"err_invalid_credentials": "Invalid username or password.",
"err_wrong_password": "Incorrect password. Please try again.",
"err_role_mismatch": "Account role mismatch.",
"err_inactive": "This account is inactive. Please contact administrator.",

"authenticating": "Authenticating..."
            "search_placeholder": "Search..."
        }
    };

    window.applyTranslations = function (lang) {
        lang = lang || localStorage.getItem('admin_lang') || 'cn';
        localStorage.setItem('admin_lang', lang);

        const dict = adminTranslations[lang] || adminTranslations['cn'];

        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (dict[key]) {
                if (el.tagName === 'INPUT' && (el.placeholder || el.getAttribute('placeholder'))) {
                    el.placeholder = dict[key];
                } else if (el.tagName === 'SELECT') {
                    // Skip
                } else {
                    const icons = el.querySelectorAll('i[data-lucide], svg');
                    if (icons.length > 0) {
                        const iconHtml = Array.from(icons).map(i => i.outerHTML).join('');
                        el.innerHTML = iconHtml + ' ' + dict[key];
                    } else {
                        el.innerText = dict[key];
                    }
                }
            }
        });

        // Dynamic Tab Support for admin_customer_management.html
        if (window.PAGE_NAMES) {
            const pageKeys = {
                'home': 'sidebar_front_page',
                'kyc': 'sidebar_kyc',
                'users': 'sidebar_users',
                'bank_accounts': 'sidebar_bank_accounts',
                'products': 'sidebar_products',
                'stock057': 'sidebar_stock057',
                'deposits': 'sidebar_deposits',
                'withdrawals': 'sidebar_withdrawals_req',
                'loans': 'sidebar_loans',
                'rewards': 'sidebar_rewards',
                'stock': 'sidebar_stock',
                'bulk': 'sidebar_bulk',
                'otc': 'sidebar_otc',
                'ipo': 'sidebar_ipo',
                'messages': 'sidebar_notifications',
                'livechat': 'sidebar_livechat',
                'admin_mgmt': 'sidebar_admin_mgmt'
            };
            for (let p in pageKeys) {
                if (dict[pageKeys[p]]) window.PAGE_NAMES[p] = dict[pageKeys[p]];
            }
            if (window.renderTabs && !window._rendering_tabs) {
                window._rendering_tabs = true;
                window.renderTabs();
                window._rendering_tabs = false;
            }
        }

        // Toggle active button state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        // Optional: Re-create icons to ensure lucide works after innerHTML change
        if (window.lucide) window.lucide.createIcons();
    };

    window.switchLang = function (lang) {
        window.applyTranslations(lang);
    };

    // Auto-run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.applyTranslations());
    } else {
        window.applyTranslations();
    }
})();


