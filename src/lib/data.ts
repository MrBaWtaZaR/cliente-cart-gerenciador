
// This is a barrel file to maintain backward compatibility with existing imports
// Re-export everything from the separate store files
export { useDataStore } from '@/stores';
export type { Customer, Order, OrderProduct } from '@/types/customers';
export type { Product } from '@/types/products';
export type { Shipment } from '@/types/shipments';
