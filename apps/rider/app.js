import { APP_CONFIG } from '../../packages/shared/constants.js';

// Rider App State Management
const riderState = {
  riderId: 'rider_' + Math.random().toString(36).substr(2, 9),
  status: 'offline', // 'online', 'offline', 'delivering'
  location: { lat: 24.2155, lng: 55.7671 }, // Al Ain coordinates
  activeOrder: null,
  completedTrips: 1300,
  earnings: {
    today: 180000,
    week: 1250000,
    month: 5200000
  },
  rating: 4.9,
  vehicleType: 'bike',
  availableOrders: []
};

// Initialize Rider App
document.addEventListener('DOMContentLoaded', () => {
  console.log('🏍️ Rider App initialized', riderState);
  loadAvailableOrders();
  updateRiderMetrics();
  setupRiderListeners();
  startLocationTracking();
});

// Setup rider event listeners
function setupRiderListeners() {
  const goOnlineBtn = document.querySelector('a[href="../../index.html"]');
  const historyBtn = goOnlineBtn?.nextElementSibling;
  
  if (goOnlineBtn) {
    goOnlineBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleRiderStatus();
    });
  }
  
  if (historyBtn) {
    historyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      viewTripHistory();
    });
  }
}

// Toggle online/offline status
function toggleRiderStatus() {
  riderState.status = riderState.status === 'online' ? 'offline' : 'online';
  console.log(`🔴 Rider status: ${riderState.status}`);
  
  if (riderState.status === 'online') {
    console.log('✓ You are now online and accepting orders');
    startAcceptingOrders();
  } else {
    console.log('⭕ You are now offline');
    stopAcceptingOrders();
  }
  
  showNotification(
    `You are now ${riderState.status === 'online' ? 'online' : 'offline'}`,
    'info'
  );
}

// Load available orders for this rider
function loadAvailableOrders() {
  riderState.availableOrders = [
    {
      id: 'order_001',
      restaurant: 'Al Reef Restaurant',
      customer: 'Ahmed',
      pickupAddress: 'Downtown Al Ain',
      deliveryAddress: 'Al Khaleej Street',
      distance: 2.3,
      estimatedPay: 35000,
      items: ['Biryani x1', 'Naan x2'],
      status: 'pending_pickup'
    },
    {
      id: 'order_002',
      restaurant: 'Spice Corner',
      customer: 'Fatima',
      pickupAddress: 'Al Khaleej Mall',
      deliveryAddress: 'Al Zahra District',
      distance: 3.1,
      estimatedPay: 45000,
      items: ['Curry x1', 'Rice x1'],
      status: 'pending_pickup'
    },
    {
      id: 'order_003',
      restaurant: 'Pizza Palace',
      customer: 'Mohammed',
      pickupAddress: 'Jaber Al Ali Street',
      deliveryAddress: 'Al Reef',
      distance: 1.8,
      estimatedPay: 28000,
      items: ['Pizza x2'],
      status: 'pending_pickup'
    }
  ];
  
  console.log(`📦 ${riderState.availableOrders.length} orders available`);
}

// Start accepting orders when rider goes online
function startAcceptingOrders() {
  if (riderState.availableOrders.length > 0) {
    const nextOrder = riderState.availableOrders[0];
    console.log('🎯 New order available:', nextOrder);
    showNotification(
      `New order from ${nextOrder.restaurant} - UGX ${nextOrder.estimatedPay}`,
      'success'
    );
  }
}

// Stop accepting orders when rider goes offline
function stopAcceptingOrders() {
  riderState.activeOrder = null;
  console.log('⏸️ No longer accepting orders');
}

// Accept an order and start delivery
function acceptOrder(orderId) {
  const order = riderState.availableOrders.find(o => o.id === orderId);
  if (order) {
    riderState.activeOrder = order;
    riderState.status = 'delivering';
    console.log('✓ Order accepted:', order);
    
    // Simulate delivery
    startDeliverySimulation(order);
  }
}

// Simulate delivery route and location updates
function startDeliverySimulation(order) {
  console.log(`🚴 Starting delivery to ${order.deliveryAddress}`);
  let progress = 0;
  
  const interval = setInterval(() => {
    progress += 10;
    const lat = riderState.location.lat + (progress / 1000) * 0.01;
    const lng = riderState.location.lng + (progress / 1000) * 0.02;
    
    console.log(`📍 Delivery progress: ${progress}% at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    
    if (progress >= 100) {
      clearInterval(interval);
      completeDelivery(order);
    }
  }, 3000); // Update every 3 seconds
}

// Mark delivery as complete
function completeDelivery(order) {
  riderState.earnings.today += order.estimatedPay;
  riderState.completedTrips += 1;
  riderState.activeOrder = null;
  riderState.status = 'online';
  
  console.log('✅ Delivery completed!');
  console.log('💰 Earned:', order.estimatedPay, APP_CONFIG.currency);
  showNotification(`Delivery completed! Earned UGX ${order.estimatedPay}`, 'success');
}

// View trip history
function viewTripHistory() {
  console.log('📋 Trip History:');
  console.log('Total Trips:', riderState.completedTrips);
  console.log('Today Earnings:', riderState.earnings.today, APP_CONFIG.currency);
  console.log('This Week:', riderState.earnings.week, APP_CONFIG.currency);
  console.log('Rating:', riderState.rating, '/ 5');
  showNotification('Trip history loaded. Check console for details.', 'info');
}

// Start location tracking
function startLocationTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        riderState.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('📍 Location acquired:', riderState.location);
      },
      (error) => {
        console.log('📍 Using default location (Al Ain):', riderState.location);
      }
    );
  }
}

// Update rider metrics display
function updateRiderMetrics() {
  console.log('📊 Rider Metrics:', {
    trips: riderState.completedTrips,
    earnings: riderState.earnings.today,
    rating: riderState.rating
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
