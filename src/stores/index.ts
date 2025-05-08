
// This file exports all the store APIs
export { useDataStore } from './useDataStore';
export { useCustomerStore } from './useCustomerStore';
export { useProductStore } from './useProductStore';
export { useShipmentStore } from './useShipmentStore';
export type { Customer, Order, OrderProduct } from '../types/customers';
export type { Product } from '../types/products';
export type { Shipment } from '../types/shipments';
export { saveOrderToSupabase, getOrdersFromSupabase } from './orderSync';
