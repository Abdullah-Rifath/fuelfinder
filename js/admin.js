/**
 * Logic for Admin Dashboard (admin.html) - V2.1 (Edit & Upload)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const user = Auth.requireAuth('admin');
    if (!user) return;

    // 2. Elements
    const form = document.getElementById('registerStationForm');
    const stationList = document.getElementById('stationList');
    const imageInput = document.getElementById('stationImageFile');
    const imageBase64Input = document.getElementById('stationImageBase64');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editStationIdInput = document.getElementById('editStationId');
    const passwordHelp = document.getElementById('passwordHelp');
    const mgrPasswordInput = document.getElementById('mgrPassword');
    const mgrUsernameInput = document.getElementById('mgrUsername');

    // 3. Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });

    // 4. Render List
    renderStationsList();

    // 5. File Input Handler (Resize & Crop to 600x300)
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Valid types
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image (JPG, PNG, WebP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                // Resize Logic
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Target Dimensions
                const TARGET_WIDTH = 600;
                const TARGET_HEIGHT = 300;
                canvas.width = TARGET_WIDTH;
                canvas.height = TARGET_HEIGHT;

                // Calculate Aspect Ratio
                const srcRatio = img.width / img.height;
                const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

                let renderWidth, renderHeight, offsetX, offsetY;

                if (srcRatio > targetRatio) {
                    // Source is wider than target: Crop width
                    renderHeight = TARGET_HEIGHT;
                    renderWidth = img.width * (TARGET_HEIGHT / img.height);
                    offsetX = (TARGET_WIDTH - renderWidth) / 2; // Center horizontally
                    offsetY = 0;
                } else {
                    // Source is taller than target: Crop height
                    renderWidth = TARGET_WIDTH;
                    renderHeight = img.height * (TARGET_WIDTH / img.width);
                    offsetX = 0;
                    offsetY = (TARGET_HEIGHT - renderHeight) / 2; // Center vertically
                }

                // Draw to canvas (High Quality)
                ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

                // Export as JPEG (Quality 0.7)
                const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.7);

                imageBase64Input.value = optimizedBase64;
                showImagePreview(optimizedBase64);
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });

    // 6. Form Submit (Create or Update)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = editStationIdInput.value;
        const name = document.getElementById('stationName').value;
        const brand = document.getElementById('stationBrand').value;
        const address = document.getElementById('stationAddress').value;
        const location = document.getElementById('stationLocation').value;
        const contact = document.getElementById('stationContact').value;
        const imageUrl = imageBase64Input.value;
        const mgrUser = mgrUsernameInput.value;
        const mgrPass = mgrPasswordInput.value;

        if (id) {
            // --- UPDATE EXISTING ---
            const existingStation = db.getStationById(id);
            if (!existingStation) return;

            // Update Station Object
            const updatedStation = {
                id: id,
                name, brand, address, contact, location,
                imageUrl: imageUrl || existingStation.imageUrl // Keep old image if no new one
            };

            db.updateStation(updatedStation);

            // Update Manager (Password only if changed)
            if (mgrPass) {
                const users = db.getUsers();
                const mgrIndex = users.findIndex(u => u.stationId === id);
                if (mgrIndex !== -1) {
                    users[mgrIndex].password = mgrPass;
                    // Note: Username change not supported in this simple prototype to avoid ID conflicts, 
                    // but we could allow it if we checked uniqueness.
                    localStorage.setItem('ff_users', JSON.stringify(users));
                }
            }

            alert('Station updated successfully.');
            resetForm();

        } else {
            // --- CREATE NEW ---
            // Check username uniqueness
            if (db.getUsers().find(u => u.username === mgrUser)) {
                alert('Username already taken!');
                return;
            }

            const newId = 'station_' + Date.now();
            const newStation = {
                id: newId,
                name, brand, address, contact, location,
                imageUrl: imageUrl || null,
                lastUpdated: new Date().toISOString(),
                stock: FUEL_TYPES.map(f => ({
                    id: f.id, name: f.name, price: f.price, available: true
                }))
            };

            const newManager = {
                id: 'mgr_' + Date.now(),
                username: mgrUser,
                password: mgrPass,
                role: 'manager',
                stationId: newId
            };

            db.addStation(newStation);
            db.addUser(newManager);

            alert('Station created successfully.');
            resetForm();
        }

        renderStationsList();
    });

    // 7. Cancel Edit
    cancelEditBtn.addEventListener('click', resetForm);

    function resetForm() {
        form.reset();
        editStationIdInput.value = '';
        imageBase64Input.value = '';
        imagePreview.style.display = 'none';

        // Reset UI content
        submitBtnText.textContent = 'Create Station';
        submitBtn.className = 'btn btn-primary';
        cancelEditBtn.style.display = 'none';

        // Reset Manager fields
        mgrUsernameInput.removeAttribute('disabled');
        mgrPasswordInput.setAttribute('required', 'required');
        passwordHelp.style.display = 'none';
    }

    function showImagePreview(src) {
        imagePreview.style.display = 'block';
        imagePreview.querySelector('img').src = src;
    }

    // 8. Render List & Actions
    function renderStationsList() {
        const stations = db.getStations();
        const users = db.getUsers();

        if (stations.length === 0) {
            stationList.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 2rem;">No stations registered yet.</td></tr>`;
            return;
        }

        stationList.innerHTML = stations.map(s => {
            const manager = users.find(u => u.stationId === s.id);
            const mgrName = manager ? manager.username : '<span class="text-muted">None</span>';

            return `
                <tr class="table-row">
                    <td style="padding: 1rem;">
                        <div style="font-weight: 700; color: var(--text-dark);">${s.name}</div>
                        <div style="font-size: 0.85rem;" class="text-muted">${s.brand}</div>
                    </td>
                    <td style="padding: 1rem;">${s.location}</td>
                    <td style="padding: 1rem;">
                        <span style="background: #EFF6FF; color: #1D4ED8; px: 2px; py: 1px; border-radius: 4px; font-size: 0.85rem; padding: 2px 6px;">
                            ${mgrName}
                        </span>
                    </td>
                    <td style="padding: 1rem; text-align: right;">
                        <button class="btn btn-outline btn-sm edit-btn" data-id="${s.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 5px;">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${s.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach Listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure?')) {
                    db.deleteStation(id);
                    renderStationsList();
                    // If we were editing this one, reset form
                    if (editStationIdInput.value === id) resetForm();
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                startEdit(id);
            });
        });
    }

    function startEdit(id) {
        const station = db.getStationById(id);
        const users = db.getUsers();
        const manager = users.find(u => u.stationId === id);

        if (!station) return;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Populate Fields
        document.getElementById('stationName').value = station.name;
        document.getElementById('stationBrand').value = station.brand;
        document.getElementById('stationAddress').value = station.address;
        document.getElementById('stationLocation').value = station.location;
        document.getElementById('stationContact').value = station.contact;

        // Image
        if (station.imageUrl && station.imageUrl.startsWith('data:')) {
            imageBase64Input.value = station.imageUrl;
            showImagePreview(station.imageUrl);
        } else {
            imageBase64Input.value = '';
            imagePreview.style.display = 'none';
        }

        // Manager (Username readonly)
        if (manager) {
            mgrUsernameInput.value = manager.username;
            mgrUsernameInput.setAttribute('disabled', 'disabled');
        } else {
            mgrUsernameInput.value = '';
            mgrUsernameInput.removeAttribute('disabled');
        }

        // Password logic
        mgrPasswordInput.value = '';
        mgrPasswordInput.removeAttribute('required');
        passwordHelp.style.display = 'block';

        // Set Edit Mode UI
        editStationIdInput.value = id;
        submitBtnText.textContent = 'Update Station';
        submitBtn.className = 'btn btn-success'; // assuming specific style or fallback to primary
        submitBtn.style.backgroundColor = 'var(--success-green)';
        cancelEditBtn.style.display = 'block';
    }
});
