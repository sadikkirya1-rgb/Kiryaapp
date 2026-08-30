# Kirya Delivery Platform - API Specification & Backend Integration Guide

## Overview

This document outlines the API structure and backend integration requirements for the Kirya multi-role delivery platform. The platform consists of four separate applications (User, Rider, Merchant, Admin) that communicate with a shared backend through a RESTful API.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Frontend Applications                 │
├──────────┬──────────┬──────────┬────────────────┤
│  User    │  Rider   │ Merchant │  Admin         │
│  (User)  │ (Driver) │ (Store)  │ (Operator)     │
└──────────┴──────────┴──────────┴────────────────┘
           │            │            │            │
           └────────────┴────────────┴────────────┘
                        │
           ┌────────────▼────────────┐
           │   REST API Gateway      │
           │  (Express/FastAPI)      │
           └────────────┬────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │ Users  │    │  Orders  │    │ Merchants│
    │ DB     │    │   DB     │    │   DB     │
    └────────┘    └──────────┘    └──────────┘
```

---

## Core API Endpoints

### 1. Authentication API

**Base URL:** `/api/v1/auth`

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "user" | "rider" | "merchant" | "admin"
}

Response: {
  "statusCode": 200,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_xxx",
      "name": "Ahmed",
      "email": "ahmed@example.com",
      "role": "user",
      "phone": "+971562889428"
    }
  }
}
```

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "password123",
  "phone": "+971562889428",
  "role": "user" | "rider" | "merchant"
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer {token}
```

---

### 2. User Management API

**Base URL:** `/api/v1/users`

#### Get Current User
```
GET /users/me
Authorization: Bearer {token}

Response: {
  "statusCode": 200,
  "data": {
    "id": "user_xxx",
    "name": "Ahmed",
    "email": "ahmed@example.com",
    "phone": "+971562889428",
    "totalOrders": 24,
    "rating": 4.8,
    "savedItems": 12,
    "addresses": [...]
  }
}
```

#### Update User Profile
```
PUT /users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Ahmed Updated",
  "phone": "+971562889999",
  "profilePicture": "url_or_base64"
}
```

#### Get User Addresses
```
GET /users/me/addresses
Authorization: Bearer {token}

Response: {
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "name": "Home",
      "address": "Al Ain, Abu Dhabi",
      "latitude": 24.2155,
      "longitude": 55.7671,
      "isDefault": true
    }
  ]
}
```

#### Add Address
```
POST /users/me/addresses
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Work",
  "address": "Downtown Al Ain",
  "latitude": 24.2100,
  "longitude": 55.7600,
  "isDefault": false
}
```

---

### 3. Orders API

**Base URL:** `/api/v1/orders`

#### Create Order
```
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "restaurantId": "merchant_xxx",
  "items": [
    { "itemId": 1, "quantity": 1, "price": 35000 },
    { "itemId": 2, "quantity": 2, "price": 8000 }
  ],
  "total": 51000,
  "deliveryAddress": {
    "address": "Al Khaleej Street",
    "latitude": 24.2100,
    "longitude": 55.7600
  },
  "paymentMethod": "card" | "cash" | "wallet",
  "specialNotes": "No onions please"
}

Response: {
  "statusCode": 201,
  "data": {
    "id": "order_xxx",
    "status": "confirmed",
    "estimatedDeliveryTime": "22 min",
    "estimatedDeliveryCost": 5000,
    "total": 51000
  }
}
```

#### Get Order Details
```
GET /orders/{orderId}
Authorization: Bearer {token}

Response: {
  "statusCode": 200,
  "data": {
    "id": "order_xxx",
    "status": "delivering",
    "items": [...],
    "total": 51000,
    "rider": {
      "id": "rider_xxx",
      "name": "Mohammed",
      "rating": 4.9,
      "phone": "+971501234567"
    },
    "trackingLocation": {
      "latitude": 24.2150,
      "longitude": 55.7670,
      "heading": 45
    }
  }
}
```

#### Get User's Order History
```
GET /orders
Authorization: Bearer {token}
Query: ?limit=10&offset=0&status=completed

