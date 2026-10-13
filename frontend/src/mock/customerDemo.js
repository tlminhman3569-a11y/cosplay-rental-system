export const demoProduct = {
  id: 'demo', name: 'Trang phục Nezuko Kamado', characterName: 'Nezuko Kamado', gender: 'FEMALE', size: 'M',
  description: 'Bộ kimono Nezuko đầy đủ, phù hợp chụp ảnh và đi sự kiện.', pricePerDay: 120000, depositAmount: 500000, quantity: 2,
  category: { name: 'Anime' }, shop: { id: 'shop-demo', name: 'Mochi Cosplay', region: 'TP. Hồ Chí Minh' }, images: [], blockedDates: [],
  accessories: [{ id: 'wig-demo', name: 'Tóc giả Nezuko', type: 'WIG', rentalPricePerDay: 30000, depositAmount: 100000 }],
  similarProducts: [{ id: 'demo-2', name: 'Trang phục Mitsuri Kanroji', pricePerDay: 140000, images: [] }]
};

export const demoCart = {
  items: [{ id: 'cart-demo', product: demoProduct, quantity: 1, startDate: '2026-10-20T00:00:00.000Z', endDate: '2026-10-22T00:00:00.000Z', selectedAccessories: [{ accessoryId: 'wig-demo', quantity: 1 }], totals: { rentalDays: 3, rentalAmount: 450000, depositAmount: 600000 } }],
  totals: { rentalTotal: 450000, depositTotal: 600000, totalAmount: 1050000 }
};

export const demoOrder = {
  id: 'demo-order', status: 'SHIPPING', createdAt: '2026-10-13T09:00:00.000Z', totalAmount: 1050000,
  shop: { name: 'Mochi Cosplay', logoUrl: null }, orderItems: [{ id: 'order-item-demo', productName: demoProduct.name, quantity: 1, startDate: '2026-10-20T00:00:00.000Z', endDate: '2026-10-22T00:00:00.000Z' }],
  statusHistory: []
};
