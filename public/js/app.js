/**
 * app.js — shared utilities used across every dashboard page.
 * Uses jQuery + $.ajax to talk to the Express REST API (same-origin session cookie auth).
 */

const API_BASE = '/api';

/* ---------- Generic REST API wrapper over $.ajax ---------- */
function apiCall(path, method = 'GET', body = null) {
    const settings = {
        url: `${API_BASE}${path}`,
        method: method,
        dataType: 'json',
        xhrFields: { withCredentials: true },
    };
    if (body !== null && (method === 'POST' || method === 'PUT')) {
        settings.contentType = 'application/json';
        settings.data = JSON.stringify(body);
    }

    return $.ajax(settings)
        .then((res) => res)
        .catch((xhr) => {
            const res = xhr.responseJSON || { success: false, message: 'Something went wrong. Please try again.' };
            if (xhr.status === 401) {
                window.location.href = '/login.html';
            }
            return $.Deferred().reject(res).promise();
        });
}

/* ---------- Toast notifications ---------- */
function showToast(message, type = 'success') {
    let container = $('.toast-container');
    if (!container.length) {
        container = $('<div class="toast-container"></div>').appendTo('body');
    }
    const toast = $(`<div class="toast ${type}"></div>`).text(message);
    container.append(toast);
    setTimeout(() => toast.fadeOut(200, () => toast.remove()), 3200);
}

/* ---------- HTML escaping (defense against stored XSS in rendered lists) ---------- */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ---------- Currency / date formatting ---------- */
function formatCurrency(amount) {
    const n = parseFloat(amount || 0);
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d)) return dateStr;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function badgeHtml(status) {
    const cls = 'badge-' + String(status || '').toLowerCase().replace(/\s+/g, '-');
    return `<span class="badge ${cls}">${escapeHtml(status || 'n/a')}</span>`;
}

/* ---------- Debounce for search inputs ---------- */
function debounce(fn, delay = 350) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function confirmAction(message) {
    return window.confirm(message);
}

/* ---------- Shared sidebar/topbar shell ---------- */
const NAV_ITEMS = [
    { section: 'Overview', links: [{ href: 'dashboard.html', icon: '▣', label: 'Dashboard' }] },
    {
        section: 'Manage',
        links: [
            { href: 'venues.html', icon: '🏛', label: 'Venues' },
            { href: 'events.html', icon: '🎫', label: 'Events' },
            { href: 'participants.html', icon: '👥', label: 'Participants' },
            { href: 'bookings.html', icon: '📖', label: 'Bookings' },
            { href: 'payments.html', icon: '💳', label: 'Payments' },
        ],
    },
    { section: 'Insights', links: [{ href: 'reports.html', icon: '📊', label: 'Reports' }] },
];

function buildSidebarHtml(user) {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navHtml = NAV_ITEMS.map((group) => {
        const links = group.links
            .map(
                (l) => `<a href="/${l.href}" class="${l.href === currentPage ? 'active' : ''}"><span class="ico">${l.icon}</span> ${l.label}</a>`
            )
            .join('');
        return `<div class="nav-label">${group.section}</div>${links}`;
    }).join('');

    const initials = (user.full_name || 'U').charAt(0).toUpperCase();

    return `
    <div class="overlay-dim"></div>
    <div class="app-shell">
        <aside class="sidebar">
            <div class="sidebar-brand">Event<span>Ly</span></div>
            <nav class="sidebar-nav">${navHtml}</nav>
            <div class="sidebar-foot">Logged in as<br><strong style="color:#fff">${escapeHtml(user.role)}</strong></div>
        </aside>
        <div class="main">
            <header class="topbar">
                <div style="display:flex;align-items:center;gap:14px;">
                    <button class="menu-toggle">☰</button>
                    <h1 id="pageTitle"></h1>
                </div>
                <div class="user-chip">
                    <div class="user-meta" style="text-align:right;">
                        <div class="name">${escapeHtml(user.full_name)}</div>
                        <div class="role">${escapeHtml(user.role)}</div>
                    </div>
                    <div class="avatar">${initials}</div>
                    <button id="logoutBtn" class="btn btn-ghost btn-sm">Logout</button>
                </div>
            </header>
            <div class="content" id="pageContent"></div>
        </div>
    </div>`;
}

/**
 * Call this at the top of every protected page's script.
 * Verifies the session via /api/auth/me, injects the sidebar shell,
 * moves the page's <template id="page-body"> markup into #pageContent,
 * wires up shared shell events, then resolves with the logged-in user.
 * Redirects to /login.html automatically if the session is invalid.
 */
function initProtectedPage(pageTitle) {
    return apiCall('/auth/me')
        .then((res) => {
            const user = res.data;
            const $template = $('#page-body');
            const templateHtml = $template.length ? $template.html() : '';

            $('body').prepend(buildSidebarHtml(user));
            $('#pageTitle').text(pageTitle);
            $('#pageContent').html(templateHtml);
            $template.remove();

            attachShellEvents();
            return user;
        })
        .catch(() => {
            window.location.href = '/login.html';
            return $.Deferred().reject().promise();
        });
}

function attachShellEvents() {
    $('.menu-toggle').on('click', function () {
        $('.sidebar').toggleClass('open');
        $('.overlay-dim').toggleClass('show');
    });
    $('.overlay-dim').on('click', function () {
        $('.sidebar').removeClass('open');
        $(this).removeClass('show');
    });
    $('#logoutBtn').on('click', function (e) {
        e.preventDefault();
        apiCall('/auth/logout', 'POST').always(() => {
            window.location.href = '/login.html';
        });
    });

    // Generic modal close handlers
    $(document).on('click', '.modal-close, [data-modal-close]', function () {
        $(this).closest('.modal-overlay').removeClass('show');
    });
    $(document).on('click', '.modal-overlay', function (e) {
        if (e.target === this) $(this).removeClass('show');
    });
}
