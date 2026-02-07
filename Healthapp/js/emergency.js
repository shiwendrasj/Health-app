// Everything related to the emergency section
// Scanner, QR logic etc.

const emergency = {

    html5QrcodeScanner: null,

    init: () => {
        // Setup listener for view change to stop scanner if leaving emergency mode
    },

    startScanner: () => {
        document.getElementById('scanner-container').classList.remove('hidden');
        document.getElementById('patient-info-display').classList.add('hidden');

        // If scanner already running, don't restart
        if (emergency.html5QrcodeScanner) return;

        emergency.html5QrcodeScanner = new Html5Qrcode("reader");

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        emergency.html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            emergency.onScanSuccess,
            emergency.onScanFailure
        ).catch(err => {
            console.error("Error starting scanner", err);
            // Fallback for testing on desktop without camera permission sometimes
            // app.showToast("Camera access required for scanning", "error");
        });
    },

    stopScanner: () => {
        if (emergency.html5QrcodeScanner) {
            emergency.html5QrcodeScanner.stop().then(() => {
                emergency.html5QrcodeScanner.clear();
                emergency.html5QrcodeScanner = null;
            }).catch(err => console.error("Failed to stop scanner", err));
        }
    },

    onScanSuccess: async (decodedText, decodedResult) => {
        // Format expected: "sehatpal:<userid>"
        if (decodedText.startsWith('sehatpal:')) {
            const userId = decodedText.split(':')[1];
            try {
                const patient = await db.getUserById(userId);

                if (patient) {
                    app.showToast("Patient Identified", "success");
                    emergency.displayPatientInfo(patient);
                    // Pause/Stop scanner
                    emergency.stopScanner();
                } else {
                    app.showToast("Patient not found in database", "error");
                }
            } catch (e) {
                app.showToast("Error fetching patient info", "error");
            }
        } else {
            app.showToast("Invalid QR Code format", "error");
        }
    },

    onScanFailure: (error) => {
        // console.warn(`Code scan error = ${error}`);
    },

    displayPatientInfo: (patient) => {
        document.getElementById('scanner-container').classList.add('hidden');
        document.getElementById('patient-info-display').classList.remove('hidden');

        document.getElementById('display-name').textContent = patient.name;
        document.getElementById('display-age').textContent = patient.age + " Years";
        document.getElementById('display-blood').textContent = patient.bloodGroup;
        document.getElementById('display-contact').textContent = patient.emergencyContact;
        document.getElementById('display-contact-link').href = `tel:${patient.emergencyContact}`;

        // Allergies
        const allergiesContainer = document.getElementById('display-allergies');
        allergiesContainer.innerHTML = '';
        if (patient.allergies && patient.allergies.length > 0) {
            patient.allergies.forEach(allergy => {
                const tag = document.createElement('span');
                tag.className = 'tag allergy';
                tag.textContent = allergy;
                allergiesContainer.appendChild(tag);
            });
        } else {
            allergiesContainer.innerHTML = '<span class="text-muted">No Known Allergies</span>';
        }

        // Medical Conditions
        const conditionsContainer = document.getElementById('display-conditions');
        conditionsContainer.innerHTML = '';
        if (patient.conditions && patient.conditions.length > 0) {
            patient.conditions.forEach(cond => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.style.background = '#fee2e2'; // Light red for attention
                tag.style.color = '#b91c1c';
                tag.textContent = cond;
                conditionsContainer.appendChild(tag);
            });
        } else {
            conditionsContainer.innerHTML = '<span class="text-muted">None Reported</span>';
        }
    },

    resetScanner: () => {
        emergency.startScanner();
    },

    toggleMyQR: async () => {
        const qrContainer = document.getElementById('emergency-qr-container');
        const scannerContainer = document.getElementById('scanner-container');
        const infoContainer = document.getElementById('patient-info-display');

        if (qrContainer.classList.contains('hidden')) {
            // Show QR, Hide Scanner/Info
            // Check auth first
            // Allow access without explicit login by falling back to demo user
            let user = db.getCurrentUser();
            if (!user) {
                // FALLBACK for "Without Logging" request
                // Using 'demo' user to show functionality
                try {
                    user = await db.getUserById('demo');
                } catch (e) { console.error(e); }

                if (!user) {
                    app.showToast('No user data available.', 'error');
                    return;
                }
                app.showToast('Displaying Demo Profile QR', 'info');
            }

            emergency.stopScanner();
            scannerContainer.classList.add('hidden');
            infoContainer.classList.add('hidden');
            qrContainer.classList.remove('hidden');

            emergency.generateQR(user);
        } else {
            // Hide QR, Show Scanner
            qrContainer.classList.add('hidden');
            scannerContainer.classList.remove('hidden');
            infoContainer.classList.add('hidden');
            emergency.startScanner();
        }
    },

    generateQR: (user) => {
        const qrCodeDiv = document.getElementById('emergency-qr-code');
        qrCodeDiv.innerHTML = ''; // Clear previous

        new QRCode(qrCodeDiv, {
            text: `sehatpal:${user.id}`,
            width: 200,
            height: 200,
            colorDark: "#d32f2f", // Emergency Red
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
};
