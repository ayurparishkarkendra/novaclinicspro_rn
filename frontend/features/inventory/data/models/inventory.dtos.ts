/**
 * Inventory DTOs
 * Data Transfer Objects matching OpenAPI schemas for inventory management
 */

// ============================================
// ENUMS & TYPES
// ============================================

/** Inventory movement type */
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';

/** Alert type */
export type AlertType = 'LOW_STOCK' | 'EXPIRY_WARNING' | 'EXPIRED' | 'OVER_STOCK';

/** Alert severity */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Medicine type for Ayurveda */
export type MedicineType = 'kwatha' | 'vati' | 'taila' | 'lehyam' | 'churnam' | 'asava' | 'arishta' | 'guggulu' | 'bhasma' | 'other';

/** Inventory category */
export type InventoryCategory = 'medicine' | 'equipment' | 'consumable' | 'supplement' | 'cosmetic' | 'other';

/** Dosha properties */
export interface DoshaProperties {
  vata?: boolean;
  pitta?: boolean;
  kapha?: boolean;
}

// ============================================
// REQUEST DTOs
// ============================================

/** Inventory location object structure */
export interface InventoryLocation {
  shelf?: string | null;
  rack?: string | null;
  bin?: string | null;
  zone?: string | null;
  notes?: string | null;
}

/** Create inventory item request */
export interface InventoryCreateRequest {
  name: string;
  brand?: string | null;
  medicine_type?: MedicineType | null;
  category?: InventoryCategory | null;
  unit?: string | null;
  current_stock?: number | null;
  reorder_point?: number;
  max_stock?: number | null;
  price?: number | null;
  mrp?: number | null;
  buy_price?: number | null;
  gst_percentage?: number | null;
  barcode?: string | null;
  sku?: string | null;
  location?: InventoryLocation | null;  // Changed from string to InventoryLocation
  supplier_id?: string | null;
  dosha_properties?: DoshaProperties | null;
  hsn_code?: string | null;
  manufacturer?: string | null;
  strength?: string | null;
  composition?: string | null;
  batch_tracking_enabled?: boolean;
  requires_prescription?: boolean;
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  metadata?: Record<string, any> | null;
}

/** Update inventory item request */
export interface InventoryUpdateRequest {
  name?: string | null;
  brand?: string | null;
  medicine_type?: MedicineType | null;
  category?: InventoryCategory | null;
  unit?: string | null;
  current_stock?: number | null;
  reorder_point?: number | null;
  max_stock?: number | null;
  price?: number | null;
  mrp?: number | null;
  buy_price?: number | null;
  gst_percentage?: number | null;
  barcode?: string | null;
  sku?: string | null;
  location?: InventoryLocation | null;  // Changed from string to InventoryLocation
  supplier_id?: string | null;
  dosha_properties?: DoshaProperties | null;
  hsn_code?: string | null;
  manufacturer?: string | null;
  strength?: string | null;
  composition?: string | null;
  batch_tracking_enabled?: boolean | null;
  requires_prescription?: boolean | null;
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  metadata?: Record<string, any> | null;
  is_active?: boolean | null;
}

/** Stock adjustment request */
export interface StockAdjustmentRequest {
  quantity: number;
  unit_cost?: number | null;
  gst_rate?: number | null;
  notes?: string | null;
}

/** Batch create request */
export interface BatchCreateRequest {
  batch_number: string;
  quantity: number;
  unit_cost?: number | null;
  gst_rate?: number | null;
  mrp?: number | null;
  expiry_date?: string | null;
  manufacture_date?: string | null;
  supplier_id?: string | null;
  purchase_date?: string | null;
}

/** Batch update request */
export interface BatchUpdateRequest {
  expiry_date?: string | null;
  manufacture_date?: string | null;
  is_active?: boolean | null;
}

/** Alert acknowledge request */
export interface AlertAcknowledgeRequest {
  alert_ids: string[];
}

// ============================================
// QUERY PARAMS
// ============================================

/** List inventory params */
export interface ListInventoryParams {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
  category?: InventoryCategory;
}

/** List movements params */
export interface ListMovementsParams {
  skip?: number;
  limit?: number;
  movement_type?: MovementType;
}

/** List batches params */
export interface ListBatchesParams {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}

/** List alerts params */
export interface ListAlertsParams {
  skip?: number;
  limit?: number;
  is_acknowledged?: boolean;
  alert_type?: AlertType;
}

// ============================================
// RESPONSE DTOs
// ============================================

