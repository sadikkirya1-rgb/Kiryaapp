import { APP_CONFIG } from '../../packages/shared/constants.js';

document.getElementById('dashboardBtn').addEventListener('click', () => {
  alert(`${APP_CONFIG.appName} admin dashboard opened.`);
});

document.getElementById('accountsBtn').addEventListener('click', () => {
  alert('Admin account management opened.');
});
