// OPD Dashboard logic
// Profile, records, appointments...

const opd = {

    init: () => {
        // Check auth when hitting OPD
        if (!auth.requireAuth()) return;

        opd.loadProfile();
        opd.renderLists();
        opd.renderAppointments();
        opd.generateQR();
    },

    switchTab: (tabId) => {
        // Update Sidebar
        document.querySelectorAll('.dashboard-menu .menu-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('onclick').includes(tabId)) el.classList.add('active');
        });

        // Update Content
        document.querySelectorAll('.dashboard-tab').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    },

    // --- Profile ---

    loadProfile: () => {
        const user = db.getCurrentUser();
        if (!user) return;

        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-age').value = user.age || '';
        document.getElementById('profile-blood').value = user.bloodGroup || 'A+';
        document.getElementById('profile-contact').value = user.emergencyContact || '';

        document.getElementById('profile-allergies').value = user.allergies ? user.allergies.join(', ') : '';
        document.getElementById('profile-conditions').value = user.conditions ? user.conditions.join(', ') : '';
    },

    saveProfile: async (e) => {
        e.preventDefault();
        const user = db.getCurrentUser();

        const updates = {
            name: document.getElementById('profile-name').value,
            age: document.getElementById('profile-age').value,
            bloodGroup: document.getElementById('profile-blood').value,
            emergencyContact: document.getElementById('profile-contact').value,
            allergies: document.getElementById('profile-allergies').value.split(',').map(s => s.trim()).filter(s => s),
            conditions: document.getElementById('profile-conditions').value.split(',').map(s => s.trim()).filter(s => s)
        };

        try {
            await db.updateUser(user.id, updates);
            app.showToast('Profile Updated!', 'success');
            // Refresh QR code
            opd.generateQR();
            // Refresh Profile View
            opd.loadProfile();
        } catch (err) {
            app.showToast('Update Failed', 'error');
        }
    },

    generateQR: () => {
        const user = db.getCurrentUser();
        const qrContainer = document.getElementById('my-qr-code');
        qrContainer.innerHTML = ''; // Clear previous

        if (user) {
            new QRCode(qrContainer, {
                text: `sehatpal:${user.id}`,
                width: 150,
                height: 150,
                colorDark: "#d32f2f", // Emergency Red
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    },

    // --- Records & Meds ---

    renderLists: () => {
        const user = db.getCurrentUser();
        if (!user) return;

        // Records
        const recordsList = document.getElementById('records-list');
        recordsList.innerHTML = '';
        if (user.records && user.records.length > 0) {
            user.records.forEach(rec => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${rec.name}</strong><br>
                        <small class="text-muted">${rec.type} • ${rec.date}</small>
                    </div>
                    <button class="btn btn-text"><i class="ri-eye-line"></i></button>
                `;
                recordsList.appendChild(li);
            });
        } else {
            recordsList.innerHTML = '<li class="empty-state">No records found. Upload one!</li>';
        }

        // Meds
        const medsList = document.getElementById('meds-list');
        medsList.innerHTML = '';
        if (user.medications && user.medications.length > 0) {
            user.medications.forEach(med => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${med.name}</strong>
                        <span class="tag">${med.dosage}</span>
                    </div>
                    <button class="btn btn-text text-danger" title="Remove (Simulated)"><i class="ri-delete-bin-line"></i></button>
                `;
                medsList.appendChild(li);
            });
        } else {
            medsList.innerHTML = '<li class="empty-state">No medications added.</li>';
        }
    },

    triggerUpload: () => {
        document.getElementById('file-upload').click();
    },

    handleFileUpload: async (input) => {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const user = db.getCurrentUser();

            // Simulate upload with metadata only
            await db.addRecord(user.id, {
                name: file.name,
                type: 'Uploaded Document'
            });

            opd.renderLists();
            app.showToast('Record Uploaded Successfully', 'success');
        }
    },

    showAddMedModal: () => {
        const form = document.getElementById('add-med-form');
        form.classList.toggle('hidden');
    },

    addMedication: async (e) => {
        e.preventDefault();
        const user = db.getCurrentUser();
        const name = document.getElementById('med-name').value;
        const dose = document.getElementById('med-dose').value;

        await db.addMedication(user.id, {
            name: name,
            dosage: dose
        });

        // Reset form
        document.getElementById('med-name').value = '';
        document.getElementById('med-dose').value = '';
        document.getElementById('add-med-form').classList.add('hidden');

        opd.renderLists();
        app.showToast('Medication Added', 'success');
    },

    // --- Appointments ---

    renderAppointments: () => {
        const user = db.getCurrentUser();
        const apptList = document.getElementById('appt-list');
        if (!apptList) return; // Guard if element not yet in DOM

        apptList.innerHTML = '';
        if (user.appointments && user.appointments.length > 0) {
            user.appointments.forEach(appt => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>${appt.doctor}</strong><br>
                        <small>${appt.date} at ${appt.time}</small>
                    </div>
                    <span class="tag" style="background:${appt.status === 'Scheduled' ? '#e0f2fe' : '#f1f5f9'}; color:${appt.status === 'Scheduled' ? '#0284c7' : '#64748b'}">${appt.status}</span>
                `;
                apptList.appendChild(li);
            });
        } else {
            apptList.innerHTML = '<li class="empty-state">No upcoming appointments.</li>';
        }
    },

    bookAppointment: async (e) => {
        e.preventDefault();
        const user = db.getCurrentUser();
        const doctor = document.getElementById('appt-doctor').value;
        const date = document.getElementById('appt-date').value;
        const time = document.getElementById('appt-time').value;

        await db.addAppointment(user.id, {
            doctor: doctor,
            date: date,
            time: time
        });

        // Reset
        document.getElementById('appt-form').reset();
        document.getElementById('add-appt-form').classList.add('hidden');

        opd.renderAppointments();
        app.showToast('Appointment Booked!', 'success');
    },

    toggleApptForm: () => {
        document.getElementById('add-appt-form').classList.toggle('hidden');
    }
};
