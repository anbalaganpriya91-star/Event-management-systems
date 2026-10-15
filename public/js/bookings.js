/**
 * bookings.js — booking creation, status updates, listing (REST API).
 */
let bookingsCache = [];

$(function () {
    initProtectedPage('Bookings').then(() => {
        loadBookings();

        $('#searchInput').on('input', debounce(function () {
            loadBookings($(this).val().trim(), $('#statusFilter').val());
        }, 350));

        $('#statusFilter').on('change', function () {
            loadBookings($('#searchInput').val().trim(), $(this).val());
        });

        $('#addBookingBtn').on('click', () => openBookingModal());
        $('#booking_event, #booking_tickets').on('change input', updateBookingEstimate);
        $('#saveBookingBtn').on('click', createBooking);

        $(document).on('click', '.change-status', function () {
            $('#status_booking_id').val($(this).data('id'));
            $('#new_booking_status').val($(this).data('status'));
            $('#statusModal').addClass('show');
        });

        $('#updateStatusBtn').on('click', function () {
            const id = $('#status_booking_id').val();
            const status = $('#new_booking_status').val();
            apiCall(`/bookings/${id}/status`, 'PUT', { booking_status: status })
                .then(res => { showToast(res.message, 'success'); $('#statusModal').removeClass('show'); loadBookings(); })
                .catch(res => showToast(res.message || 'Update failed.', 'error'));
        });

        $(document).on('click', '.delete-booking', function () {
            const id = $(this).data('id');
            if (!confirmAction('Delete this booking permanently?')) return;
            apiCall(`/bookings/${id}`, 'DELETE')
                .then(res => { showToast(res.message, 'success'); loadBookings(); })
                .catch(res => showToast(res.message || 'Delete failed.', 'error'));
        });
    });
});

function loadBookings(search = '', status = '') {
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    const qs = params.length ? `?${params.join('&')}` : '';

    apiCall(`/bookings${qs}`)
        .then(res => { bookingsCache = res.data; renderBookings(res.data); })
        .catch(res => showToast(res.message || 'Failed to load bookings.', 'error'));
}

function renderBookings(rows) {
    const $body = $('#bookingsBody').empty();
    if (!rows.length) {
        $body.append(`<tr><td colspan="8"><div class="empty-state"><div class="ico">📖</div>No bookings yet.</div></td></tr>`);
        return;
    }
    rows.forEach(b => {
        $body.append(`
            <tr>
                <td class="cell-strong">${escapeHtml(b.booking_code)}</td>
                <td>${escapeHtml(b.event_name)}<div class="cell-muted">${formatDate(b.event_date)}</div></td>
                <td>${escapeHtml(b.participant_name)}<div class="cell-muted">${escapeHtml(b.participant_email)}</div></td>
                <td>${b.num_tickets}</td>
                <td>${formatCurrency(b.total_amount)}</td>
                <td>${badgeHtml(b.booking_status)}</td>
                <td>${badgeHtml(b.payment_status || 'pending')}</td>
                <td class="row-actions">
                    ${b.booking_status !== 'confirmed' ? `<button class="btn btn-success btn-sm change-status" data-id="${b.id}" data-status="confirmed">Confirm</button>` : ''}
                    ${b.booking_status !== 'cancelled' ? `<button class="btn btn-danger btn-sm change-status" data-id="${b.id}" data-status="cancelled">Cancel</button>` : ''}
                    <button class="btn btn-ghost btn-sm delete-booking" data-id="${b.id}">Delete</button>
                </td>
            </tr>
        `);
    });
}

function openBookingModal() {
    $('#bookingForm')[0].reset();
    $('#bookingEstimate').hide();

    Promise.all([
        apiCall('/events/upcoming'),
        apiCall('/participants/all')
    ]).then(([evRes, partRes]) => {
        const $eventSelect = $('#booking_event').empty();
        (evRes.data || []).forEach(e => {
            $eventSelect.append(`<option value="${e.id}" data-price="${e.ticket_price}" data-seats="${e.total_seats}">${escapeHtml(e.name)} — ${formatDate(e.event_date)}</option>`);
        });

        const $partSelect = $('#booking_participant').empty();
        (partRes.data || []).forEach(p => {
            $partSelect.append(`<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.email)})</option>`);
        });

        updateBookingEstimate();
        $('#bookingModal').addClass('show');
    }).catch(() => showToast('Failed to load booking options.', 'error'));
}

function updateBookingEstimate() {
    const $opt = $('#booking_event option:selected');
    const price = parseFloat($opt.data('price')) || 0;
    const tickets = parseInt($('#booking_tickets').val()) || 0;
    if (!price || !tickets) { $('#bookingEstimate').hide(); return; }
    const total = price * tickets;
    $('#bookingEstimate').show().html(`Ticket price: <strong>${formatCurrency(price)}</strong> × ${tickets} = <strong>${formatCurrency(total)}</strong> total`);
}

function createBooking() {
    const payload = {
        event_id: $('#booking_event').val(),
        participant_id: $('#booking_participant').val(),
        num_tickets: $('#booking_tickets').val(),
    };

    if (!payload.event_id || !payload.participant_id || !payload.num_tickets) {
        showToast('Please complete all fields.', 'error');
        return;
    }

    const $btn = $('#saveBookingBtn').prop('disabled', true).text('Creating...');

    apiCall('/bookings', 'POST', payload)
        .then(res => {
            showToast(`Booking ${res.data.booking_code} created. Amount: ${formatCurrency(res.data.total_amount)}`, 'success');
            $('#bookingModal').removeClass('show');
            loadBookings();
        })
        .catch(res => showToast(res.message || 'Booking failed.', 'error'))
        .always(() => $btn.prop('disabled', false).text('Create Booking'));
}
