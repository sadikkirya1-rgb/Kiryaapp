import { APP_CONFIG } from './constants.js';

export async function fetchAddressByCoords(lat, lng) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
  );

  if (!response.ok) {
    throw new Error('Unable to fetch address data');
  }

  return response.json();
}

export function buildWhatsAppOrderMessage(order) {
  return `*New Order from ${APP_CONFIG.appName}*\n\nRestaurant: ${order.restaurantName}\nItems: ${order.items.join(', ')}`;
}
