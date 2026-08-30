import { APP_CONFIG } from '../../packages/shared/constants.js';

// Merchant App State Management
const merchantState = {
  merchantId: 'merchant_' + Math.random().toString(36).substr(2, 9),
  storeName: 'Al Reef Restaurant',
  status: 'online', // 'online', 'offline', 'busy'
  location: 'Downtown Al Ain',
  menu: [
    { id: 1, name: 'Biryani', price: 35000, category: 'Mains', available: true, rating: 4.8 },
    { id: 2, name: 'Naan Bread', price: 8000, category: 'Bread', available: true, rating: 4.7 },
    { id: 3, name: 'Tandoori Chicken', price: 45000, category: 'Mains', available: true, rating: 4.9 },
    { id: 4, name: 'Raita', price: 5000, category: 'Sides', available: false, rating: 4.5 },
    { id: 5, name: 'Lassi', price: 6000, category: 'Drinks', available: true, rating: 4.6 }
  ],
  orders: [],
  sales: {
    today: 2400000,
    week: 12400000,
    month: 48000000
  },
  ordersCount: 68,
  rating: 4.7,
  activeOrders: 0
};

// Initialize Merchant App
document.addEventListener('DOMContentLoaded', () => {
  console.log('🏪 Merchant App initialized', merchantState);
  loadOrders();
  updateMerchantMetrics();
  setupMerchantListeners();
});

// Setup merchant event listeners
function setupMerchantListeners() {
  const dashboardBtn = document.querySelector('a[href="../../index.html"]');
  const analyticsBtn = dashboardBtn?.nextElementSibling;
  
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      accessDashboard();
    });
  }
  
  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      viewAnalytics();
    });
  }
}

// Access merchant dashboard
function accessDashboard() {
  console.log('📊 Merchant Dashboard:');
  console.log('Store:', merchantState.storeName);
  console.log('Status:', merchantState.status);
  console.log('Active Orders:', merchantState.activeOrders);
  console.log('Menu Items:', merchantState.menu.length);
  
  console.log('\n📋 Incoming Orders:');
  merchantState.orders.forEach((order, idx) => {
    console.log(`${idx + 1}. ${order.customerName} - ${order.items.join(', ')} (${order.status})`);
  });
  
  showNotification('Dashboard opened. Check console.', 'info');
}

// View detailed analytics
function viewAnalytics() {
  const analytics = {
    todayEarnings: merchantState.sales.today,
    weekEarnings: merchantState.sales.week,
    monthEarnings: merchantState.sales.month,
    totalOrders: merchantState.ordersCount,
    rating: merchantState.rating,
    averageOrderValue: Math.round(merchantState.sales.today / merchantState.ordersCount),
    topItems: merchantState.menu.filter(m => m.available).slice(0, 3),
    customerSatisfaction: merchantState.rating * 20 + '%'
  };
  
  console.log('📈 Analytics:', analytics);
  console.log(`Average Order Value: UGX ${analytics.averageOrderValue}`);
  console.log(`Customer Satisfaction: ${analytics.customerSatisfaction}`);
  
  showNotification(
    `Today: UGX ${analytics.todayEarnings}. This week: UGX ${analytics.weekEarnings}`,
    'info'
  );
}

// Load incoming orders
function loadOrders() {
  merchantState.orders = [
    {
      id: 'order_001',
      customerName: 'Ahmed',
      items: ['Biryani x1', 'Naan x2'],
      total: 43000,
      status: 'confirmed',
      orderTime: new Date(Date.now() - 5 * 60000),
      estimatedPrepTime: 15
    },
    {
      id: 'order_002',
      customerName: 'Fatima',
      items: ['Tandoori Chicken x1', 'Raita x1'],
      total: 50000,
      status: 'preparing',
      orderTime: new Date(Date.now() - 8 * 60000),
      estimatedPrepTime: 12
    },
    {
      id: 'order_003',
      customerName: 'Mohammed',
      items: ['Biryani x2', 'Lassi x2'],
      total: 76000,
      status: 'ready_for_pickup',
      orderTime: new Date(Date.now() - 20 * 60000),
      estimatedPrepTime: 18
    }
  ];
  
  merchantState.activeOrders = merchantState.orders.filter(o => 
    o.status === 'confirmed' || o.status === 'preparing'
  ).length;
  
  console.log(`📦 Loaded ${merchantState.orders.length} orders (${merchantState.activeOrders} active)`);
}

// Toggle menu item availability
function toggleMenuItemAvailability(itemId) {
  const item = merchantState.menu.find(m => m.id === itemId);
  if (item) {
    item.available = !item.available;
    console.log(`${item.available ? '✓' : '✗'} ${item.name} is now ${item.available ? 'available' : 'unavailable'}`);
    showNotification(`${item.name} is ${item.available ? 'available' : 'unavailable'}`, 'info');
  }
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
  const order = merchantState.orders.find(o => o.id === orderId);
  if (order) {
    const oldStatus = order.status;
    order.status = newStatus;
    console.log(`✓ Order ${orderId}: ${oldStatus} → ${newStatus}`);
    
    if (newStatus === 'ready_for_pickup') {
      showNotification(`Order ready for pickup - Notify rider`, 'success');
    } else if (newStatus === 'completed') {
      showNotification(`Order completed - Thank you!`, 'success');
    }
  }
}

// Update menu item price
function updateMenuItemPrice(itemId, newPrice) {
  const item = merchantState.menu.find(m => m.id === itemId);
  if (item) {
    const oldPrice = item.price;
    item.price = newPrice;
    console.log(`✓ ${item.name}: UGX ${oldPrice} → UGX ${newPrice}`);
    showNotification(`${item.name} price updated`, 'info');
  }
}

// Record order completion and update earnings
function completeOrder(orderId) {
  const order = merchantState.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'completed';
    merchantState.ordersCount += 1;
    console.log(`✅ Order completed - UGX ${order.total} earned`);
    showNotification(`Order completed! Earned UGX ${order.total}`, 'success');
  }
}

// Update merchant metrics
function updateMerchantMetrics() {
  console.log('📊 Merchant Metrics:', {
    store: merchantState.storeName,
    todayEarnings: merchantState.sales.today,
    ordersCount: merchantState.ordersCount,
    rating: merchantState.rating
  });
}

// Show notification
function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('notification', { 
      detail: { message, type, timestamp: new Date() } 
    });
    window.dispatchEvent(event);
  }
}