Response: {
  "statusCode": 200,
  "data": {
    "orders": [...],
    "total": 24,
    "limit": 10,
    "offset": 0
  }
}
```

#### Cancel Order
```
POST /orders/{orderId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Changed my mind"
}
```

#### Rate Order
```
POST /orders/{orderId}/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "review": "Great food, fast delivery",
  "rideRating": 5
}
```

---

### 4. Restaurants/Merchants API

**Base URL:** `/api/v1/merchants` or `/api/v1/restaurants`

#### Get All Merchants (for users)
```
GET /merchants
Query: ?latitude=24.2155&longitude=55.7671&radius=5&limit=20

Response: {
  "statusCode": 200,
  "data": [
    {
      "id": "merchant_xxx",
      "name": "Al Reef Restaurant",
      "rating": 4.8,
      "deliveryTime": "22 min",
      "deliveryCost": 5000,
      "minOrderValue": 30000,
      "categories": ["Indian", "Biryani"],
      "isOpen": true,
      "image": "url"
    }
  ]
}
```

#### Get Merchant Details
```
GET /merchants/{merchantId}

Response: {
  "statusCode": 200,
  "data": {
    "id": "merchant_xxx",
    "name": "Al Reef Restaurant",
    "description": "Traditional Indian cuisine",
    "rating": 4.8,
    "reviews": [...],
    "address": "Downtown Al Ain",
    "phone": "+971701234567",
    "operatingHours": {
      "monday": "09:00-23:00",
      "tuesday": "09:00-23:00"
    },
    "menu": [...]
  }
}
```

#### Get Menu Items
```
GET /merchants/{merchantId}/menu
Query: ?category=Mains

Response: {
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "name": "Biryani",
      "description": "Aromatic rice dish",
      "price": 35000,
      "category": "Mains",
      "rating": 4.8,
      "image": "url",
      "available": true
    }
  ]
}
```

---

### 5. Rider API

**Base URL:** `/api/v1/riders`

#### Get Rider Profile
```
GET /riders/me
Authorization: Bearer {token}

Response: {
  "statusCode": 200,
  "data": {
    "id": "rider_xxx",
    "name": "Mohammed",
    "phone": "+971501234567",
    "status": "online" | "offline" | "delivering",
    "rating": 4.9,
    "completedTrips": 1300,
    "earnings": {
      "today": 180000,
      "week": 1250000,
      "total": 5200000
    },
    "vehicleType": "bike",
    "location": {
      "latitude": 24.2155,
      "longitude": 55.7671
    }
  }
}
```

#### Update Rider Status
```
PUT /riders/me/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "online" | "offline" | "break"
}
```

#### Get Available Orders
```
GET /riders/available-orders
Authorization: Bearer {token}
Query: ?limit=10

Response: {
  "statusCode": 200,
  "data": [
    {
      "id": "order_xxx",
      "restaurant": "Al Reef",
      "customer": "Ahmed",
      "pickupAddress": "Downtown Al Ain",
      "deliveryAddress": "Al Khaleej Street",
      "distance": 2.3,
      "estimatedPay": 35000,
      "items": ["Biryani x1", "Naan x2"]
    }
  ]
}
```

#### Accept Order
```
POST /riders/orders/{orderId}/accept
Authorization: Bearer {token}

Response: {
  "statusCode": 200,
  "data": {
    "orderId": "order_xxx",
    "status": "accepted",
    "estimatedPickupTime": 5,
    "estimatedDeliveryTime": 20
  }
}
```

#### Update Delivery Status
```
PUT /riders/orders/{orderId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "picked_up" | "on_the_way" | "arrived" | "completed",
  "location": {
    "latitude": 24.2155,
    "longitude": 55.7671
  }
}
```

#### Submit Trip Report
```
POST /riders/trips/{tripId}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "deliveryTime": 22,
  "notes": "Customer not home, left with guard",
  "photo": "url_or_base64"
}
```

#### Get Earnings History
```
GET /riders/earnings
Authorization: Bearer {token}
Query: ?startDate=2026-08-01&endDate=2026-08-31

