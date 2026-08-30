# Kirya Backend Implementation Guide

## Quick Start with Node.js + Express

This guide helps you build the backend for Kirya Delivery Platform.

---

## Project Setup

### 1. Initialize Node.js Project

```bash
mkdir kirya-backend
cd kirya-backend
npm init -y
npm install express dotenv bcryptjs jsonwebtoken sequelize pg redis cors helmet express-rate-limit socket.io axios
npm install --save-dev nodemon sequelize-cli
```

### 2. Create Project Structure

```
kirya-backend/
├── config/
│   ├── database.js
│   ├── redis.js
│   └── constants.js
├── models/
│   ├── User.js
│   ├── Order.js
│   ├── Merchant.js
│   ├── Rider.js
│   └── Payment.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── orders.js
│   ├── merchants.js
│   ├── riders.js
│   ├── admin.js
│   └── index.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── orderController.js
│   ├── merchantController.js
│   ├── riderController.js
│   └── adminController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validator.js
├── utils/
│   ├── logger.js
│   ├── helpers.js
│   └── notifications.js
├── .env
├── .env.example
├── server.js
└── package.json
```

---

## Core Implementation Files

### 1. `.env.example`

```bash
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kirya_delivery
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRY=24h

# Admin Default
ADMIN_EMAIL=admin@kirya.app
ADMIN_PASSWORD=AdminPassword123!
```

### 2. `server.js` (Main Entry Point)

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/merchants', require('./routes/merchants'));
app.use('/api/v1/riders', require('./routes/riders'));
app.use('/api/v1/admin', require('./routes/admin'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    statusCode: err.statusCode || 500,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 3. `config/database.js`

```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

module.exports = sequelize;
```

### 4. `middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      statusCode: 401,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      statusCode: 401,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

module.exports = authMiddleware;
```

### 5. `controllers/authController.js`

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate input
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        statusCode: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        error: { code: 'USER_EXISTS', message: 'User already registered' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    // Generate token
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.status(201).json({
      statusCode: 201,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        statusCode: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        statusCode: 401,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Check role
    if (user.role !== role) {
      return res.status(403).json({
        statusCode: 403,
        error: { code: 'ROLE_MISMATCH', message: 'User role does not match' }
      });
    }

    // Generate token
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.status(200).json({
      statusCode: 200,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};
```

### 6. `models/User.js`

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => 'user_' + Math.random().toString(36).substr(2, 9)
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('user', 'rider', 'merchant', 'admin'),
    defaultValue: 'user'
  },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  totalOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: true });

module.exports = User;
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role ENUM('user', 'rider', 'merchant', 'admin') DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  rating FLOAT DEFAULT 5.0,
  totalOrders INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  merchantId VARCHAR(50) NOT NULL,
  riderId VARCHAR(50),
  status VARCHAR(50) DEFAULT 'confirmed',
  items JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  deliveryAddress JSON NOT NULL,
  pickupAddress JSON,
  paymentMethod VARCHAR(50),
  estimatedDeliveryTime INT,
  rating FLOAT,
  review TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (merchantId) REFERENCES users(id),
  FOREIGN KEY (riderId) REFERENCES users(id)
);
```

### Merchants Table (Store Info)
```sql
CREATE TABLE merchants (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL UNIQUE,
  storeName VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT,
  rating FLOAT DEFAULT 4.5,
  status VARCHAR(50) DEFAULT 'pending',
  operatingHours JSON,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Riders Table
```sql
CREATE TABLE riders (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL UNIQUE,
  vehicleType VARCHAR(50),
  status VARCHAR(50) DEFAULT 'offline',
  rating FLOAT DEFAULT 5.0,
  completedTrips INT DEFAULT 0,
  earnings DECIMAL(15,2) DEFAULT 0,
  latitude FLOAT,
  longitude FLOAT,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## Integration Steps

### 1. Connect Frontend to Backend

Update `packages/shared/api.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export const API = {
  auth: {
    register: (data) => fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    
    login: (data) => fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json())
  },
  
  orders: {
    create: (data, token) => fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    
    getOrder: (orderId, token) => fetch(`${API_URL}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
  }
};
```

### 2. Update Frontend App State

```javascript
// apps/user/app.js
async function openBrowseFlow() {
  try {
    const response = await API.orders.create({
      restaurantId: 'merchant_xxx',
      items: userState.cart,
      total: cartTotal,
      deliveryAddress: userState.savedAddresses[0],
      paymentMethod: 'card'
    }, localStorage.getItem('auth_token'));
    
    const order = response.data;
    userState.orders.unshift(order);
    showNotification('Order created successfully!', 'success');
  } catch (error) {
    showNotification('Failed to create order: ' + error.message, 'error');
  }
}
```

### 3. Local Testing

```bash
# Terminal 1: Start backend
cd kirya-backend
npm start

# Terminal 2: Start frontend
cd /workspaces/Kiryaapp
python3 -m http.server 8000

# Visit http://localhost:8000/landing.html
```

---

## Testing Checklist

- [ ] User registration and login works
- [ ] JWT token is generated and stored
- [ ] Protected endpoints require valid token
- [ ] Order creation flow works
- [ ] Rider can accept orders
- [ ] Merchant dashboard updates correctly
- [ ] Admin can view platform metrics
- [ ] Real-time order tracking works
- [ ] Payments process correctly
- [ ] Notifications are sent

---

## Deployment Commands

```bash
# Production build
npm run build

# Deploy to Heroku
heroku create kirya-api
git push heroku main
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_secret

# Or Docker
docker build -t kirya-backend .
docker run -p 3000:3000 kirya-backend
```

---

## Monitoring & Logging

Add to `server.js`:

```javascript
const morgan = require('morgan');
const logger = require('./utils/logger');

app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg) }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

---

## Next Resources

- [Sequelize Documentation](https://sequelize.org/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Socket.io Docs](https://socket.io/docs/)

---

**Ready to build?** Start with the `server.js` and auth controller, then build out the models and routes.
