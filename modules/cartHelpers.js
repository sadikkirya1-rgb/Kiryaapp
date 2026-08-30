export function formatCurrency(value) {
  return `UGX ${Number(value || 0).toFixed(2)}`;
}

export function computeCartSummary(cart) {
  const summary = {
    itemCount: 0,
    subtotal: 0,
    total: 0,
  };

  cart.forEach((item) => {
    let itemPrice = Number(item.basePrice || 0);
    if (Array.isArray(item.addons)) {
      item.addons.forEach((addon) => {
        itemPrice += Number(addon.price || 0);
      });
    }
    const lineTotal = itemPrice * Number(item.quantity || 1);
    summary.itemCount += Number(item.quantity || 1);
    summary.subtotal += lineTotal;
  });

  summary.total = summary.subtotal;
  return summary;
}
