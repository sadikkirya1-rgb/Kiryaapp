import { APP_CONFIG } from '../../packages/shared/constants.js';

document.getElementById('browseBtn').addEventListener('click', () => {
  alert(`Welcome to ${APP_CONFIG.appName} user experience.`);
});

document.getElementById('checkoutBtn').addEventListener('click', () => {
  alert('Checkout flow opened.');
});
