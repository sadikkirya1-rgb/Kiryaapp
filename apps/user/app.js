import { APP_CONFIG } from '../../packages/shared/constants.js';

// User App State Management
const userState = {
  userId: 'user_' + Math.random().toString(36).substr(2, 9),
  orders: [],
  favorites: [],
  savedAddresses: [
    { id: 1, name: 'Home', address: 'Al Ain, Abu Dhabi' },
    { id: 2, name: 'Work', address: 'Downtown Al Ain' }
  ],
  cart: [],
  totalOrders: 24,
  rating: 4.8,
  savedItems: 12,
};

// Initialize User App
document.addEventListener('DOMContentLoaded', () => {
  console.log('🛒 User App initialized', userState);
  loadOrderHistory();
  updateUserStats();
  setupEventListeners();
});

// Set up event listeners for action buttons
function setupEventListeners() {
  const browseBtn = document.querySelector('a[href="../../index.html"]');
  const favoritesBtn = browseBtn?.nextElementSibling;
  
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openBrowseFlow();
    });
  }
  
  if (favoritesBtn) {
    favoritesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openFavoritesFlow();
    });
  }
}

// Browse restaurants and create order
function openBrowseFlow() {
  console.log('📍 Opening restaurant browse flow...');
  const order = {
    id: 'order_' + Math.random().toString(36).substr(2, 9),
    restaurant: 'Al Reef Restaurant',
    items: [
      { name: 'Biryani', quantity: 1, price: 35000 },
      { name: 'Naan Bread', quantity: 2, price: 8000 }
    ],
    total: 43000,
    status: 'pending',
    createdAt: new Date().toISOString(),
    deliveryAddress: userState.savedAddresses[0],
    estimatedDelivery: '22 min'
  };
  
  userState.orders.unshift(order);
  userState.cart = order.items;
  console.log('✓ Order created:', order);
  showNotification(`Order from ${order.restaurant} added to cart!`, 'success');
}

// View favorites
function openFavoritesFlow() {
  console.log('❤️ Opening favorites...');
  userState.favorites = [
    { id: 1, name: 'Al Reef Restaurant', rating: 4.8, deliveryTime: '22 min' },
    { id: 2, name: 'Spice Corner', rating: 4.7, deliveryTime: '18 min' },
    { id: 3, name: 'Pizza Palace', rating: 4.6, deliveryTime: '25 min' }
  ];
  console.log('❤️ Favorites loaded:', userState.favorites);
  showNotification(`You have ${userState.favorites.length} favorite restaurants`, 'info');
}

// Load order history from local storage
function loadOrderHistory() {
  const stored = localStorage.getItem('userOrders');
  if (stored) {
    userState.orders = JSON.parse(stored);
    console.log('📋 Order history loaded:', userState.orders.length, 'orders');
  }
}

// Save order history to local storage
function saveOrderHistory() {
  localStorage.setItem('userOrders', JSON.stringify(userState.orders));
}

// Update user stats display
function updateUserStats() {
  console.log('📊 User Stats:', {
    totalOrders: userState.totalOrders,
    rating: userState.rating,
    saved: userState.savedItems
  });
}

// Show notification
function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // In a real app, this would show a toast notification
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('notification', { 
      detail: { message, type, timestamp: new Date() } 
    });
    window.dispatchEvent(event);
  }
}
