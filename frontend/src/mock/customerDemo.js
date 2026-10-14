const DEMO_CART_KEY = 'clarity-demo-cart';
const DEMO_ORDER_KEY = 'clarity-demo-order';
const DEMO_COMPLAINT_KEY = 'clarity-demo-complaint';

export const demoProduct = {
  id: 'demo', name: 'Trang phục Nezuko Kamado', characterName: 'Nezuko Kamado', gender: 'FEMALE', size: 'M',
  description: 'Bộ kimono Nezuko đầy đủ, phù hợp chụp ảnh, lễ hội và các buổi gặp gỡ anime.', pricePerDay: 120000, depositAmount: 500000, quantity: 2,
  category: { name: 'Anime' }, series: { name: 'Kimetsu no Yaiba' }, shop: { id: 'shop-demo', name: 'Mochi Cosplay', region: 'TP. Hồ Chí Minh' }, images: [], blockedDates: [],
  accessories: [{ id: 'wig-demo', name: 'Tóc giả Nezuko', type: 'WIG', rentalPricePerDay: 30000, depositAmount: 100000 }],
  similarProducts: [{ id: 'demo-2', name: 'Trang phục Mitsuri Kanroji', series: { name: 'Kimetsu no Yaiba' }, pricePerDay: 140000, images: [] }]
};

export const demoCart = {
  items: [{ id: 'cart-demo', product: demoProduct, quantity: 1, startDate: '2026-10-20T00:00:00.000Z', endDate: '2026-10-22T00:00:00.000Z', selectedAccessories: [{ accessoryId: 'wig-demo', quantity: 1 }], totals: { rentalDays: 2, rentalAmount: 300000, depositAmount: 600000 } }],
  totals: { rentalTotal: 300000, depositTotal: 600000, totalAmount: 900000 }
};

export const demoOrder = {
  id: 'demo-order', status: 'SHIPPING', createdAt: '2026-10-13T09:00:00.000Z', totalAmount: 900000, depositAmount: 600000,
  receiverName: 'Nguyễn Minh Anh', receiverPhone: '090 123 4567', shippingAddress: '12 Nguyễn Huệ, Quận 1', city: 'TP. Hồ Chí Minh', shippingProvider: 'Giao Hàng Nhanh',
  shop: { name: 'Mochi Cosplay', logoUrl: null }, orderItems: [{ id: 'order-item-demo', productName: demoProduct.name, quantity: 1, startDate: '2026-10-20T00:00:00.000Z', endDate: '2026-10-22T00:00:00.000Z' }],
  statusHistory: [{ status: 'PENDING', createdAt: '2026-10-13T09:00:00.000Z', note: 'Đơn đã thanh toán, đang chờ shop xác nhận.' }]
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function recalculate(cart) {
  const totals = cart.items.reduce((result, item) => {
    const days = Math.max(1, Math.round((new Date(item.endDate) - new Date(item.startDate)) / 86400000));
    const accessories = item.selectedAccessories || [];
    const accessoryRental = accessories.reduce((sum, selection) => {
      const accessory = item.product.accessories?.find((entry) => entry.id === selection.accessoryId);
      return sum + (accessory?.rentalPricePerDay || 0) * selection.quantity;
    }, 0);
    const accessoryDeposit = accessories.reduce((sum, selection) => {
      const accessory = item.product.accessories?.find((entry) => entry.id === selection.accessoryId);
      return sum + (accessory?.depositAmount || 0) * selection.quantity;
    }, 0);
    item.totals = { rentalDays: days, rentalAmount: (item.product.pricePerDay + accessoryRental) * days * item.quantity, depositAmount: (item.product.depositAmount + accessoryDeposit) * item.quantity };
    result.rentalTotal += item.totals.rentalAmount;
    result.depositTotal += item.totals.depositAmount;
    return result;
  }, { rentalTotal: 0, depositTotal: 0 });
  cart.totals = { ...totals, totalAmount: totals.rentalTotal + totals.depositTotal };
  return cart;
}

export function getDemoCart() { return recalculate(JSON.parse(localStorage.getItem(DEMO_CART_KEY) || JSON.stringify(clone(demoCart)))); }
export function saveDemoCart(cart) { localStorage.setItem(DEMO_CART_KEY, JSON.stringify(recalculate(cart))); return cart; }
export function addDemoCartItem(payload) {
  const cart = getDemoCart();
  const sameItem = cart.items.find((item) => item.product.id === demoProduct.id && item.startDate.slice(0, 10) === payload.startDate && item.endDate.slice(0, 10) === payload.endDate);
  if (sameItem) sameItem.quantity += payload.quantity;
  else cart.items.push({ id: `cart-demo-${Date.now()}`, product: clone(demoProduct), ...payload, totals: {} });
  return saveDemoCart(cart);
}
export function getDemoOrder() { return JSON.parse(localStorage.getItem(DEMO_ORDER_KEY) || JSON.stringify(clone(demoOrder))); }
export function saveDemoOrder(order) { localStorage.setItem(DEMO_ORDER_KEY, JSON.stringify(order)); return order; }
export function getDemoComplaint() {
  const complaint = localStorage.getItem(DEMO_COMPLAINT_KEY);
  return complaint ? JSON.parse(complaint) : null;
}
export function saveDemoComplaint(complaint) {
  const saved = { ...complaint, submittedAt: new Date().toISOString() };
  localStorage.setItem(DEMO_COMPLAINT_KEY, JSON.stringify(saved));
  return saved;
}
export function updateDemoOrder(status, note) {
  const order = getDemoOrder();
  order.status = status;
  order.statusHistory.unshift({ status, note, createdAt: new Date().toISOString() });
  return saveDemoOrder(order);
}
export function resetCustomerDemo() {
  localStorage.removeItem(DEMO_CART_KEY);
  localStorage.removeItem(DEMO_ORDER_KEY);
  localStorage.removeItem(DEMO_COMPLAINT_KEY);
}
