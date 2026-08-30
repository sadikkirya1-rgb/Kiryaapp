import { APP_CONFIG } from '../../packages/shared/constants.js';

// Admin App State Management
const adminState = {
  adminId: 'admin_' + Math.random().toString(36).substr(2, 9),
  role: 'super_admin',
  systemStatus: 'healthy', // 'healthy', 'warning', 'critical'
  lastUpdated: new Date(),
  metrics: {
    totalUsers: 24800,
    activeRiders: 1350,
    activeMerchants: 621,
    platformUptime: 99.9,
    dailyRevenue: 94000000,
    monthlyRevenue: 2850000000,
    avgOrderValue: 65000,
    orderCompletionRate: 97.8
  },
  alerts: [
    { id: 1, type: 'warning', message: 'High server load detected', timestamp: new Date(Date.now() - 30000), status: 'open' },
    { id: 2, type: 'info', message: 'New merchant onboarded: Spice Corner', timestamp: new Date(Date.now() - 5 * 60000), status: 'acknowledged' },
    { id: 3, type: 'warning', message: 'Payment gateway latency increased', timestamp: new Date(Date.now() - 15 * 60000), status: 'open' }
  ],
  recentTransactions: [],
  systemLogs: []
};

// Initialize Admin App
document.addEventListener('DOMContentLoaded', () => {
  console.log('🛡️ Admin App initialized', adminState);
  loadSystemStatus();
  loadAlerts();
  setupAdminListeners();
  monitorSystem();
});

// Setup admin event listeners
function setupAdminListeners() {
  const dashboardBtn = document.querySelector('a[href="../../index.html"]');
  const reportsBtn = dashboardBtn?.nextElementSibling;
  
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDashboard();
    });
  }
  
  if (reportsBtn) {
    reportsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateReports();
    });
  }
}

// Open admin dashboard
function openDashboard() {
  console.log('📊 Admin Dashboard:');
  console.log('\n=== PLATFORM METRICS ===');
  console.log('Total Users:', adminState.metrics.totalUsers);
  console.log('Active Riders:', adminState.metrics.activeRiders);
  console.log('Active Merchants:', adminState.metrics.activeMerchants);
  console.log('Platform Uptime:', adminState.metrics.platformUptime + '%');
  console.log('\n=== FINANCIAL METRICS ===');
  console.log('Daily Revenue:', APP_CONFIG.currency, adminState.metrics.dailyRevenue);
  console.log('Monthly Revenue:', APP_CONFIG.currency, adminState.metrics.monthlyRevenue);
  console.log('Average Order Value:', APP_CONFIG.currency, adminState.metrics.avgOrderValue);
  console.log('\n=== OPERATIONAL METRICS ===');
  console.log('Order Completion Rate:', adminState.metrics.orderCompletionRate + '%');
  console.log('System Status:', adminState.systemStatus.toUpperCase());
  console.log('Active Alerts:', adminState.alerts.filter(a => a.status === 'open').length);
  
  showNotification('Dashboard loaded. See console for details.', 'info');
}

// Generate detailed reports
function generateReports() {
  const reports = {
    userSegmentation: {
      newUsers: Math.round(adminState.metrics.totalUsers * 0.15),
      activeUsers: Math.round(adminState.metrics.totalUsers * 0.65),
      inactiveUsers: Math.round(adminState.metrics.totalUsers * 0.20)
    },
    riderPerformance: {
      averageRating: 4.7,
      averageTripsPerDay: 12.3,
      cancellationRate: 2.1,
      onTimeDeliveryRate: 92.4
    },
    merchantPerformance: {
      averageRating: 4.6,
      averageOrdersPerDay: 45.2,
      averageOrderValue: adminState.metrics.avgOrderValue,
      topPerformers: 3
    },
    financialSummary: {
      totalGrossSales: adminState.metrics.monthlyRevenue,
      platformCommission: Math.round(adminState.metrics.monthlyRevenue * 0.15),
      merchantPayouts: Math.round(adminState.metrics.monthlyRevenue * 0.75),
      operatingCosts: Math.round(adminState.metrics.monthlyRevenue * 0.10)
    }
  };
  
  console.log('📈 Detailed Reports Generated:', reports);
  showNotification('Reports generated and exported.', 'success');
}

