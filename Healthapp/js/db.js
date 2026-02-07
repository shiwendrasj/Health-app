// Backend API Client
// Replaces mock localStorage DB with real API calls

const API_BASE = window.location.protocol === 'file:'
    ? 'http://localhost:5000/api'
    : '/api';

const DB_KEY_CURRENT_USER = 'sehatpal_current_user';

const db = {
    // --- User Session ---

    setCurrentUser: (user) => {
        localStorage.setItem(DB_KEY_CURRENT_USER, JSON.stringify(user));
    },

    getCurrentUser: () => {
        const user = localStorage.getItem(DB_KEY_CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    logout: () => {
        localStorage.removeItem(DB_KEY_CURRENT_USER);
    },

    // --- API Calls ---

    init: async () => {
        // Check API health or similar if needed
        console.log("DB Initialized with API: " + API_BASE);
        try {
            const res = await fetch(API_BASE + '/test'); // Optional check
        } catch (e) {
            console.warn("Backend might be down or not reachable", e);
        }
    },

    authenticate: async (id, password) => {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            });
            const data = await res.json();
            if (data.success) {
                db.setCurrentUser(data.user);
                return data.user;
            } else {
                return null;
            }
        } catch (e) {
            console.error("Login failed", e);
            throw e;
        }
    },

    createUser: async (userData) => {
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                db.setCurrentUser(data.user);
                return data.user;
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (e) {
            console.error("Registration error", e);
            throw e;
        }
    },

    getUserById: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/user/${id}`);
            const data = await res.json();
            return data.id ? data : null; // Backend returns user obj directly or error
        } catch (e) {
            console.error("Get user failed", e);
            return null;
        }
    },

    updateUser: async (id, updates) => {
        try {
            const res = await fetch(`${API_BASE}/user/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (data.success) {
                // Update local session if it's the current user
                const currentUser = db.getCurrentUser();
                if (currentUser && currentUser.id === id) {
                    db.setCurrentUser(data.user);
                }
                return data.user;
            } else {
                throw new Error(data.message);
            }
        } catch (e) {
            console.error("Update failed", e);
            throw e;
        }
    },

    // --- Sub-resources ---

    addRecord: async (userId, record) => {
        try {
            await fetch(`${API_BASE}/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...record, userId })
            });
            // Refresh local user data to get updated list
            const user = await db.getUserById(userId);
            if (user) db.setCurrentUser(user);
        } catch (e) {
            console.error("Add record failed", e);
        }
    },

    addMedication: async (userId, med) => {
        try {
            await fetch(`${API_BASE}/med`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...med, userId })
            });
            const user = await db.getUserById(userId);
            if (user) db.setCurrentUser(user);
        } catch (e) {
            console.error("Add med failed", e);
        }
    },

    addAppointment: async (userId, appt) => {
        try {
            await fetch(`${API_BASE}/appt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...appt, userId })
            });
            const user = await db.getUserById(userId);
            if (user) db.setCurrentUser(user);
        } catch (e) {
            console.error("Add appt failed", e);
        }
    },

    // Seed Not Needed (Backend handles it)
    seedDemoData: () => { }
};
