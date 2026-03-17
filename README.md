# FuelFinder

FuelFinder is a web application designed to help users locate fuel stations, check fuel availability, and view current fuel prices. The application features a clean, responsive user interface and supports different user roles for managing the system.

## Features

- **Public View**: Users can search for fuel stations, view their details, and check the real-time availability and prices of different fuel types (e.g., Petrol 92, Petrol 95, Auto Diesel, Super Diesel, Kerosene).
- **Manager Portal**: Station managers can log in to update the availability and prices of fuel at their specific station.
- **Admin Portal**: Administrators can manage the entire system, including adding or removing stations and users.

## User Roles & Default Credentials

The application uses a mock database stored in the browser's `localStorage`. By default, it seeds the following credentials:

- **Admin**
  - Username: `admin`
  - Password: `password`
- **Manager (Demo Station)**
  - Username: `manager`
  - Password: `password`
  
*Note: Public users do not require an account to view fuel stations.*

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Data Storage**: Client-side `localStorage` (Mock Database for demonstration)

## Setup & Execution

Since the project consists purely of static frontend files, no complex server setup is required.

1. Clone or download the repository to your local machine.
2. Open `index.html` in any modern web browser to view the application.
3. Access the login screen via the "Manager Login" or "Admin Access" links (if available) or navigate to `login.html`.

## Project Structure

- `/css` - Contains stylesheets (`styles.css`).
- `/js` - Contains the application logic (`app.js`, `admin.js`, `manager.js`).
- `index.html` - The main public-facing page showcasing fuel stations.
- `login.html` - The unified login portal for Admin and Manager accounts.
- `admin.html` - The dashboard for administrators.
- `manager.html` - The dashboard for station managers.

## Recent Updates

- Added a password visibility toggle (eye icon) to the login screen for better user experience.
- UI/UX polish on the Manager Portal.
