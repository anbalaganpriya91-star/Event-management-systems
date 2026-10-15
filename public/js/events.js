/**
 * events.js — CRUD interactions for the Events page (REST API).
 */
let eventsCache = [];

$(function () {
    initProtectedPage('Events').then(() => {
        loadVenueOptions();
        loadEvents();

        $('#searchInput').on('input', debounce(function () {
            loadEvents($(this).val().trim(), $('#statusFilter').val());
        }, 350));

        $('#statusFilter').on('change', function () {
            loadEvents($('#searchInput').val().trim(), $(this).val());
        });

        $('#addEventBtn').on('click', () => openEventModal());
        $('#saveEventBtn').on('click', saveEvent);

        $(document).on('click', '.edit-event', function () {
            const id = $(this).data('id');
            const ev = eventsCache.find(x => x.id == id);
            if (ev) openEventModal(ev);
        });

        $(document).on('click', '.delete-event', function () {
            const id = $(this).data('id');
            const name = $(this).data('name');
            if (!confirmAction(`Delete event "${name}"?`)) return;

            apiCall(`/events/${id}`, 'DELETE')
                .then(res => { showToast(res.message, 'success'); loadEvents(); })
                .catch(res => showToast(res.message || 'Delete failed.', 'error'));
        });
    });
});

function loadVenueOptions() {
    apiCall('/venues/available')
        .then(res => {
            const $select = $('#event_venue').empty();
            res.data.forEach(v => {
                $select.append(`<option value="${v.id}">${escapeHtml(v.name)} — ${escapeHtml(v.location)} (cap. ${v.capacity})</option>`);
            });
        })
        .catch(() => showToast('Failed to load venues.', 'error'));
}

function loadEvents(search = '', status = '') {
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    const qs = params.length ? `?${params.join('&')}` : '';

    apiCall(`/events${qs}`)
        .then(res => { eventsCache = res.data; renderEvents(res.data); })
        .catch(res => showToast(res.message || 'Failed to load events.', 'error'));
}

function renderEvents(rows) {
    const $body = $('#eventsBody').empty();
    if (!rows.length) {
        $body.append(`<tr><td colspan="8"><div class="empty-state"><div class="ico">🎫</div>No events found.</div></td></tr>`);
        return;
    }
    rows.forEach(e => {
        $body.append(`
            <tr>
                <td class="cell-strong">${escapeHtml(e.name)}<div class="cell-muted">${escapeHtml(e.category || '')}</div></td>
                <td>${escapeHtml(e.venue_name)}</td>
                <td>${formatDate(e.event_date)}</td>
                <td class="cell-muted">${(e.start_time || '').slice(0,5)} - ${(e.end_time || '').slice(0,5)}</td>
                <td>${formatCurrency(e.ticket_price)}</td>
                <td>${e.total_seats}</td>
                <td>${badgeHtml(e.status)}</td>
                <td class="row-actions">
                    <button class="btn btn-ghost btn-sm edit-event" data-id="${e.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-event" data-id="${e.id}" data-name="${escapeHtml(e.name)}">Delete</button>
                </td>
            </tr>
        `);
    });
}

function openEventModal(ev = null) {
    $('#eventForm')[0].reset();
    if (ev) {
        $('#eventModalTitle').text('Edit Event');
        $('#event_id').val(ev.id);
        $('#event_name').val(ev.name);
        $('#event_category').val(ev.category);
        $('#event_venue').val(ev.venue_id);
        $('#event_description').val(ev.description);
        $('#event_date').val(ev.event_date);
        $('#event_organizer').val(ev.organizer_name);
        $('#event_start').val((ev.start_time || '').slice(0,5));
        $('#event_end').val((ev.end_time || '').slice(0,5));
        $('#event_price').val(ev.ticket_price);
        $('#event_seats').val(ev.total_seats);
        $('#event_status').val(ev.status);
    } else {
        $('#eventModalTitle').text('Add Event');
        $('#event_id').val('');
    }
    $('#eventModal').addClass('show');
}

function saveEvent() {
    const id = $('#event_id').val();
    const payload = {
        name: $('#event_name').val().trim(),
        category: $('#event_category').val().trim(),
        venue_id: $('#event_venue').val(),
        description: $('#event_description').val().trim(),
        event_date: $('#event_date').val(),
        organizer_name: $('#event_organizer').val().trim(),
        start_time: $('#event_start').val(),
        end_time: $('#event_end').val(),
        ticket_price: $('#event_price').val(),
        total_seats: $('#event_seats').val(),
        status: $('#event_status').val(),
    };

    if (!payload.name || !payload.venue_id || !payload.event_date || !payload.start_time || !payload.end_time) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    const $btn = $('#saveEventBtn').prop('disabled', true).text('Saving...');
    const call = id ? apiCall(`/events/${id}`, 'PUT', payload) : apiCall('/events', 'POST', payload);

    call
        .then(res => {
            showToast(res.message, 'success');
            $('#eventModal').removeClass('show');
            loadEvents();
        })
        .catch(res => showToast(res.message || 'Save failed.', 'error'))
        .always(() => $btn.prop('disabled', false).text('Save Event'));
}
