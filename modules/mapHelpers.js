export function formatAddressText(value) {
  return value && value !== 'Select a location on the map' ? value : 'Set delivery address';
}

export function getAddressDisplayText(elementId) {
  const el = document.getElementById(elementId);
  return el ? el.textContent.trim() : '';
}

export function updateAddressSummary() {
  const addressText = getAddressDisplayText('selectedAddress');
  const summary = formatAddressText(addressText);
  const selectedAddressText = document.getElementById('selectedAddressText');
  if (selectedAddressText) {
    selectedAddressText.textContent = summary;
  }
  return summary;
}
