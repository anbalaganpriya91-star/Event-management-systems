/**
 * venues.js — CRUD interactions for the Venues page (REST API).
 */
let venuesCache = [];

$(function () {
    initProtectedPage('Venues').then(() => {
        loadVenues();

        $('#searchInput').on('input', debounce(function () {
            loadVenues($(this).val().trim());
        }, 350));

        $('#addVenueBtn').on('click', () => openVenueModal());
        $('#saveVenueBtn').on('click', saveVenue);

        $(document).on('click', '.edit-venue', function () {
            const id = $(this).data('id');
            const venue = venuesCache.find(v => v.id == id);
            if (venue) openVenueModal(venue);
        });

        $(document).on('click', '.delete-venue', function () {
            const id = $(this).data('id');
            const name = $(this).data('name');
            if (!confirmAction(`Delete venue "${name}"? This cannot be undone.`)) return;

            apiCall(`/venues/${id}`, 'DELETE')
                .then(res => { showToast(res.message, 'success'); loadVenues(); })
                .catch(res => showToast(res.message || 'Delete failed.', 'error'));
        });
    });
});

function loadVenues(search = '') {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    apiCall(`/venues${qs}`)
        .then(res => { venuesCache = res.data; renderVenues(res.data); })
        .catch(res => showToast(res.message || 'Failed to load venues.', 'error'));
}

function renderVenues(rows) {
    const $body = $('#venuesBody').empty();
    if (!rows.length) {
        $body.append(`<tr><td colspan="6"><div class="empty-state"><div class="ico">🏛</div>No venues found. Add your first venue to get started.</div></td></tr>`);
        return;
    }
    rows.forEach(v => {
        $body.append(`
            <tr>
                <td class="cell-strong">${escapeHtml(v.name)}</td>
                <td>${escapeHtml(v.location)}</td>
                <td>${v.capacity}</td>
                <td>${formatCurrency(v.price_per_day)}</td>
                <td>${badgeHtml(v.status)}</td>
                <td class="row-actions">
                    <button class="btn btn-ghost btn-sm edit-venue" data-id="${v.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-venue" data-id="${v.id}" data-name="${escapeHtml(v.name)}">Delete</button>
                </td>
            </tr>
        `);
    });
}

function openVenueModal(venue = null) {
    $('#venueForm')[0].reset();
    if (venue) {
        $('#venueModalTitle').text('Edit Venue');
        $('#venue_id').val(venue.id);
        $('#venue_name').val(venue.name);
        $('#venue_location').val(venue.location);
        $('#venue_capacity').val(venue.capacity);
        $('#venue_price').val(venue.price_per_day);
        $('#venue_amenities').val(venue.amenities);
        $('#venue_status').val(venue.status);
    } else {
        $('#venueModalTitle').text('Add Venue');
        $('#venue_id').val('');
    }
    $('#venueModal').addClass('show');
}

function saveVenue() {
    const id = $('#venue_id').val();
    const payload = {
        name: $('#venue_name').val().trim(),
        location: $('#venue_location').val().trim(),
        capacity: $('#venue_capacity').val(),
        price_per_day: $('#venue_price').val(),
        amenities: $('#venue_amenities').val().trim(),
        status: $('#venue_status').val(),
    };

    if (!payload.name || !payload.location || !payload.capacity) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    const $btn = $('#saveVenueBtn').prop('disabled', true).text('Saving...');
    const call = id ? apiCall(`/venues/${id}`, 'PUT', payload) : apiCall('/venues', 'POST', payload);

    call
        .then(res => {
            showToast(res.message, 'success');
            $('#venueModal').removeClass('show');
            loadVenues();
        })
        .catch(res => showToast(res.message || 'Save failed.', 'error'))
        .always(() => $btn.prop('disabled', false).text('Save Venue'));
}
