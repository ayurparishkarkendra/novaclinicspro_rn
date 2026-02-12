/**
 * Inventory Item List Item Component
 * Displays a single inventory item in a list with stock status indicators
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../core/theme/colors';
import { spacing } from '../../../../core/theme/spacing';
import { typography } from '../../../../core/theme/typography';
import {
  InventoryItemResponse,
  parseStock,
  formatStock,
  isLowStock,
  isCriticalStock,
  getMedicineTypeLabel,
  getCategoryLabel,
  getDoshaLabels,
  formatCurrency,
} from '../../data/models/inventory.dtos';

interface InventoryItemListItemProps {
  item: InventoryItemResponse;
  onPress: () => void;
}

export const InventoryItemListItem: React.FC<InventoryItemListItemProps> = ({
  item,
  onPress,
}) => {
  const stock = parseStock(item.current_stock);
  const lowStock = isLowStock(item);
  const criticalStock = isCriticalStock(item);
  const doshaLabels = getDoshaLabels(item.dosha_properties);

  const getStockColor = () => {
    if (criticalStock) return colors.error.main;
    if (lowStock) return colors.warning.main;
    return colors.success.main;
  };

  const getStockLabel = () => {
    if (criticalStock) return 'Critical';
    if (lowStock) return 'Low';
    return 'In Stock';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Left: Icon */}
      <View style={[styles.iconContainer, { backgroundColor: getStockColor() + '15' }]}>
        <Ionicons
          name={item.category === 'medicine' ? 'medical' : 'cube'}
          size={24}
          color={getStockColor()}
        />
      </View>

      {/* Middle: Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        
        {/* Category/Type Tags */}
        <View style={styles.tagsRow}>
          {item.category && (
            <View style={[styles.tag, { backgroundColor: colors.primary.main + '15' }]}>
              <Text style={[styles.tagText, { color: colors.primary.main }]}>
                {getCategoryLabel(item.category)}
              </Text>
            </View>
          )}
          {item.medicine_type && (
            <View style={[styles.tag, { backgroundColor: colors.secondary.main + '15' }]}>
              <Text style={[styles.tagText, { color: colors.secondary.main }]}>
                {getMedicineTypeLabel(item.medicine_type)}
              </Text>
            </View>
          )}
        </View>

        {/* Dosha badges (subtle) */}
        {doshaLabels.length > 0 && (
          <View style={styles.doshaRow}>
            {doshaLabels.map((dosha) => (
              <View key={dosha} style={styles.doshaBadge}>
                <Text style={styles.doshaText}>{dosha}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stock info */}
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>
            Stock: <Text style={[styles.stockValue, { color: getStockColor() }]}>
              {formatStock(item.current_stock, item.unit)}
            </Text>
          </Text>
          {item.reorder_point > 0 && (
            <Text style={styles.reorderLabel}>
              (Reorder at {item.reorder_point})
            </Text>
          )}
        </View>
      </View>

      {/* Right: Status & Price */}
      <View style={styles.rightContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStockColor() + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStockColor() }]} />
          <Text style={[styles.statusText, { color: getStockColor() }]}>
            {getStockLabel()}
          </Text>
        </View>
        {item.mrp !== null && (
          <Text style={styles.price}>{formatCurrency(item.mrp)}</Text>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    ...typography.caption,
    fontWeight: '500',
    fontSize: 10,
  },
  doshaRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  doshaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: colors.grey[100],
  },
  doshaText: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.secondary,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  stockValue: {
    fontWeight: '600',
  },
  reorderLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  price: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
