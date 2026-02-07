// Main application logic
// This handles the navigation and global stuff

const app = {

    start: async () => {
        await db.init(); // Connect to Cloud if configured
        app.updateNav();

        // Simple routing based on session or default
        // const user = db.getCurrentUser();
        // if (user) app.navigateTo('opd');
        // else app.navigateTo('landing');

        // Always start at landing for better demo flow unless explicit
        app.navigateTo('landing');
    },

    navigateTo: (viewId) => {
        // Hiding all views
        document.querySelectorAll('.view').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });

        // Showing target view
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.remove('hidden');
            requestAnimationFrame(() => target.classList.add('active')); // for animation
        }

        // Specific View Init Logic
        if (viewId === 'emergency') {
            emergency.startScanner();
        } else {
            // Stop scanner if leaving emergency
            // emergency.stopScanner(); 
        }

        if (viewId === 'opd') {
            opd.init();
        }
    },

    goHome: () => {
        // Determine where 'Home' is based on login state
        // If logged in, maybe Dashboard? Or just Landing allows choice?
        // Let's go to Landing to allow Mode Selection again
        app.navigateTo('landing');
    },

    updateNav: () => {
        const user = db.getCurrentUser();
        const nav = document.getElementById('main-nav');

        if (user) {
            nav.classList.remove('hidden');
            document.getElementById('user-greeting').textContent = `Hello, ${user.name.split(' ')[0]}`;
        } else {
            nav.classList.add('hidden');
        }
    },

    showToast: (message, type = 'info') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast visible ${type}`; // reset

        if (type === 'success') toast.style.backgroundColor = '#10b981'; // Green
        if (type === 'error') toast.style.backgroundColor = '#ef4444'; // Red
        if (type === 'info') toast.style.backgroundColor = '#1e293b'; // Dark

        // Show
        toast.classList.remove('hidden');

        // Hide after 3s
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
};

// Initialize App on Load
document.addEventListener('DOMContentLoaded', () => {
    app.start();
});
