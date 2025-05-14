
import { Customer } from './customers';

export interface Shipment {
  id: string;
  name?: string;
  createdAt: Date;
  customers: Customer[];
}

// Re-export Customer to fix the import error in ShipmentPage
export { Customer } from './customers';
