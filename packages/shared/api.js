import { APP_CONFIG } from './constants.js';

export async function fetchAddressByCoords(lat, lng) {
  // Fetch address with English language preference
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en&language=en`
  );

  if (!response.ok) {
    throw new Error('Unable to fetch address data');
  }

  const data = await response.json();
  
  // Ensure address is in English by building from address components
  if (data.address) {
    const addr_parts = [];
    if(data.address.road) addr_parts.push(data.address.road);
    if(data.address.village) addr_parts.push(data.address.village);
    if(data.address.city) addr_parts.push(data.address.city);
    if(data.address.state) addr_parts.push(data.address.state);
    if(data.address.country) addr_parts.push(data.address.country);
    if(addr_parts.length > 0) {
      data.display_name = addr_parts.join(', ');
    }
  }
  
  return data;
}

export function buildWhatsAppOrderMessage(order) {
  return `*New Order from ${APP_CONFIG.appName}*\n\nRestaurant: ${order.restaurantName}\nItems: ${order.items.join(', ')}`;
}
