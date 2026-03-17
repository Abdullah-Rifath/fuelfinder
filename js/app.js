/**
 * FuelFinder V2 - Application Logic
 * Supports Images, Price Editing, and Admin Management.
 */

const FUEL_TYPES = [
    { id: 'p92', name: 'Petrol 92', price: 346, unit: 'LKR/L' },
    { id: 'p95', name: 'Petrol 95', price: 426, unit: 'LKR/L' },
    { id: 'diesel', name: 'Auto Diesel', price: 329, unit: 'LKR/L' },
    { id: 'super_diesel', name: 'Super Diesel', price: 443, unit: 'LKR/L' },
    { id: 'kerosene', name: 'Kerosene', price: 230, unit: 'LKR/L' }
];

// Fallback image for stations
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1545129139-1eb529729213?q=80&w=2070&auto=format&fit=crop';

class MockDB {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('ff_users')) {
            const defaultAdmin = {
                id: 'admin_001',
                username: 'admin',
                password: 'password',
                role: 'admin',
                stationId: null
            };
            localStorage.setItem('ff_users', JSON.stringify([defaultAdmin]));
        }

        if (!localStorage.getItem('ff_stations')) {
            localStorage.setItem('ff_stations', JSON.stringify([]));
            this.seedData();
        }
    }

    seedData() {
        const demoStation = {
            id: 'station_001',
            name: 'Colombo City Fuel',
            brand: 'Ceypetco',
            address: '123 Galle Road, Colombo 03',
            contact: '011-2345678',
            location: 'Colombo',
            imageUrl: 'https://images.unsplash.com/photo-1626885317374-984bb07df7f7?q=80&w=2664&auto=format&fit=crop',
            lastUpdated: new Date().toISOString(),
            stock: FUEL_TYPES.map(f => ({
                id: f.id,
                name: f.name,
                price: f.price,
                available: true
            }))
        };

        const demoManager = {
            id: 'mgr_001',
            username: 'manager',
            password: 'password',
            role: 'manager',
            stationId: 'station_001'
        };

        this.addStation(demoStation);
        this.addUser(demoManager);
    }

    // --- User Management ---

    getUsers() {
        return JSON.parse(localStorage.getItem('ff_users') || '[]');
    }

    addUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('ff_users', JSON.stringify(users));
    }

    deleteUser(userId) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('ff_users', JSON.stringify(users));
    }

    authenticate(username, password) {
        const users = this.getUsers();
        return users.find(u => u.username === username && u.password === password);
    }

    // --- Station Management ---

    getStations() {
        return JSON.parse(localStorage.getItem('ff_stations') || '[]');
    }

    getStationById(id) {
        const stations = this.getStations();
        return stations.find(s => s.id === id);
    }

    addStation(station) {
        const stations = this.getStations();
        // Ensure image has fallback
        if (!station.imageUrl) station.imageUrl = DEFAULT_IMAGE;
        stations.push(station);
        localStorage.setItem('ff_stations', JSON.stringify(stations));
    }

    deleteStation(stationId) {
        let stations = this.getStations();
        stations = stations.filter(s => s.id !== stationId);
        localStorage.setItem('ff_stations', JSON.stringify(stations));

        // Also clean up managers associated
        let users = this.getUsers();
        users = users.filter(u => u.stationId !== stationId);
        localStorage.setItem('ff_users', JSON.stringify(users));
    }

    updateStationStock(stationId, fuelId, isAvailable, newPrice = null) {
        const stations = this.getStations();
        const index = stations.findIndex(s => s.id === stationId);
        if (index !== -1) {
            const station = stations[index];
            const stockIndex = station.stock.findIndex(f => f.id === fuelId);
            if (stockIndex !== -1) {
                // Update availability
                if (isAvailable !== null) station.stock[stockIndex].available = isAvailable;

                // Update price if provided
                if (newPrice !== null) station.stock[stockIndex].price = newPrice;

                station.lastUpdated = new Date().toISOString();
                stations[index] = station;
                localStorage.setItem('ff_stations', JSON.stringify(stations));
                return true;
            }
        }
        return false;
    }

    updateStation(updatedStation) {
        const stations = this.getStations();
        const index = stations.findIndex(s => s.id === updatedStation.id);
        if (index !== -1) {
            // Keep existing stock if not provided in update (though usually we update details, not stock here)
            // But we should preserve stock data if the UI doesn't send it back fully
            // For this app, we will assume we read the full object, modify it, and send it back.

            // However, ensuring we don't lose stock is safe
            const existing = stations[index];
            updatedStation.stock = existing.stock;

            stations[index] = { ...existing, ...updatedStation };
            localStorage.setItem('ff_stations', JSON.stringify(stations));
            return true;
        }
        return false;
    }
}

// Global Instance
const db = new MockDB();

// Auth Helpers
const Auth = {
    login: (username, password) => {
        const user = db.authenticate(username, password);
        if (user) {
            sessionStorage.setItem('ff_session', JSON.stringify(user));
            return user;
        }
        return null;
    },
    logout: () => {
        sessionStorage.removeItem('ff_session');
        window.location.href = 'index.html';
    },
    getCurrentUser: () => {
        return JSON.parse(sessionStorage.getItem('ff_session') || 'null');
    },
    requireAuth: (role) => {
        const user = Auth.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        if (role && user.role !== role) {
            alert('Unauthorized Access');
            window.location.href = 'index.html';
            return null;
        }
        return user;
    }
};

// Date Formatter
function formatTimeAgo(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const headers = Math.floor((now - date) / 1000);

    if (headers < 60) return 'Just now';
    const minutes = Math.floor(headers / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString();
}