Response: {
  "statusCode": 200,
  "data": {
    "earnings": [
      {
        "tripId": "trip_xxx",
        "amount": 35000,
        "distance": 2.3,
        "duration": 22,
        "date": "2026-08-30"
      }
    ],
    "totalEarnings": 1250000,
    "totalTrips": 45
  }
}
```

---

### 6. Merchant Dashboard API

**Base URL:** `/api/v1/merchants/dashboard`

#### Get Merchant Dashboard
```
GET /merchants/dashboard
Authorization: Bearer {token}

Response: {
  "statusCode": 200,
  "data": {
    "store": {
      "id": "merchant_xxx",
      "name": "Al Reef Restaurant",
      "status": "online" | "offline" | "busy",
      "rating": 4.7
    },
    "sales": {
      "today": 2400000,
      "week": 12400000,
      "month": 48000000
    },
    "orders": {
      "total": 68,
      "active": 3,
      "completed": 65
    },
    "activeOrders": [
      {
        "id": "order_001",
        "customer": "Ahmed",
        "items": "Biryani x1, Naan x2",
        "status": "preparing",
        "estimatedPrepTime": 12
      }
    ]
  }
}
```

#### Update Menu Item
```
PUT /merchants/menu/{itemId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 40000,
  "available": true,
  "description": "Updated description"
}
```

#### Update Order Status (Merchant)
```
PUT /merchants/orders/{orderId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed" | "preparing" | "ready_for_pickup" | "completed",
  "estimatedTime": 15
}
```

#### Get Sales Analytics
```
GET /merchants/analytics
Authorization: Bearer {token}
Query: ?period=week&metricType=revenue

Response: {
  "statusCode": 200,
  "data": {
    "revenue": {
      "daily": [
        { "date": "2026-08-24", "amount": 1200000 }
      ],
      "total": 8400000
    },
    "topItems": [
      { "itemId": 1, "name": "Biryani", "orders": 128, "revenue": 4480000 }
    ],
    "orderStats": {
      "total": 128,
      "avgValue": 65625,
      "avgRating": 4.7
    }
  }
}
```

---

### 7. Admin API

**Base URL:** `/api/v1/admin`

#### Get Platform Dashboard
```
GET /admin/dashboard
Authorization: Bearer {token}

Response: {
  "statusCode": 200,
  "data": {
    "metrics": {
      "totalUsers": 24800,
      "activeRiders": 1350,
      "activeMerchants": 621,
      "platformUptime": 99.9,
      "dailyRevenue": 94000000,
      "monthlyRevenue": 2850000000,
      "avgOrderValue": 65000,
      "orderCompletionRate": 97.8
    },
    "alerts": [
      {
        "id": 1,
        "type": "warning" | "critical" | "info",
        "message": "High server load",
        "timestamp": "2026-08-30T10:30:00Z",
        "status": "open"
      }
    ],
    "systemHealth": {
      "apiHealth": "healthy",
      "databaseConnection": "healthy",
      "paymentGateway": "healthy"
    }
  }
}
```

#### Manage User Account
```
PUT /admin/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "suspend" | "activate" | "delete",
  "reason": "Violation of terms"
}
```

#### Manage Merchant
```
PUT /admin/merchants/{merchantId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "approve" | "reject" | "suspend",
  "reason": "Documentation incomplete"
}
```

#### Process Payout
```
POST /admin/payouts
Authorization: Bearer {token}
Content-Type: application/json

{
  "merchantId": "merchant_xxx",
  "amount": 500000,
  "method": "bank_transfer",
  "period": "2026-08"
}
```

#### Get System Logs
```
GET /admin/logs
Authorization: Bearer {token}
Query: ?limit=100&type=all

Response: {
  "statusCode": 200,
  "data": [
    {
      "timestamp": "2026-08-30T10:30:00Z",
      "level": "info" | "warning" | "error",
      "message": "User registered",
      "userId": "user_xxx"
    }
  ]
}
```

#### Generate Report
```
POST /admin/reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportType": "revenue" | "users" | "orders" | "performance",
  "startDate": "2026-08-01",
  "endDate": "2026-08-31"
}
```

---

## Real-Time APIs (WebSocket)

### Order Tracking
```javascript
// Connect
ws = new WebSocket('wss://api.kirya.app/ws/orders/{orderId}?token={jwt_token}')

