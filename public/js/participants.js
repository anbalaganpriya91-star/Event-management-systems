/**
 * participants.js — CRUD interactions for the Participants page (REST API).
 */
let participantsCache = [];

$(function () {
    initProtectedPage('Participants').then(() => {
        loadParticipants();

        $('#searchInput').on('input', debounce(function () {
            loadParticipants($(this).val().trim());
        }, 350));

        $('#addParticipantBtn').on('click', () => openParticipantModal());
        $('#saveParticipantBtn').on('click', saveParticipant);

        $(document).on('click', '.edit-participant', function () {
            const id = $(this).data('id');
            const p = participantsCache.find(x => x.id == id);
            if (p) openParticipantModal(p);
        });

        $(document).on('click', '.delete-participant', function () {
            const id = $(this).data('id');
            const name = $(this).data('name');
            if (!confirmAction(`Delete participant "${name}"?`)) return;

            apiCall(`/participants/${id}`, 'DELETE')
                .then(res => { showToast(res.message, 'success'); loadParticipants(); })
                .catch(res => showToast(res.message || 'Delete failed.', 'error'));
        });
    });
});

function loadParticipants(search = '') {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    apiCall(`/participants${qs}`)
        .then(res => { participantsCache = res.data; renderParticipants(res.data); })
        .catch(res => showToast(res.message || 'Failed to load participants.', 'error'));
}

function renderParticipants(rows) {
    const $body = $('#participantsBody').empty();
    if (!rows.length) {
        $body.append(`<tr><td colspan="6"><div class="empty-state"><div class="ico">👥</div>No participants yet.</div></td></tr>`);
        return;
    }
    rows.forEach(p => {
        $body.append(`
            <tr>
                <td class="cell-strong">${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.email)}</td>
                <td>${escapeHtml(p.phone || '—')}</td>
                <td class="cell-muted">${escapeHtml(p.address || '—')}</td>
                <td>${formatDate(p.created_at)}</td>
                <td class="row-actions">
                    <button class="btn btn-ghost btn-sm edit-participant" data-id="${p.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-participant" data-id="${p.id}" data-name="${escapeHtml(p.name)}">Delete</button>
                </td>
            </tr>
        `);
    });
}

function openParticipantModal(p = null) {
    $('#participantForm')[0].reset();
    if (p) {
        $('#participantModalTitle').text('Edit Participant');
        $('#participant_id').val(p.id);
        $('#participant_name').val(p.name);
        $('#participant_email').val(p.email);
        $('#participant_phone').val(p.phone);
        $('#participant_address').val(p.address);
    } else {
        $('#participantModalTitle').text('Add Participant');
        $('#participant_id').val('');
    }
    $('#participantModal').addClass('show');
}

function saveParticipant() {
    const id = $('#participant_id').val();
    const payload = {
        name: $('#participant_name').val().trim(),
        email: $('#participant_email').val().trim(),
        phone: $('#participant_phone').val().trim(),
        address: $('#participant_address').val().trim(),
    };

    if (!payload.name || !payload.email) {
        showToast('Name and email are required.', 'error');
        return;
    }

    const $btn = $('#saveParticipantBtn').prop('disabled', true).text('Saving...');
    const call = id ? apiCall(`/participants/${id}`, 'PUT', payload) : apiCall('/participants', 'POST', payload);

    call
        .then(res => {
            showToast(res.message, 'success');
            $('#participantModal').removeClass('show');
            loadParticipants();
        })
        .catch(res => showToast(res.message || 'Save failed.', 'error'))
        .always(() => $btn.prop('disabled', false).text('Save Participant'));
}
