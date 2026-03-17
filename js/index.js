/**
 * Logic for the Public Interface (index.html) - V2
 */

document.addEventListener('DOMContentLoaded', () => {
    const stationGrid = document.getElementById('stationGrid');
    const searchInput = document.getElementById('searchInput');

    // Initial Render
    renderStations(db.getStations());

    // Debounce Helper
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Search Listener (Debounced)
    const handleSearch = debounce((e) => {
        const query = e.target.value.toLowerCase();
        const allStations = db.getStations();
        const filtered = allStations.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.location.toLowerCase().includes(query) ||
            s.brand.toLowerCase().includes(query)
        );
        renderStations(filtered);
    }, 300); // 300ms delay

    searchInput.addEventListener('input', handleSearch);

    function renderStations(stations) {
        stationGrid.innerHTML = '';

        if (stations.length === 0) {
            stationGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h3 class="text-muted">No stations found matching your search.</h3>
                </div>
            `;
            return;
        }

        stations.forEach(station => {
            const card = document.createElement('div');
            card.className = 'card';

            // Image handling
            const imageUrl = station.imageUrl || DEFAULT_IMAGE;

            // Generate Fuel List HTML
            const fuelListHtml = station.stock.map(fuel => {
                const statusClass = fuel.available ? 'status-available' : 'status-unavailable';
                const dotClass = fuel.available ? 'bg-green' : 'bg-red';
                const statusText = fuel.available ? 'Available' : 'Unavailable';

                return `
                    <li class="fuel-item">
                        <span class="text-sm"><strong>${fuel.name}</strong></span>
                        <div class="text-right">
                            <span class="status-badge ${statusClass}">
                                <div class="status-dot ${dotClass}"></div>
                                ${statusText}
                            </span>
                            <div class="text-muted" style="font-size: 0.8rem; margin-top: 4px;">
                                ${fuel.price} LKR
                            </div>
                        </div>
                    </li>
                `;
            }).join('');

            card.innerHTML = `
                <img src="${imageUrl}" alt="${station.name}" class="station-card-img" onerror="this.src='${DEFAULT_IMAGE}'">
                
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin-bottom: 0.25rem;">${station.name}</h3>
                        <span style="font-size: 0.85rem; color: var(--accent-blue); background: #EFF6FF; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${station.brand}</span>
                    </div>
                </div>

                <div style="font-size: 0.9rem; color: #4B5563; margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-direction: column;">
                     <div style="display: flex; gap: 6px; align-items: flex-start;">
                        <span>📍</span> ${station.location}
                     </div>
                     <div style="display: flex; gap: 6px; align-items: center; color: #6B7280; font-size: 0.8rem;">
                        <span>🕒</span> Last updated: ${formatTimeAgo(station.lastUpdated)}
                     </div>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #F3F4F6; margin-bottom: 10px;">

                <ul class="fuel-list">
                    ${fuelListHtml}
                </ul>
            `;

            stationGrid.appendChild(card);
        });
    }
});
