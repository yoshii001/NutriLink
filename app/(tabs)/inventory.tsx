import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllInventory } from '@/services/firebase/inventoryService';
import { InventoryItem } from '@/types';
import { Package, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function InventoryScreen() {
  const { userData } = useAuth();
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [refreshing, setRefreshing] = useState(false);

  if (!userData || (userData.role !== 'admin' && userData.role !== 'principal')) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  const loadInventory = async () => {
    try {
      const data = await getAllInventory();
      setInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  const isLowStock = (quantity: number) => quantity < 200;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Inventory Management</Text>

        <View style={styles.grid}>
          {Object.entries(inventory).map(([id, item]) => (
            <View key={id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Package color="#007AFF" size={24} />
                {isLowStock(item.quantity) && <AlertCircle color="#F44336" size={20} />}
              </View>

              <Text style={styles.itemName}>{item.name}</Text>

              <View style={styles.quantityRow}>
                <Text
                  style={[
                    styles.quantity,
                    isLowStock(item.quantity) && { color: '#F44336' },
                  ]}
                >
                  {item.quantity}
                </Text>
                <Text style={styles.unit}>{item.unit}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Supplier</Text>
                <Text style={styles.infoValue}>{item.supplier}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Restocked</Text>
                <Text style={styles.infoValue}>
                  {new Date(item.lastRestocked).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Next Order</Text>
                <Text style={styles.infoValue}>
                  {new Date(item.nextOrderDate).toLocaleDateString()}
                </Text>
              </View>

              {isLowStock(item.quantity) && (
                <View style={styles.lowStockBanner}>
                  <Text style={styles.lowStockText}>Low Stock</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {Object.keys(inventory).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No inventory items found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginBottom: 16,
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 16,
  },
  quantity: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  unit: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  lowStockBanner: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  lowStockText: {
    color: '#F44336',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F44336',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
});