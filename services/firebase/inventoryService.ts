import { ref, get, set, update, remove } from 'firebase/database';
import { database } from '@/config/firebase';
import { InventoryItem } from '@/types';

export const getAllInventory = async (): Promise<Record<string, InventoryItem>> => {
  const inventoryRef = ref(database, 'inventory');
  const snapshot = await get(inventoryRef);

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val() as Record<string, InventoryItem>;
};

export const getInventoryItem = async (itemId: string): Promise<InventoryItem | null> => {
  const itemRef = ref(database, `inventory/${itemId}`);
  const snapshot = await get(itemRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as InventoryItem;
};

export const addInventoryItem = async (itemId: string, item: InventoryItem): Promise<void> => {
  const itemRef = ref(database, `inventory/${itemId}`);
  await set(itemRef, item);
};

export const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>): Promise<void> => {
  const itemRef = ref(database, `inventory/${itemId}`);
  await update(itemRef, updates);
};

export const deleteInventoryItem = async (itemId: string): Promise<void> => {
  const itemRef = ref(database, `inventory/${itemId}`);
  await remove(itemRef);
};