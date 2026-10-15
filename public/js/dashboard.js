/**
 * dashboard.js — loads dashboard stats and renders Chart.js visualizations.
 */
$(function () {
    initProtectedPage('Dashboard').then(loadDashboard);
});

function loadDashboard() {
    apiCall('/dashboard/stats')
        .then(res => {
            if (!res.success) return showToast(res.message, 'error');
            renderStatCards(res.data);
            renderRevenueChart(res.data.revenue_trend);
            renderStatusChart(res.data.bookings_by_status);
            renderRecentBookings(res.data.recent_bookings);
            renderTopVenues(res.data.top_venues);
        })
        .catch(res => showToast(res.message || 'Failed to load dashboard.', 'error'));
}

function renderStatCards(d) {
    const cards = [
        { label: 'Total Venues', value: d.total_venues, icon: '🏛', cls: 'icon-teal' },
        { label: 'Total Events', value: d.total_events, icon: '🎫', cls: 'icon-amber' },
        { label: 'Total Bookings', value: d.total_bookings, icon: '📖', cls: 'icon-teal' },
        { label: 'Revenue Collected', value: formatCurrency(d.total_revenue), icon: '💰', cls: 'icon-green' },
    ];
    const $grid = $('#statGrid').empty();
    cards.forEach(c => {
        $grid.append(`
            <div class="stat-card">
                <div><div class="label">${c.label}</div><div class="value">${c.value}</div></div>
                <div class="stat-icon ${c.cls}">${c.icon}</div>
            </div>
        `);
    });

    if (!$('#statGridSecondary').length) {
        $('.stat-grid').after(`
            <div class="summary-strip" id="statGridSecondary">
                <div class="summary-chip"><div class="n">${d.confirmed_bookings}</div><div class="l">Confirmed</div></div>
                <div class="summary-chip"><div class="n">${d.pending_bookings}</div><div class="l">Pending</div></div>
                <div class="summary-chip"><div class="n">${d.cancelled_bookings}</div><div class="l">Cancelled</div></div>
                <div class="summary-chip"><div class="n">${d.pending_payments}</div><div class="l">Pending Payments</div></div>
                <div class="summary-chip"><div class="n">${d.upcoming_events}</div><div class="l">Upcoming Events</div></div>
            </div>
        `);
    }
}

let revenueChartInstance = null;
function renderRevenueChart(trend) {
    const ctx = document.getElementById('revenueChart');
    const labels = trend.length ? trend.map(t => t.month) : ['No data yet'];
    const values = trend.length ? trend.map(t => parseFloat(t.total)) : [0];

    if (revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Revenue', data: values, borderColor: '#E8871E', backgroundColor: 'rgba(232,135,30,0.12)', fill: true, tension: 0.35, pointRadius: 3 }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

let statusChartInstance = null;
function renderStatusChart(byStatus) {
    const ctx = document.getElementById('statusChart');
    const colors = { confirmed: '#2F855A', pending: '#B7791F', cancelled: '#C0392B' };
    const labels = byStatus.length ? byStatus.map(s => s.status) : ['No bookings yet'];
    const values = byStatus.length ? byStatus.map(s => parseInt(s.count)) : [1];
    const bg = byStatus.length ? byStatus.map(s => colors[s.status] || '#1B3A4B') : ['#DFDCD3'];

    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: bg, borderWidth: 0 }] },
        options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }, cutout: '65%' }
    });
}

function renderRecentBookings(rows) {
    const $body = $('#recentBookingsBody').empty();
    if (!rows.length) return $body.append('<tr><td colspan="5" style="text-align:center;color:#8A9096;">No bookings yet.</td></tr>');
    rows.forEach(r => {
        $body.append(`
            <tr>
                <td class="cell-strong">${escapeHtml(r.booking_code)}</td>
                <td>${escapeHtml(r.event_name)}</td>
                <td>${escapeHtml(r.participant_name)}</td>
                <td>${formatCurrency(r.total_amount)}</td>
                <td>${badgeHtml(r.booking_status)}</td>
            </tr>
        `);
    });
}

function renderTopVenues(rows) {
    const $body = $('#topVenuesBody').empty();
    if (!rows.length) return $body.append('<tr><td colspan="2" style="text-align:center;color:#8A9096;">No data yet.</td></tr>');
    rows.forEach(r => {
        $body.append(`<tr><td class="cell-strong">${escapeHtml(r.name)}</td><td>${r.bookings_count}</td></tr>`);
    });
}
