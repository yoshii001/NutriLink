import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolByPrincipalId } from '@/services/firebase/schoolService';
import {
  getMealPlansBySchoolId,
  createMealPlan,
  updateMealPlan,
  approveMealPlan,
  deleteMealPlanById,
} from '@/services/firebase/mealPlanService';
import { MealPlan, MealPlanItem } from '@/types';
import { ArrowLeft, Plus, CreditCard as Edit2, Trash2, CircleCheck as CheckCircle, Calendar } from 'lucide-react-native';

export default function MealPlansScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    mealName: '',
    quantity: '',
    ingredients: '',
    dietaryRestrictions: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const schoolData = await getSchoolByPrincipalId(user.uid);

      if (!schoolData) {
        Alert.alert('No School', 'You need to request school addition first.');
        return;
      }

      setSchoolId(schoolData.id);
      const plansData = await getMealPlansBySchoolId(schoolData.id);
      setMealPlans(plansData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMealPlan = () => {
    setEditingPlanId(null);
    setFormData({
      date: '',
      mealName: '',
      quantity: '',
      ingredients: '',
      dietaryRestrictions: '',
    });
    setModalVisible(true);
  };

  const handleEditMealPlan = (planId: string, plan: MealPlan) => {
    setEditingPlanId(planId);
    const firstMeal = plan.menu[0] || {};
    setFormData({
      date: plan.date,
      mealName: firstMeal.mealName || '',
      quantity: firstMeal.quantity?.toString() || '',
      ingredients: firstMeal.ingredients?.join(', ') || '',
      dietaryRestrictions: firstMeal.dietaryRestrictions?.join(', ') || '',
    });
    setModalVisible(true);
  };

  const handleSaveMealPlan = async () => {
    if (
      !formData.date ||
      !formData.mealName ||
      !formData.quantity ||
      !formData.ingredients
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!schoolId || !user || !userData) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    try {
      const mealItem: MealPlanItem = {
        mealName: formData.mealName,
        quantity: parseInt(formData.quantity),
        ingredients: formData.ingredients.split(',').map((i) => i.trim()),
        dietaryRestrictions: formData.dietaryRestrictions
          ? formData.dietaryRestrictions.split(',').map((d) => d.trim())
          : [],
      };

      if (editingPlanId) {
        await updateMealPlan(editingPlanId, {
          menu: [mealItem],
          date: formData.date,
        });
        Alert.alert('Success', 'Meal plan updated successfully');
      } else {
        await createMealPlan({
          principalId: user.uid,
          schoolId,
          date: formData.date,
          status: 'draft',
          menu: [mealItem],
        });
        Alert.alert('Success', 'Meal plan created successfully');
      }

      setModalVisible(false);
      await loadData();
    } catch (error) {
      console.error('Error saving meal plan:', error);
      Alert.alert('Error', 'Failed to save meal plan');
    }
  };

  const handleApproveMealPlan = async (planId: string) => {
    try {
      await approveMealPlan(planId);
      Alert.alert('Success', 'Meal plan approved');
      await loadData();
    } catch (error) {
      console.error('Error approving meal plan:', error);
      Alert.alert('Error', 'Failed to approve meal plan');
    }
  };

  const handleDeleteMealPlan = async (planId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMealPlanById(planId);
              Alert.alert('Success', 'Meal plan deleted');
              await loadData();
            } catch (error) {
              console.error('Error deleting meal plan:', error);
              Alert.alert('Error', 'Failed to delete meal plan');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Plans</Text>
        <TouchableOpacity onPress={handleAddMealPlan} style={styles.addButton}>
          <Plus color="#007AFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(mealPlans).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meal plans created yet</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddMealPlan}>
              <Text style={styles.emptyButtonText}>Create First Meal Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(mealPlans).map(([id, plan]) => (
            <View key={id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planDate}>
                  <Calendar color="#007AFF" size={20} />
                  <Text style={styles.dateText}>{plan.date}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    plan.status === 'approved' ? styles.approvedBadge : styles.draftBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{plan.status}</Text>
                </View>
              </View>

              {plan.menu.map((meal, index) => (
                <View key={index} style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.mealName}</Text>
                  <Text style={styles.mealDetail}>Quantity: {meal.quantity}</Text>
                  <Text style={styles.mealDetail}>
                    Ingredients: {meal.ingredients.join(', ')}
                  </Text>
                  {meal.dietaryRestrictions.length > 0 && (
                    <Text style={styles.mealDetail}>
                      Restrictions: {meal.dietaryRestrictions.join(', ')}
                    </Text>
                  )}
                </View>
              ))}

              <View style={styles.planActions}>
                {plan.status === 'draft' && (
                  <>
                    <TouchableOpacity
                      onPress={() => handleEditMealPlan(id, plan)}
                      style={styles.actionButton}
                    >
                      <Edit2 color="#007AFF" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleApproveMealPlan(id)}
                      style={styles.actionButton}
                    >
                      <CheckCircle color="#34C759" size={20} />
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={() => handleDeleteMealPlan(id)}
                  style={styles.actionButton}
                >
                  <Trash2 color="#FF3B30" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingPlanId ? 'Edit Meal Plan' : 'Create Meal Plan'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.date}
                  onChangeText={(text) => setFormData({ ...formData, date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Meal Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mealName}
                  onChangeText={(text) => setFormData({ ...formData, mealName: text })}
                  placeholder="e.g., Fried Rice"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantity (servings)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="e.g., 50"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ingredients (comma separated)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.ingredients}
                  onChangeText={(text) => setFormData({ ...formData, ingredients: text })}
                  placeholder="e.g., Rice, Eggs, Vegetables"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dietary Restrictions (comma separated)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.dietaryRestrictions}
                  onChangeText={(text) =>
                    setFormData({ ...formData, dietaryRestrictions: text })
                  }
                  placeholder="e.g., Gluten-free, Nut-free"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveMealPlan}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: '#D1F2EB',
  },
  draftBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#333',
  },
  mealInfo: {
    marginBottom: 12,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mealDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginTop: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
