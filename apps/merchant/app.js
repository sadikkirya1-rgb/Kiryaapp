import { APP_CONFIG } from '../../packages/shared/constants.js';

document.getElementById('menuBtn').addEventListener('click', () => {
  alert(`${APP_CONFIG.appName} merchant menu management opened.`);
});

document.getElementById('ordersBtn').addEventListener('click', () => {
  alert('Merchant orders dashboard opened.');
});
