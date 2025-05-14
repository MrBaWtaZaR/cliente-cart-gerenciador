
import { Customer } from './customers';

export interface Shipment {
  id: string;
  name?: string;
  createdAt: Date;
  customers: Customer[];
}

// Re-export Customer to fix the import error in ShipmentPage
// Using 'export type' instead of 'export' for isolatedModules compatibility
export type { Customer } from './customers';
