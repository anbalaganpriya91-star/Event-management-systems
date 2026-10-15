/**
 * payments.js — payment workflow: process, refund, mark failed (REST API).
 */
let paymentsCache = [];

$(function () {
    initProtectedPage('Payments').then(() => {
        loadPayments();

        $('#statusFilter').on('change', function () { loadPayments($(this).val()); });

        $(document).on('click', '.process-payment', function () {
            const id = $(this).data('id');
            const payment = paymentsCache.find(p => p.id == id);
            if (!payment) return;
            $('#process_payment_id').val(id);
            $('#process_amount').text(formatCurrency(payment.amount));
            $('#processModal').addClass('show');
        });

        $('#confirmProcessBtn').on('click', function () {
            const id = $('#process_payment_id').val();
            const method = $('input[name="pm"]:checked').val();
            const $btn = $(this).prop('disabled', true).text('Processing...');

            apiCall(`/payments/${id}/process`, 'POST', { payment_method: method })
                .then(res => { showToast(res.message, 'success'); $('#processModal').removeClass('show'); loadPayments(); })
                .catch(res => showToast(res.message || 'Payment processing failed.', 'error'))
                .always(() => $btn.prop('disabled', false).text('Confirm Payment'));
        });

        $(document).on('click', '.refund-payment', function () {
            const id = $(this).data('id');
            if (!confirmAction('Refund this payment and cancel the linked booking?')) return;
            apiCall(`/payments/${id}/refund`, 'POST')
                .then(res => { showToast(res.message, 'success'); loadPayments(); })
                .catch(res => showToast(res.message || 'Refund failed.', 'error'));
        });

        $(document).on('click', '.fail-payment', function () {
            const id = $(this).data('id');
            if (!confirmAction('Mark this payment as failed?')) return;
            apiCall(`/payments/${id}/fail`, 'POST')
                .then(res => { showToast(res.message, 'success'); loadPayments(); })
                .catch(res => showToast(res.message || 'Update failed.', 'error'));
        });
    });
});

function loadPayments(status = '') {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    apiCall(`/payments${qs}`)
        .then(res => { paymentsCache = res.data; renderPayments(res.data); })
        .catch(res => showToast(res.message || 'Failed to load payments.', 'error'));
}

function renderPayments(rows) {
    const $body = $('#paymentsBody').empty();
    if (!rows.length) {
        $body.append(`<tr><td colspan="9"><div class="empty-state"><div class="ico">💳</div>No payment records yet.</div></td></tr>`);
        return;
    }
    rows.forEach(p => {
        let actions = '';
        if (p.payment_status === 'pending') {
            actions = `<button class="btn btn-success btn-sm process-payment" data-id="${p.id}">Process</button>
                       <button class="btn btn-danger btn-sm fail-payment" data-id="${p.id}">Mark Failed</button>`;
        } else if (p.payment_status === 'paid') {
            actions = `<button class="btn btn-ghost btn-sm refund-payment" data-id="${p.id}">Refund</button>`;
        } else {
            actions = `<span class="cell-muted">—</span>`;
        }

        $body.append(`
            <tr>
                <td class="cell-strong">${escapeHtml(p.transaction_id)}</td>
                <td>${escapeHtml(p.booking_code)}</td>
                <td>${escapeHtml(p.event_name)}</td>
                <td>${escapeHtml(p.participant_name)}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td class="cell-muted" style="text-transform:capitalize;">${escapeHtml(p.payment_method.replace('_',' '))}</td>
                <td>${badgeHtml(p.payment_status)}</td>
                <td class="cell-muted">${p.payment_date ? formatDateTime(p.payment_date) : '—'}</td>
                <td class="row-actions">${actions}</td>
            </tr>
        `);
    });
}
