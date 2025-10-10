import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getAllDonations } from '@/services/firebase/donationService';
import { Donation } from '@/types';
import { DollarSign, Heart } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function DonationsScreen() {
  const { userData } = useAuth();
  const [donations, setDonations] = useState<Record<string, Donation>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadDonations = async () => {
    try {
      const data = await getAllDonations();
      setDonations(data);
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  };

  // Keep hooks and effects at top-level to preserve hook order. The effect
  // will only fetch data when the user is present and authorized.
  useEffect(() => {
    if (!userData) return;
    if (userData.role !== 'donor' && userData.role !== 'admin') return;
    loadDonations();
    // We intentionally don't include loadDonations in deps to avoid re-creating
    // the function; userData changes will re-run this effect when auth state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  };

  const totalDonations = Object.values(donations).reduce((sum, d) => sum + d.amount, 0);
  const totalMeals = Object.values(donations).reduce((sum, d) => sum + d.mealContribution, 0);

  if (!userData || (userData.role !== 'donor' && userData.role !== 'admin')) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Donations</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <DollarSign color="#4CAF50" size={32} />
            <Text style={styles.summaryValue}>${totalDonations}</Text>
            <Text style={styles.summaryLabel}>Total Donations</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Heart color="#F44336" size={32} />
            <Text style={styles.summaryValue}>{totalMeals}</Text>
            <Text style={styles.summaryLabel}>Meals Funded</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Donations</Text>

        {Object.entries(donations)
          .sort(([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(([id, donation]) => (
            <View key={id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        donation.status === 'completed' ? '#E8F5E9' : '#FFF3E0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: donation.status === 'completed' ? '#4CAF50' : '#F57C00',
                      },
                    ]}
                  >
                    {donation.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(donation.date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amount}>${donation.amount}</Text>
                <Text style={styles.meals}>{donation.mealContribution} meals</Text>
              </View>

              {donation.donorMessage && (
                <View style={styles.messageBox}>
                  <Text style={styles.messageLabel}>Message:</Text>
                  <Text style={styles.messageText}>{donation.donorMessage}</Text>
                </View>
              )}
            </View>
          ))}

        {Object.keys(donations).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No donations found</Text>
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
  },
  meals: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
  messageBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
    fontStyle: 'italic',
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