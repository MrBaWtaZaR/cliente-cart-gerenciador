
import { Customer } from './customers';

export interface Shipment {
  id: string;
  name?: string;
  createdAt: Date;
  customers: Customer[];
}
