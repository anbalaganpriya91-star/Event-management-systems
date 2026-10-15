/**
 * auth.js — handles login & registration form submissions against the REST API.
 */
$(function () {

    /* ---------------- LOGIN ---------------- */
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        const $btn = $('#loginBtn');
        const $alert = $('#loginAlert').removeClass('show');

        const payload = {
            email: $('#email').val().trim(),
            password: $('#password').val()
        };

        if (!payload.email || !payload.password) {
            $alert.text('Please enter both email and password.').addClass('show');
            return;
        }

        $btn.prop('disabled', true).text('Signing in...');

        apiCall('/auth/login', 'POST', payload)
            .then(res => {
                if (res.success) {
                    window.location.href = '/dashboard.html';
                } else {
                    $alert.text(res.message).addClass('show');
                }
            })
            .catch(res => {
                $alert.text(res.message || 'Login failed.').addClass('show');
            })
            .always(() => {
                $btn.prop('disabled', false).text('Sign in');
            });
    });

    /* ---------------- REGISTER ---------------- */
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();
        const $btn = $('#registerBtn');
        const $alert = $('#registerAlert').removeClass('show');
        const $success = $('#registerSuccess').removeClass('show');

        const payload = {
            full_name: $('#full_name').val().trim(),
            email: $('#email').val().trim(),
            password: $('#password').val(),
            role: $('#role').val()
        };

        if (!payload.full_name || !payload.email || !payload.password) {
            $alert.text('Please fill in all fields.').addClass('show');
            return;
        }
        if (payload.password.length < 6) {
            $alert.text('Password must be at least 6 characters.').addClass('show');
            return;
        }

        $btn.prop('disabled', true).text('Creating account...');

        apiCall('/auth/register', 'POST', payload)
            .then(res => {
                if (res.success) {
                    $success.text(res.message + ' Redirecting to login...').addClass('show');
                    setTimeout(() => window.location.href = '/login.html', 1400);
                } else {
                    $alert.text(res.message).addClass('show');
                }
            })
            .catch(res => {
                $alert.text(res.message || 'Registration failed.').addClass('show');
            })
            .always(() => {
                $btn.prop('disabled', false).text('Create account');
            });
    });
});
