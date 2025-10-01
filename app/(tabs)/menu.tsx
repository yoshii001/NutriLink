import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getAllMealPlans } from '@/services/firebase/mealPlanService';
import { MealPlan } from '@/types';
import { Calendar, Utensils } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function MenuScreen() {
  const { userData } = useAuth();
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [refreshing, setRefreshing] = useState(false);

  if (!userData || userData.role !== 'principal') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  const loadMealPlans = async () => {
    try {
      const data = await getAllMealPlans();
      setMealPlans(data);
    } catch (error) {
      console.error('Error loading meal plans:', error);
    }
  };

  useEffect(() => {
    loadMealPlans();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMealPlans();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Meal Planning</Text>

        {Object.entries(mealPlans)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, plan]) => (
            <View key={date} style={styles.card}>
              <View style={styles.cardHeader}>
                <Calendar color="#007AFF" size={20} />
                <Text style={styles.dateText}>{date}</Text>
              </View>

              {plan.menu.map((meal, index) => (
                <View key={index} style={styles.mealItem}>
                  <View style={styles.mealHeader}>
                    <Utensils color="#4CAF50" size={18} />
                    <Text style={styles.mealName}>{meal.mealName}</Text>
                  </View>

                  <View style={styles.mealDetail}>
                    <Text style={styles.detailLabel}>Quantity:</Text>
                    <Text style={styles.detailValue}>{meal.quantity} servings</Text>
                  </View>

                  <View style={styles.mealDetail}>
                    <Text style={styles.detailLabel}>Ingredients:</Text>
                    <Text style={styles.detailValue}>{meal.ingredients.join(', ')}</Text>
                  </View>

                  <View style={styles.mealDetail}>
                    <Text style={styles.detailLabel}>Dietary:</Text>
                    <View style={styles.badges}>
                      {meal.dietaryRestrictions.map((diet, i) => (
                        <View key={i} style={styles.badge}>
                          <Text style={styles.badgeText}>{diet}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

        {Object.keys(mealPlans).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meal plans found</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  mealItem: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mealName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  mealDetail: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1976D2',
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