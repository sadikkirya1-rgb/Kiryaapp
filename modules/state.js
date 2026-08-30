export const appState = {
  map: null,
  marker: null,
  cart: [],
  suggestedScrollInterval: null,
  favorites: new Set(),
  isCheckoutAccordionOpen: false,
  allergyNotes: '',
  recipientDetails: { name: '', phone: '' },
  userPhoneNumber: '',
  selectedPaymentMethod: { value: 'cod', icon: '💵', text: 'Cash on Delivery' },
  tipPercentage: 0,
  riderMarker: null,
  riderRoutePolyline: null,
  riderProgressPolyline: null,
  routeAnimationFrame: null,
  dailySalesChartInstance: null,
  topItemsChartInstance: null,
};

export const ui = {
  get: (id) => document.getElementById(id),
  show: (id) => {
    const el = ui.get(id);
    if (el) el.style.display = 'block';
  },
  hide: (id) => {
    const el = ui.get(id);
    if (el) el.style.display = 'none';
  },
};
