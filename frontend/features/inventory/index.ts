/**
 * Inventory Feature Module
 * Exports all inventory-related functionality
 */

// Data layer - DTOs
export * from './data/models/inventory.dtos';

// Data layer - API
export * from './data/datasources/inventory.api';

// Data layer - Repository hooks
export * from './data/repositories/inventory.repository.impl';

// Presentation - Pages
export { InventoryListScreen } from './presentation/pages/InventoryListScreen';
export { InventoryItemDetailScreen } from './presentation/pages/InventoryItemDetailScreen';
export { InventoryStockAdjustScreen } from './presentation/pages/InventoryStockAdjustScreen';
export { InventoryAlertsScreen } from './presentation/pages/InventoryAlertsScreen';
export { InventoryBatchesScreen } from './presentation/pages/InventoryBatchesScreen';

// Presentation - Components
export { InventoryItemListItem } from './presentation/components/InventoryItemListItem';
export { InventoryItemForm } from './presentation/components/InventoryItemForm';
export { InventoryAlertListItem } from './presentation/components/InventoryAlertListItem';
export { StockAdjustmentForm } from './presentation/components/StockAdjustmentForm';
export { MovementListItem } from './presentation/components/MovementListItem';
export { BatchListItem } from './presentation/components/BatchListItem';
export { BatchForm } from './presentation/components/BatchForm';