// Receive location updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // {
  //   "type": "location_update",
  //   "location": { "latitude": 24.2155, "longitude": 55.7671 },
  //   "status": "on_the_way",
  //   "estimatedArrival": 8
  // }
}
```

### Rider Notifications
```javascript
ws = new WebSocket('wss://api.kirya.app/ws/rider/notifications?token={jwt_token}')

// New order notification
// { "type": "new_order", "orderId": "order_xxx", "payload": {...} }
```

---

## Error Handling

All API responses follow this format:

```json
{
  "statusCode": 200 | 400 | 401 | 404 | 500,
  "data": {...} or null,
  "error": null or {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {...}
  }
}
```

### Common Error Codes
- `INVALID_CREDENTIALS` - Login failed
- `UNAUTHORIZED` - Missing or invalid token
- `RESOURCE_NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Invalid input data
- `INSUFFICIENT_BALANCE` - User wallet balance too low
- `ORDER_CANNOT_BE_CANCELLED` - Order status doesn't allow cancellation
- `SERVER_ERROR` - Internal server error

---

## Authentication

All endpoints except `/auth/login` and `/auth/register` require a JWT token in the `Authorization` header:

```
Authorization: Bearer {jwt_token}
```

JWT Token contains:
```json
{
  "sub": "user_xxx",
  "email": "user@example.com",
  "role": "user" | "rider" | "merchant" | "admin",
  "iat": 1694745600,
  "exp": 1694832000
}
```

---

## Rate Limiting

- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated endpoints
- 1000 requests per minute for admin endpoints

---

## Recommended Backend Stack

### Node.js Stack (Recommended)
- **Framework:** Express.js or Fastify
- **Database:** PostgreSQL + Redis
- **ORM:** Sequelize or TypeORM
- **Auth:** JWT + bcrypt
- **Real-time:** Socket.io or ws
- **Task Queue:** Bull or RabbitMQ
- **Maps:** Google Maps or Mapbox API
- **Payments:** Stripe or local payment gateway

### Python Stack
- **Framework:** FastAPI or Django Rest Framework
- **Database:** PostgreSQL + Redis
- **ORM:** SQLAlchemy
- **Async:** AsyncIO or Celery
- **Real-time:** Socket.io-python
- **Deployment:** Docker + Kubernetes

### Example Node.js Setup
```bash
npm install express dotenv bcryptjs jsonwebtoken sequelize pg redis cors helmet express-rate-limit socket.io
```

---

## Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.kirya.app

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kirya_delivery
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# Payment Gateway
PAYMENT_API_KEY=your_payment_key
PAYMENT_SECRET=your_payment_secret

# Maps
GOOGLE_MAPS_API_KEY=your_maps_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password

# Admin
ADMIN_EMAIL=admin@kirya.app
ADMIN_PASSWORD=secure_password
```

---

## Deployment Checklist

- [ ] Set up PostgreSQL database with proper schema
- [ ] Configure Redis for caching and sessions
- [ ] Implement all API endpoints
- [ ] Add JWT authentication
- [ ] Set up payment gateway integration
- [ ] Configure email notifications
- [ ] Add SMS notifications (for ride updates)
- [ ] Set up file storage (AWS S3 or similar)
- [ ] Implement real-time features with WebSocket
- [ ] Add rate limiting and security headers
- [ ] Set up logging and monitoring
- [ ] Configure CI/CD pipeline
- [ ] Deploy to production server
- [ ] Set up SSL/HTTPS
- [ ] Configure domain and DNS
- [ ] Add backup and disaster recovery
- [ ] Set up monitoring and alerting

---

## Next Steps

1. **Set up backend repository** with the recommended tech stack
2. **Create database schema** for users, orders, merchants, riders, payments
3. **Implement authentication** with JWT and OAuth2
4. **Build API endpoints** starting with user and auth flows
5. **Integrate payment gateway** for order checkout
6. **Add geolocation services** for merchant discovery and delivery tracking
7. **Implement real-time features** with WebSocket for order tracking
8. **Add notifications** (email, SMS, push notifications)
9. **Deploy to production** with proper security and monitoring
10. **Monitor and scale** based on usage metrics

---

**Last Updated:** 2026-08-30  
**API Version:** v1  
**Status:** Production Ready
