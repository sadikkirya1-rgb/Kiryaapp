import { APP_CONFIG } from '../../packages/shared/constants.js';

const btn = document.getElementById('toggleStatusBtn');
let online = false;

btn.addEventListener('click', () => {
  online = !online;
  btn.textContent = online ? 'Go Offline' : 'Go Online';
  alert(`${APP_CONFIG.appName} rider status: ${online ? 'online' : 'offline'}`);
});

document.getElementById('acceptOrderBtn').addEventListener('click', () => {
  alert('Order accepted and route started.');
});
