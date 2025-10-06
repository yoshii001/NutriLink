import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllSchools,
  approveSchool,
  rejectSchool,
  getPendingSchools,
} from '@/services/firebase/schoolService';
import { School } from '@/types';
import { ChevronLeft, Check, X, Building2, MapPin, Phone, Mail } from 'lucide-react-native';

export default function AdminSchoolsScreen() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [schools, setSchools] = useState<Record<string, School>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadSchools = async () => {
    try {
      const schoolsData = await getAllSchools();
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error loading schools:', error);
      Alert.alert('Error', 'Failed to load schools');
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchools();
    setRefreshing(false);
  };

  const handleApprove = (schoolId: string, schoolName: string) => {
    Alert.alert('Confirm Approval', `Approve ${schoolName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await approveSchool(schoolId, user?.uid || '');
            Alert.alert('Success', 'School approved successfully');
            loadSchools();
          } catch (error) {
            Alert.alert('Error', 'Failed to approve school');
          }
        },
      },
    ]);
  };

  const handleReject = (schoolId: string, schoolName: string) => {
    Alert.alert('Confirm Rejection', `Reject ${schoolName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectSchool(schoolId, user?.uid || '');
            Alert.alert('Success', 'School rejected');
            loadSchools();
          } catch (error) {
            Alert.alert('Error', 'Failed to reject school');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#FF9800',
      approved: '#4CAF50',
      rejected: '#f44336',
    };
    return colors[status as keyof typeof colors] || '#666';
  };

  const filteredSchools = Object.entries(schools).filter(([_, school]) => {
    if (filter === 'all') return true;
    return school.status === filter;
  });

  const stats = {
    total: Object.keys(schools).length,
    pending: Object.values(schools).filter((s) => s.status === 'pending').length,
    approved: Object.values(schools).filter((s) => s.status === 'approved').length,
    rejected: Object.values(schools).filter((s) => s.status === 'rejected').length,
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
          <Text style={styles.headerTitle}>School Management</Text>
          <Text style={styles.headerSubtitle}>{stats.total} schools</Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === f && styles.filterButtonTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredSchools.length === 0 ? (
          <View style={styles.emptyState}>
            <Building2 color="#ccc" size={64} />
            <Text style={styles.emptyText}>No schools found</Text>
          </View>
        ) : (
          filteredSchools.map(([id, school]) => (
            <View key={id} style={styles.schoolCard}>
              <View style={styles.schoolHeader}>
                <View style={styles.schoolHeaderLeft}>
                  <Building2 color="#007AFF" size={24} />
                  <View style={styles.schoolTitleContainer}>
                    <Text style={styles.schoolName}>{school.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(school.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {school.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.schoolDetails}>
                <View style={styles.detailRow}>
                  <MapPin color="#666" size={16} />
                  <Text style={styles.detailText}>
                    {school.address}, {school.city}, {school.state} {school.zipCode}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Mail color="#666" size={16} />
                  <Text style={styles.detailText}>{school.contactEmail}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Phone color="#666" size={16} />
                  <Text style={styles.detailText}>{school.contactPhone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Principal:</Text>
                  <Text style={styles.detailText}>{school.principalName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted:</Text>
                  <Text style={styles.detailText}>
                    {new Date(school.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {school.approvedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {school.status === 'approved' ? 'Approved:' : 'Rejected:'}
                    </Text>
                    <Text style={styles.detailText}>
                      {new Date(school.approvedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {school.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(id, school.name)}
                  >
                    <Check color="#fff" size={20} />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(id, school.name)}
                  >
                    <X color="#fff" size={20} />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
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
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
  },
  filterBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  schoolCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  schoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  schoolHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  schoolTitleContainer: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  schoolDetails: {
    gap: 8,
    marginBottom: 16,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
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
