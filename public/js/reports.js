/**
 * reports.js — booking report filters, summary strip, CSV export (REST API).
 */
$(function () {
    initProtectedPage('Reports').then(() => {
        loadReport();
        $('#applyFilterBtn').on('click', loadReport);

        $('#exportBtn').on('click', function () {
            const qs = buildQueryString();
            window.location.href = `/api/reports/export${qs}`;
        });
    });
});

function buildQueryString() {
    const params = [];
    const from = $('#fromDate').val();
    const to = $('#toDate').val();
    const status = $('#reportStatus').val();
    if (from) params.push(`from_date=${encodeURIComponent(from)}`);
    if (to) params.push(`to_date=${encodeURIComponent(to)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    return params.length ? `?${params.join('&')}` : '';
}

function loadReport() {
    apiCall(`/reports/bookings${buildQueryString()}`)
        .then(res => {
            renderSummary(res.data.summary);
            renderReportTable(res.data.rows);
        })
        .catch(res => showToast(res.message || 'Failed to load report.', 'error'));
}

function renderSummary(s) {
    $('#summaryStrip').html(`
        <div class="summary-chip"><div class="n">${s.total_bookings}</div><div class="l">Total Bookings</div></div>
        <div class="summary-chip"><div class="n">${formatCurrency(s.total_amount)}</div><div class="l">Total Amount</div></div>
        <div class="summary-chip"><div class="n">${s.total_tickets}</div><div class="l">Total Tickets</div></div>
        <div class="summary-chip"><div class="n">${s.confirmed}</div><div class="l">Confirmed</div></div>
        <div class="summary-chip"><div class="n">${s.pending}</div><div class="l">Pending</div></div>
        <div class="summary-chip"><div class="n">${s.cancelled}</div><div class="l">Cancelled</div></div>
    `);
}

function renderReportTable(rows) {
    const $body = $('#reportBody').empty();
    if (!rows.length) {
        $body.append(`<tr><td colspan="9"><div class="empty-state"><div class="ico">📊</div>No bookings match this filter.</div></td></tr>`);
        return;
    }
    rows.forEach(r => {
        $body.append(`
            <tr>
                <td class="cell-strong">${escapeHtml(r.booking_code)}</td>
                <td>${escapeHtml(r.event_name)}<div class="cell-muted">${formatDate(r.event_date)}</div></td>
                <td>${escapeHtml(r.venue_name)}</td>
                <td>${escapeHtml(r.participant_name)}<div class="cell-muted">${escapeHtml(r.participant_email)}</div></td>
                <td>${r.num_tickets}</td>
                <td>${formatCurrency(r.total_amount)}</td>
                <td>${badgeHtml(r.booking_status)}</td>
                <td>${badgeHtml(r.payment_status || 'pending')}</td>
                <td class="cell-muted">${formatDateTime(r.created_at)}</td>
            </tr>
        `);
    });
}
