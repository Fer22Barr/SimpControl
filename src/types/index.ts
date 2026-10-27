export type Section = 
  | 'inicio'
  | 'productos'
  | 'ingreso'
  | 'historial'
  | 'balance'
  | 'backup';

export interface Product {
  id: string; // e.g. "PRD-0001"
  name: string;
  costPrice: number; // Unit cost (>= 0)
  sellPrice: number; // Unit sell price (>= 0)
  initialStock: number; // Initial stock registered
  currentStock: number; // Current available stock (>= 0)
  minStock: number; // Alert threshold (>= 0)
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  active: boolean; // false when discontinued
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCostPrice: number; // Historical cost at time of sale
  unitSellPrice: number; // Historical sell price at time of sale
  subtotalCost: number;  // quantity * unitCostPrice
  subtotalSell: number;  // quantity * unitSellPrice
}

export type SaleStatus = 'confirmada' | 'anulada';

export interface Sale {
  id: string; // e.g. "VTA-1718000000000-001"
  timestamp: number;
  dateISO: string;
  dateStr: string; // YYYY-MM-DD
  monthStr: string; // YYYY-MM
  items: SaleItem[];
  totalAmount: number; // Sum of subtotalSell
  totalCost: number;   // Sum of subtotalCost
  grossProfit: number; // totalAmount - totalCost
  status: SaleStatus;
  cancelledAt?: string; // ISO string when cancelled
}

export type MovementType = 
  | 'existencia_inicial'
  | 'venta'
  | 'anulacion_venta'
  | 'ingreso_mercaderia'
  | 'ajuste_manual';

export interface Movement {
  id: string; // e.g. "MOV-1718000000000-001"
  timestamp: number;
  dateISO: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number; // Units involved in movement
  previousStock: number;
  newStock: number;
  reason?: string;
  saleId?: string;
}

export interface BackupData {
  version: string;
  appName: string;
  exportedAt: string;
  products: Product[];
  sales: Sale[];
  movements: Movement[];
}

export interface MonthlyBalance {
  year: number;
  month: number; // 1-12
  monthLabel: string;
  totalIncome: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercentage: number | null; // null if income is 0
  unitsSold: number;
  salesCount: number;
  topProducts: {
    productId: string;
    productName: string;
    units: number;
    revenue: number;
  }[];
}