// Load system status and health checks
function loadSystemStatus() {
  const checks = {
    apiHealth: true,
    databaseConnection: true,
    paymentGateway: true,
    notificationService: true,
    fileStorage: true,
    cachingService: true
  };
  
  const allHealthy = Object.values(checks).every(v => v === true);
  adminState.systemStatus = allHealthy ? 'healthy' : 'warning';
  
  console.log('🔍 System Health Checks:', checks);
  console.log('📊 Overall Status:', adminState.systemStatus);
}

// Load active alerts
function loadAlerts() {
  const openAlerts = adminState.alerts.filter(a => a.status === 'open');
  console.log(`⚠️ Active Alerts: ${openAlerts.length}`);
  
  openAlerts.forEach((alert, idx) => {
    console.log(`${idx + 1}. [${alert.type}] ${alert.message}`);
  });
}

// Acknowledge/resolve alert
function resolveAlert(alertId) {
  const alert = adminState.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = 'resolved';
    console.log(`✓ Alert resolved: ${alert.message}`);
    showNotification('Alert resolved', 'success');
  }
}

// Manage users (suspend/activate)
function manageUser(userId, action) {
  console.log(`👤 User Action: ${action} for user ${userId}`);
  if (action === 'suspend') {
    console.log(`⛔ User ${userId} has been suspended`);
    showNotification(`User suspended`, 'warning');
  } else if (action === 'activate') {
    console.log(`✓ User ${userId} has been activated`);
    showNotification(`User activated`, 'success');
  }
}

// Manage merchants (approve/reject listings)
function manageMerchant(merchantId, action) {
  console.log(`🏪 Merchant Action: ${action} for merchant ${merchantId}`);
  if (action === 'approve') {
    console.log(`✓ Merchant listing approved`);
    showNotification(`Merchant approved`, 'success');
  } else if (action === 'reject') {
    console.log(`✗ Merchant listing rejected`);
    showNotification(`Merchant rejected`, 'warning');
  }
}

// Process payout to merchants
function processPayout(merchantId, amount) {
  console.log(`💳 Processing payout of UGX ${amount} to merchant ${merchantId}`);
  adminState.metrics.merchantPayouts -= amount;
  console.log(`✓ Payout processed. Remaining payouts: UGX ${adminState.metrics.merchantPayouts}`);
  showNotification(`Payout of UGX ${amount} processed`, 'success');
}

// Monitor system continuously
function monitorSystem() {
  setInterval(() => {
    // Simulate metric updates
    adminState.metrics.totalUsers += Math.floor(Math.random() * 10);
    adminState.metrics.activeRiders += Math.floor(Math.random() * 5) - 2;
    adminState.metrics.dailyRevenue += Math.floor(Math.random() * 1000000);
    
    adminState.lastUpdated = new Date();
    console.log('📊 System metrics updated at', adminState.lastUpdated.toLocaleTimeString());
  }, 60000); // Update every minute
}

// Export system logs
function exportLogs() {
  const logData = {
    timestamp: new Date().toISOString(),
    adminId: adminState.adminId,
    metrics: adminState.metrics,
    alerts: adminState.alerts,
    status: adminState.systemStatus
  };
  
  console.log('📋 System Logs Exported:', logData);
  showNotification('Logs exported successfully', 'success');
}

// Update merchant or rider ratings/reviews
function updateRating(entityId, entityType, newRating) {
  console.log(`⭐ Updating ${entityType} ${entityId} rating to ${newRating}/5`);
  showNotification(`${entityType} rating updated`, 'info');
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
