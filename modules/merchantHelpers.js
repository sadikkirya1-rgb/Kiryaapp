export function computeMerchantSummary(orderCount, revenue) {
  return {
    orderCount,
    revenue,
    averageTicket: orderCount ? revenue / orderCount : 0,
  };
}
