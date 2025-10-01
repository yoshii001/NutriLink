import React, { useEffect, useState } from 'react';
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
import { getAllDonations } from '@/services/firebase/donationService';
import { getAllDonationRequests } from '@/services/firebase/donationRequestService';
import { getAllSchools } from '@/services/firebase/schoolService';
import { getAllUsers } from '@/services/firebase/adminService';
import { Donation, DonationRequest, School, User } from '@/types';
import { ChevronLeft, DollarSign, TrendingUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Calendar } from 'lucide-react-native';

export default function AdminDonationsScreen() {
  const router = useRouter();
  const { userData } = useAuth();
  const [donations, setDonations] = useState<Record<string, Donation>>({});
  const [requests, setRequests] = useState<Record<string, DonationRequest>>({});
  const [schools, setSchools] = useState<Record<string, School>>({});
  const [users, setUsers] = useState<Record<string, User & { uid: string }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'donations' | 'requests'>('donations');

  const loadData = async () => {
    try {
      const [donationsData, requestsData, schoolsData, usersData] = await Promise.all([
        getAllDonations(),
        getAllDonationRequests(),
        getAllSchools(),
        getAllUsers(),
      ]);
      setDonations(donationsData);
      setRequests(requestsData);
      setSchools(schoolsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const stats = {
    totalDonations: Object.values(donations).reduce(
      (sum, donation) => sum + donation.amount,
      0
    ),
    totalMealContributions: Object.values(donations).reduce(
      (sum, donation) => sum + donation.mealContribution,
      0
    ),
    completedDonations: Object.values(donations).filter(
      (d) => d.status === 'completed'
    ).length,
    pendingDonations: Object.values(donations).filter((d) => d.status === 'pending')
      .length,
    activeRequests: Object.values(requests).filter((r) => r.status === 'active').length,
    fulfilledRequests: Object.values(requests).filter((r) => r.status === 'fulfilled')
      .length,
  };

  if (userData?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied: Admin Only</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Donation Management</Text>
          <Text style={styles.headerSubtitle}>
            ${stats.totalDonations.toLocaleString()} raised
          </Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <DollarSign color="#4CAF50" size={24} />
          <Text style={styles.statValue}>${stats.totalDonations}</Text>
          <Text style={styles.statLabel}>Total Raised</Text>
        </View>
        <View style={styles.statItem}>
          <TrendingUp color="#2196F3" size={24} />
          <Text style={styles.statValue}>{stats.totalMealContributions}</Text>
          <Text style={styles.statLabel}>Meals Funded</Text>
        </View>
        <View style={styles.statItem}>
          <AlertCircle color="#FF9800" size={24} />
          <Text style={styles.statValue}>{stats.activeRequests}</Text>
          <Text style={styles.statLabel}>Active Requests</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'donations' && styles.tabActive]}
          onPress={() => setActiveTab('donations')}
        >
          <Text
            style={[styles.tabText, activeTab === 'donations' && styles.tabTextActive]}
          >
            Donations ({Object.keys(donations).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}
          >
            Requests ({Object.keys(requests).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'donations' ? (
          <>
            {Object.entries(donations).length === 0 ? (
              <View style={styles.emptyState}>
                <DollarSign color="#ccc" size={64} />
                <Text style={styles.emptyText}>No donations yet</Text>
              </View>
            ) : (
              Object.entries(donations)
                .sort(([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(([id, donation]) => (
                  <View key={id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <DollarSign color="#4CAF50" size={24} />
                        <View>
                          <Text style={styles.cardTitle}>
                            ${donation.amount.toLocaleString()}
                          </Text>
                          <Text style={styles.cardSubtitle}>
                            {donation.mealContribution} meals funded
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              donation.status === 'completed' ? '#4CAF50' : '#FF9800',
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {donation.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Donor:</Text>
                        <Text style={styles.detailText}>
                          {users[donation.donorId]?.name || 'Unknown'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Email:</Text>
                        <Text style={styles.detailText}>
                          {users[donation.donorId]?.email || donation.donorEmail || 'N/A'}
                        </Text>
                      </View>
                      {donation.schoolId && schools[donation.schoolId] && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>School:</Text>
                          <Text style={styles.detailText}>
                            {schools[donation.schoolId].name}
                          </Text>
                        </View>
                      )}
                      <View style={styles.detailRow}>
                        <Calendar color="#666" size={16} />
                        <Text style={styles.detailText}>
                          {new Date(donation.date).toLocaleDateString()}
                        </Text>
                      </View>
                      {donation.donorMessage && (
                        <View style={styles.messageBox}>
                          <Text style={styles.messageLabel}>Message:</Text>
                          <Text style={styles.messageText}>{donation.donorMessage}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
            )}
          </>
        ) : (
          <>
            {Object.entries(requests).length === 0 ? (
              <View style={styles.emptyState}>
                <AlertCircle color="#ccc" size={64} />
                <Text style={styles.emptyText}>No donation requests</Text>
              </View>
            ) : (
              Object.entries(requests)
                .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(([id, request]) => (
                  <View key={id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <AlertCircle
                          color={
                            request.status === 'active'
                              ? '#FF9800'
                              : request.status === 'fulfilled'
                              ? '#4CAF50'
                              : '#999'
                          }
                          size={24}
                        />
                        <View>
                          <Text style={styles.cardTitle}>
                            ${request.requestedAmount.toLocaleString()} needed
                          </Text>
                          <Text style={styles.cardSubtitle}>{request.schoolName}</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              request.status === 'active'
                                ? '#FF9800'
                                : request.status === 'fulfilled'
                                ? '#4CAF50'
                                : '#999',
                          },
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {request.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Principal:</Text>
                        <Text style={styles.detailText}>{request.principalName}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Purpose:</Text>
                        <Text style={styles.detailText}>{request.purpose}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Target Date:</Text>
                        <Text style={styles.detailText}>
                          {new Date(request.targetDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${
                                  (request.fulfilledAmount / request.requestedAmount) * 100
                                }%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          ${request.fulfilledAmount} / ${request.requestedAmount} (
                          {Math.round(
                            (request.fulfilledAmount / request.requestedAmount) * 100
                          )}
                          %)
                        </Text>
                      </View>
                      {request.description && (
                        <View style={styles.messageBox}>
                          <Text style={styles.messageLabel}>Description:</Text>
                          <Text style={styles.messageText}>{request.description}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
            )}
          </>
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
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E3F2FD',
  },
  statsBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    flex: 1,
  },
  messageBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
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
  },
  progressBar: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#f44336',
    textAlign: 'center',
    marginTop: 100,
  },
});
