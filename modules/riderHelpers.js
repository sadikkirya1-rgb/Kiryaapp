export function getBearing(start, end) {
  const startLat = start.lat * Math.PI / 180;
  const startLng = start.lng * Math.PI / 180;
  const endLat = end.lat * Math.PI / 180;
  const endLng = end.lng * Math.PI / 180;
  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const brng = Math.atan2(y, x);
  return (brng * 180 / Math.PI + 360) % 360;
}

export function interpolatePosition(start, end, factor) {
  return {
    lat: start.lat + (end.lat - start.lat) * factor,
    lng: start.lng + (end.lng - start.lng) * factor,
  };
}
