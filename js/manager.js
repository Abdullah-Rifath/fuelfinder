/**
 * Logic for Manager Dashboard (manager.html) - V2
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const user = Auth.requireAuth('manager');
    if (!user) return;

    // 2. Load Station Data
    const station = db.getStationById(user.stationId);
    if (!station) {
        alert('Error: Station not found for this manager.');
        Auth.logout();
        return;
    }

    document.getElementById('stationNameDisplay').textContent = station.name;

    // 2.1 Load Current Image
    const currentImg = document.getElementById('currentStationImage');
    const imageInput = document.getElementById('stationImageFile');
    const imageBase64Input = document.getElementById('stationImageBase64');
    const updateImageBtn = document.getElementById('updateImageBtn');

    // Set initial image (with fallback)
    currentImg.src = station.imageUrl || DEFAULT_IMAGE;
    currentImg.onerror = () => { currentImg.src = DEFAULT_IMAGE; };

    // File Input Handler (Reuse Resizing Logic)
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image (JPG, PNG, WebP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const TARGET_WIDTH = 600;
                const TARGET_HEIGHT = 300;
                canvas.width = TARGET_WIDTH;
                canvas.height = TARGET_HEIGHT;

                const srcRatio = img.width / img.height;
                const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

                let renderWidth, renderHeight, offsetX, offsetY;

                if (srcRatio > targetRatio) {
                    renderHeight = TARGET_HEIGHT;
                    renderWidth = img.width * (TARGET_HEIGHT / img.height);
                    offsetX = (TARGET_WIDTH - renderWidth) / 2;
                    offsetY = 0;
                } else {
                    renderWidth = TARGET_WIDTH;
                    renderHeight = img.height * (TARGET_WIDTH / img.width);
                    offsetX = 0;
                    offsetY = (TARGET_HEIGHT - renderHeight) / 2;
                }

                ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
                const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.7);

                // Update Preview and Hidden Input
                currentImg.src = optimizedBase64;
                imageBase64Input.value = optimizedBase64;
                updateImageBtn.removeAttribute('disabled');
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Update Image Handler
    updateImageBtn.addEventListener('click', () => {
        const newImage = imageBase64Input.value;
        if (newImage) {
            db.updateStation({
                id: station.id,
                imageUrl: newImage
            });
            alert('Station image updated successfully!');
            updateImageBtn.setAttribute('disabled', 'true');
            // Clear file input visually
            imageInput.value = '';
        }
    });

    // 3. Render Stock List
    renderStockList(station);

    // 4. Logout Handler
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });

    function renderStockList(station) {
        const list = document.getElementById('managerStockList');
        list.innerHTML = '';

        station.stock.forEach(fuel => {
            const li = document.createElement('li');
            li.className = 'fuel-item';
            li.style.display = 'grid';
            li.style.gridTemplateColumns = '1fr 120px 140px 100px';
            li.style.gap = '1.5rem';
            li.style.alignItems = 'center';
            li.style.padding = '1rem 0'; // More breathing room
            li.style.borderBottom = '1px solid #F1F5F9';

            const isChecked = fuel.available ? 'checked' : '';
            const statusColor = fuel.available ? 'var(--success-green)' : 'var(--danger-red)';
            const statusText = fuel.available ? 'Available' : 'Unavailable';

            li.innerHTML = `
                <div>
                    <strong style="font-size: 1.1rem; color: var(--text-dark);">${fuel.name}</strong>
                </div>
                
                <div class="text-right">
                    <input type="number" 
                           class="price-input" 
                           value="${fuel.price}" 
                           id="price-${fuel.id}" 
                           data-fuel-id="${fuel.id}">
                </div>

                <div class="text-center">
                     <span id="status-text-${fuel.id}" style="font-size: 0.9rem; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.05em;">
                        ${statusText}
                    </span>
                </div>
                
                <div class="text-center" style="display: flex; justify-content: center;">
                    <label class="switch">
                        <input type="checkbox" ${isChecked} data-fuel-id="${fuel.id}">
                        <span class="slider"></span>
                    </label>
                </div>
            `;

            list.appendChild(li);
        });

        // Add Listeners
        const checkboxes = list.querySelectorAll('input[type="checkbox"]');
        const priceInputs = list.querySelectorAll('input[type="number"]');

        // Toggle Listener
        checkboxes.forEach(box => {
            box.addEventListener('change', (e) => {
                const fuelId = e.target.dataset.fuelId;
                const isAvailable = e.target.checked;

                // Update UI text
                const statusText = document.getElementById(`status-text-${fuelId}`);
                statusText.textContent = isAvailable ? 'Available' : 'Unavailable';
                statusText.style.color = isAvailable ? 'var(--success-green)' : 'var(--danger-red)';

                // Update DB
                updateDB(fuelId, isAvailable, null);
            });
        });

        // Price Listener (Update on blur/change)
        priceInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const fuelId = e.target.dataset.fuelId;
                const newPrice = parseFloat(e.target.value);

                if (newPrice > 0) {
                    updateDB(fuelId, null, newPrice);
                } else {
                    alert('Invalid price');
                    // Reset to old value (reload list)
                    renderStockList(db.getStationById(station.id));
                }
            });
        });
    }

    function updateDB(fuelId, isAvailable, newPrice) {
        db.updateStationStock(station.id, fuelId, isAvailable, newPrice);
        document.getElementById('lastSyncTime').textContent = new Date().toLocaleTimeString();
    }
});
