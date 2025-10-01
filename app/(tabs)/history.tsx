import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getAllMealTracking } from '@/services/firebase/mealTrackingService';
import { MealTracking } from '@/types';
import { Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoryScreen() {
  const { userData } = useAuth();
  const [mealHistory, setMealHistory] = useState<Record<string, MealTracking>>({});
  const [refreshing, setRefreshing] = useState(false);

  if (!userData || userData.role !== 'teacher') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  const loadHistory = async () => {
    try {
      const data = await getAllMealTracking();
      setMealHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Meal Tracking History</Text>

        {Object.entries(mealHistory)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
          .map(([date, tracking]) => {
            const studentsList = Object.values(tracking.students || {});
            const servedCount = studentsList.filter((s) => s.mealServed).length;

            return (
              <View key={date} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Calendar color="#007AFF" size={20} />
                  <Text style={styles.dateText}>{date}</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{studentsList.length}</Text>
                    <Text style={styles.statLabel}>Total Students</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>{servedCount}</Text>
                    <Text style={styles.statLabel}>Meals Served</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: '#F44336' }]}>
                      {studentsList.length - servedCount}
                    </Text>
                    <Text style={styles.statLabel}>Not Served</Text>
                  </View>
                </View>

                <View style={styles.studentsList}>
                  {studentsList.map((student, index) => (
                    <View key={index} style={styles.studentRow}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: student.mealServed ? '#E8F5E9' : '#FFEBEE' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: student.mealServed ? '#4CAF50' : '#F44336' },
                          ]}
                        >
                          {student.mealServed ? 'Served' : 'Not Served'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

        {Object.keys(mealHistory).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meal tracking history found</Text>
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
  },
  dateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
  },
  studentsList: {
    gap: 8,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  studentName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
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