import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolByPrincipalId } from '@/services/firebase/schoolService';
import { getDonationsBySchoolId } from '@/services/firebase/donationService';
import { Donation } from '@/types';
import { ArrowLeft, DollarSign, Calendar, User } from 'lucide-react-native';

export default function DonorListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [donations, setDonations] = useState<Record<string, Donation>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const schoolData = await getSchoolByPrincipalId(user.uid);

      if (!schoolData) {
        return;
      }

      const donationsData = await getDonationsBySchoolId(schoolData.id);
      setDonations(donationsData);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const groupDonationsByDonor = () => {
    const donorMap: Record<
      string,
      {
        donorName: string;
        donorEmail: string;
        totalAmount: number;
        totalMeals: number;
        donationCount: number;
        donations: Array<{ id: string; donation: Donation }>;
      }
    > = {};

    Object.entries(donations).forEach(([id, donation]) => {
      const donorId = donation.donorId;

      if (!donorMap[donorId]) {
        donorMap[donorId] = {
          donorName: donation.donorName || 'Anonymous',
          donorEmail: donation.donorEmail || '',
          totalAmount: 0,
          totalMeals: 0,
          donationCount: 0,
          donations: [],
        };
      }

      donorMap[donorId].totalAmount += donation.amount;
      donorMap[donorId].totalMeals += donation.mealContribution;
      donorMap[donorId].donationCount += 1;
      donorMap[donorId].donations.push({ id, donation });
    });

    return donorMap;
  };

  const donorStats = groupDonationsByDonor();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#007AFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Donor List</Text>
        </View>
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
        <Text style={styles.headerTitle}>Donor List</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.keys(donorStats).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No donations received yet</Text>
          </View>
        ) : (
          <View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Donation Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Donors:</Text>
                <Text style={styles.summaryValue}>{Object.keys(donorStats).length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Donations:</Text>
                <Text style={styles.summaryValue}>
                  ${Object.values(donorStats).reduce((sum, d) => sum + d.totalAmount, 0)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Meals Funded:</Text>
                <Text style={styles.summaryValue}>
                  {Object.values(donorStats).reduce((sum, d) => sum + d.totalMeals, 0)}
                </Text>
              </View>
            </View>

            {Object.entries(donorStats).map(([donorId, donorData]) => (
              <View key={donorId} style={styles.donorCard}>
                <View style={styles.donorHeader}>
                  <View style={styles.donorIcon}>
                    <User color="#007AFF" size={24} />
                  </View>
                  <View style={styles.donorInfo}>
                    <Text style={styles.donorName}>{donorData.donorName}</Text>
                    {donorData.donorEmail && (
                      <Text style={styles.donorEmail}>{donorData.donorEmail}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.donorStats}>
                  <View style={styles.statItem}>
                    <DollarSign color="#34C759" size={20} />
                    <Text style={styles.statLabel}>Total Donated</Text>
                    <Text style={styles.statValue}>${donorData.totalAmount}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Calendar color="#FF9500" size={20} />
                    <Text style={styles.statLabel}>Donations</Text>
                    <Text style={styles.statValue}>{donorData.donationCount}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <User color="#007AFF" size={20} />
                    <Text style={styles.statLabel}>Meals Funded</Text>
                    <Text style={styles.statValue}>{donorData.totalMeals}</Text>
                  </View>
                </View>

                <View style={styles.donationHistory}>
                  <Text style={styles.historyTitle}>Recent Donations</Text>
                  {donorData.donations.slice(0, 3).map(({ id, donation }) => (
                    <View key={id} style={styles.donationItem}>
                      <View style={styles.donationInfo}>
                        <Text style={styles.donationAmount}>${donation.amount}</Text>
                        <Text style={styles.donationDate}>{donation.date}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          donation.status === 'completed'
                            ? styles.completedBadge
                            : styles.pendingBadge,
                        ]}
                      >
                        <Text style={styles.statusText}>{donation.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
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
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  donorCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  donorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  donorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  donorEmail: {
    fontSize: 14,
    color: '#666',
  },
  donorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  donationHistory: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  donationInfo: {
    flex: 1,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  donationDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#D1F2EB',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#333',
  },
});
