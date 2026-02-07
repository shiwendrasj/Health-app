// Authentication handling
// Login, signup and session storage

const auth = {

    init: () => {
        // specific init logic if needed
    },

    switchTab: (tab) => {
        const tabs = document.querySelectorAll('.auth-tabs .tab');
        const forms = document.querySelectorAll('.auth-form');

        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.classList.add('hidden'));
        forms.forEach(f => f.classList.remove('active'));

        if (tab === 'login') {
            tabs[0].classList.add('active');
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('login-form').classList.add('active');
        } else {
            tabs[1].classList.add('active');
            document.getElementById('signup-form').classList.remove('hidden');
            document.getElementById('signup-form').classList.add('active');
        }
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;

        try {
            const user = await db.authenticate(id, pass);

            if (user) {
                db.setCurrentUser(user);
                app.showToast('Login Successful!', 'success');
                app.updateNav();
                app.navigateTo('opd');
            } else {
                app.showToast('Invalid ID or Password', 'error');
            }
        } catch (err) {
            app.showToast('Login Error: ' + err.message, 'error');
        }
    },

    handleSignup: async (e) => {
        e.preventDefault();

        try {
            const newUser = {
                id: document.getElementById('signup-id').value,
                password: document.getElementById('signup-pass').value,
                name: document.getElementById('signup-name').value,
                bloodGroup: document.getElementById('signup-blood').value,
                emergencyContact: document.getElementById('signup-contact').value,
                // Default empty arrays for other fields
                allergies: [],
                conditions: []
            };

            const createdUser = await db.createUser(newUser);
            db.setCurrentUser(createdUser);

            app.showToast('Account Created Successfully!', 'success');
            app.updateNav();
            app.navigateTo('opd');

        } catch (err) {
            app.showToast(err.message, 'error');
        }
    },

    logout: () => {
        db.logout();
        app.updateNav();
        app.showToast('Logged out', 'success');
        app.navigateTo('landing');
    },

    // Guard: Redirect to login if not authenticated
    requireAuth: () => {
        const user = db.getCurrentUser();
        if (!user) {
            app.showToast('Please login first', 'info');
            app.navigateTo('auth');
            return false;
        }
        return true;
    }
};
