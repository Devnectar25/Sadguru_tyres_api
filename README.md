# Sadguru Tyres - REST API Backend (`Sadguru_tyres_api`)

Express.js RESTful API service for the **Sadguru Tyres & Mobility Solutions** web application.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run API server
npm start
# or for development mode
npm run dev
```

The server will run on `http://localhost:5000`.

## 📌 Available Endpoints

### 🩺 Health & Auth
- `GET /api/health` - Server health check
- `POST /api/admin/login` - Admin login authentication (`admin@sadgurutyres.com` / `admin123`)

### 🛞 Tyres Inventory (`/api/tyres`)
- `GET /api/tyres` - List all tyres
- `GET /api/tyres/:id` - Get specific tyre details
- `POST /api/tyres` - Add a new tyre
- `PUT /api/tyres/:id` - Update tyre information
- `DELETE /api/tyres/:id` - Remove a tyre

### 🏷️ Partner Brands (`/api/brands`)
- `GET /api/brands` - List all manufacturer brands
- `POST /api/brands` - Add a partner brand
- `PUT /api/brands/:id` - Update brand details
- `DELETE /api/brands/:id` - Delete a brand

### 📅 Service Bookings (`/api/bookings`)
- `GET /api/bookings` - List all customer appointments
- `POST /api/bookings` - Create a new booking
- `PATCH /api/bookings/:id` - Update booking status

### 📋 Fleet Quotes (`/api/quotes`)
- `GET /api/quotes` - List quote requests
- `POST /api/quotes` - Submit a wholesale quote request