/** Inventory item response */
export interface InventoryItemResponse {
  id: string;
  tenant_id: string;
  name: string;
  brand: string | null;
  medicine_type: MedicineType | null;
  category: InventoryCategory | null;
  unit: string | null;
  current_stock: string; // decimal as string
  reorder_point: number;
  max_stock: number | null;
  price: number | null;
  mrp: number | null;
  buy_price: number | null;
  gst_percentage: number | null;
  barcode: string | null;
  sku: string | null;
  location: string | null;
  supplier_id: string | null;
  dosha_properties: DoshaProperties | null;
  hsn_code: string | null;
  manufacturer: string | null;
  strength: string | null;
  composition: string | null;
  batch_tracking_enabled: boolean;
  requires_prescription: boolean;
  min_stock_level: number | null;
  max_stock_level: number | null;
  metadata_: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/** Movement response */
export interface MovementResponse {
  id: string;
  tenant_id: string;
  inventory_item_id: string;
  batch_id: string | null;
  movement_type: MovementType;
  source_type: string | null;
  source_id: string | null;
  quantity: string; // decimal as string
  unit_cost: number | null;
  gst_rate: number | null;
  total_value: number | null;
  stock_before: number | null;
  stock_after: number | null;
  notes: string | null;
  movement_date: string;
  created_by: string | null;
  created_at: string;
}

/** Batch response */
export interface BatchResponse {
  id: string;
  tenant_id: string;
  inventory_item_id: string;
  batch_number: string;
  expiry_date: string | null;
  manufacture_date: string | null;
  quantity_available: string; // decimal as string
  unit_cost: number | null;
  gst_rate: number | null;
  mrp: number | null;
  supplier_id: string | null;
  purchase_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/** Alert response */
export interface AlertResponse {
  id: string;
  tenant_id: string;
  inventory_item_id: string | null;
  batch_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  alert_data: Record<string, any> | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

/** Paginated inventory list response */
export interface InventoryListResponse {
  items: InventoryItemResponse[];
  total: number;
  skip: number;
  limit: number;
}

/** Paginated movements list response */
export interface MovementsListResponse {
  items: MovementResponse[];
  total: number;
  skip: number;
  limit: number;
}

/** Paginated batches list response */
export interface BatchesListResponse {
  items: BatchResponse[];
  total: number;
  skip: number;
  limit: number;
}

/** Paginated alerts list response */
export interface AlertsListResponse {
  items: AlertResponse[];
  total: number;
  skip: number;
  limit: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Get medicine type display label */
export const getMedicineTypeLabel = (type: MedicineType | null): string => {
  if (!type) return '';
  const labels: Record<MedicineType, string> = {
    kwatha: 'Kwatha (Decoction)',
    vati: 'Vati (Tablet)',
    taila: 'Taila (Oil)',
    lehyam: 'Lehyam (Paste)',
    churnam: 'Churnam (Powder)',
    asava: 'Asava',
    arishta: 'Arishta',
    guggulu: 'Guggulu',
    bhasma: 'Bhasma',
    other: 'Other',
  };
  return labels[type] || type;
};

/** Get category display label */
export const getCategoryLabel = (category: InventoryCategory | null): string => {
  if (!category) return '';
  const labels: Record<InventoryCategory, string> = {
    medicine: 'Medicine',
    equipment: 'Equipment',
    consumable: 'Consumable',
    supplement: 'Supplement',
    cosmetic: 'Cosmetic',
    other: 'Other',
  };
  return labels[category] || category;
};

/** Get alert type display label */
export const getAlertTypeLabel = (type: AlertType): string => {
  const labels: Record<AlertType, string> = {
    LOW_STOCK: 'Low Stock',
    EXPIRY_WARNING: 'Expiring Soon',
    EXPIRED: 'Expired',
    OVER_STOCK: 'Over Stock',
  };
  return labels[type] || type;
};

/** Get severity color */
export const getSeverityColor = (severity: AlertSeverity): string => {
  const colors: Record<AlertSeverity, string> = {
    LOW: '#3B82F6',      // Blue
    MEDIUM: '#F59E0B',   // Amber
    HIGH: '#F97316',     // Orange
    CRITICAL: '#EF4444', // Red
  };
  return colors[severity] || '#6B7280';
};

/** Get movement type display label */
export const getMovementTypeLabel = (type: MovementType): string => {
  const labels: Record<MovementType, string> = {
    IN: 'Stock In',
    OUT: 'Stock Out',
    ADJUSTMENT: 'Adjustment',
    TRANSFER: 'Transfer',
    RETURN: 'Return',
  };
  return labels[type] || type;
};

/** Get movement type color */
export const getMovementTypeColor = (type: MovementType): string => {
  const colors: Record<MovementType, string> = {
    IN: '#10B981',        // Green
    OUT: '#EF4444',       // Red
    ADJUSTMENT: '#F59E0B', // Amber
    TRANSFER: '#3B82F6',  // Blue
    RETURN: '#8B5CF6',    // Purple
  };
  return colors[type] || '#6B7280';
};

/** Parse stock value (handles string decimal) */
export const parseStock = (stock: string | number | null): number => {
  if (stock === null || stock === undefined) return 0;
  if (typeof stock === 'number') return stock;
  const parsed = parseFloat(stock);
  return isNaN(parsed) ? 0 : parsed;
};

/** Format stock for display */
export const formatStock = (stock: string | number | null, unit?: string | null): string => {
  const value = parseStock(stock);
  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return unit ? `${formattedValue} ${unit}` : formattedValue;
};

/** Check if item is low stock */
export const isLowStock = (item: InventoryItemResponse): boolean => {
  const stock = parseStock(item.current_stock);
  return stock <= item.reorder_point;
};

/** Check if item is critical stock */
export const isCriticalStock = (item: InventoryItemResponse): boolean => {
  const stock = parseStock(item.current_stock);
  return stock <= item.reorder_point * 0.5;
};

/** Format currency */
export const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Format date for display */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/** Format date and time for display */
export const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/** Check if batch is expiring soon (within 30 days) */
export const isExpiringSoon = (expiryDate: string | null): boolean => {
  if (!expiryDate) return false;
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  } catch {
    return false;
  }
};

/** Check if batch is expired */
export const isExpired = (expiryDate: string | null): boolean => {
  if (!expiryDate) return false;
  try {
    const expiry = new Date(expiryDate);
    return expiry < new Date();
  } catch {
    return false;
  }
};

/** Get dosha labels */
export const getDoshaLabels = (dosha: DoshaProperties | null): string[] => {
  if (!dosha) return [];
  const labels: string[] = [];
  if (dosha.vata) labels.push('Vata');
  if (dosha.pitta) labels.push('Pitta');
  if (dosha.kapha) labels.push('Kapha');
  return labels;
};
