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
import { getSystemStats } from '@/services/firebase/adminService';
import { getAllMealTracking } from '@/services/firebase/mealTrackingService';
import { getAllDonations } from '@/services/firebase/donationService';
import { getPendingSchools } from '@/services/firebase/schoolService';
import { getActiveDonationRequests } from '@/services/firebase/donationRequestService';
import { Users, School, DollarSign, TrendingUp, CircleAlert as AlertCircle, FileText, Settings, Building2 } from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { userData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchools: 0,
    pendingSchools: 0,
    totalMealsServed: 0,
    todayMeals: 0,
    totalDonations: 0,
    pendingRequests: 0,
    usersByRole: {
      admin: 0,
      teacher: 0,
      principal: 0,
      donor: 0,
      parent: 0,
    },
  });

  const loadAdminData = async () => {
    try {
      const [systemStats, mealTracking, donations, pendingSchools, donationRequests] =
        await Promise.all([
          getSystemStats(),
          getAllMealTracking(),
          getAllDonations(),
          getPendingSchools(),
          getActiveDonationRequests(),
        ]);

      let totalMeals = 0;
      let todayMeals = 0;
      const today = new Date().toISOString().split('T')[0];

      Object.entries(mealTracking).forEach(([date, tracking]) => {
        const mealCount = Object.keys(tracking.students || {}).length;
        totalMeals += mealCount;
        if (date === today) {
          todayMeals = mealCount;
        }
      });

      const totalDonationAmount = Object.values(donations).reduce(
        (sum, donation) => sum + donation.amount,
        0
      );

      setStats({
        totalUsers: systemStats.totalUsers,
        totalSchools: systemStats.totalSchools,
        pendingSchools: Object.keys(pendingSchools).length,
        totalMealsServed: totalMeals,
        todayMeals,
        totalDonations: totalDonationAmount,
        pendingRequests: Object.keys(donationRequests).length,
        usersByRole: systemStats.usersByRole,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  if (userData?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied: Admin Only</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>System Overview & Management</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <TrendingUp color="#1976D2" size={28} />
          <Text style={styles.statValue}>{stats.todayMeals}</Text>
          <Text style={styles.statLabel}>Today's Meals</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <Users color="#7B1FA2" size={28} />
          <Text style={styles.statValue}>{stats.totalMealsServed}</Text>
          <Text style={styles.statLabel}>Total Meals</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <DollarSign color="#388E3C" size={28} />
          <Text style={styles.statValue}>${stats.totalDonations}</Text>
          <Text style={styles.statLabel}>Donations</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <AlertCircle color="#F57C00" size={28} />
          <Text style={styles.statValue}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Statistics</Text>
        <View style={styles.infoRow}>
          <Users color="#666" size={20} />
          <Text style={styles.infoText}>Total Users: {stats.totalUsers}</Text>
        </View>
        <View style={styles.infoRow}>
          <Building2 color="#666" size={20} />
          <Text style={styles.infoText}>Total Schools: {stats.totalSchools}</Text>
        </View>
        <View style={styles.infoRow}>
          <AlertCircle color="#FF9800" size={20} />
          <Text style={styles.infoText}>Pending School Approvals: {stats.pendingSchools}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users by Role</Text>
        <View style={styles.roleGrid}>
          <View style={styles.roleCard}>
            <Text style={styles.roleValue}>{stats.usersByRole.admin}</Text>
            <Text style={styles.roleLabel}>Admins</Text>
          </View>
          <View style={styles.roleCard}>
            <Text style={styles.roleValue}>{stats.usersByRole.principal}</Text>
            <Text style={styles.roleLabel}>Principals</Text>
          </View>
          <View style={styles.roleCard}>
            <Text style={styles.roleValue}>{stats.usersByRole.teacher}</Text>
            <Text style={styles.roleLabel}>Teachers</Text>
          </View>
          <View style={styles.roleCard}>
            <Text style={styles.roleValue}>{stats.usersByRole.donor}</Text>
            <Text style={styles.roleLabel}>Donors</Text>
          </View>
          <View style={styles.roleCard}>
            <Text style={styles.roleValue}>{stats.usersByRole.parent}</Text>
            <Text style={styles.roleLabel}>Parents</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin-users')}
        >
          <Users color="#007AFF" size={24} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>User Management</Text>
            <Text style={styles.actionSubtitle}>Add, edit, and manage users</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin-schools')}
        >
          <School color="#007AFF" size={24} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>School Management</Text>
            <Text style={styles.actionSubtitle}>
              Approve schools ({stats.pendingSchools} pending)
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin-donations')}
        >
          <DollarSign color="#007AFF" size={24} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Donation Management</Text>
            <Text style={styles.actionSubtitle}>Track and manage donations</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/reports')}
        >
          <FileText color="#007AFF" size={24} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Reports & Analytics</Text>
            <Text style={styles.actionSubtitle}>Generate comprehensive reports</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E3F2FD',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '30%',
  },
  roleValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#007AFF',
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#f44336',
    textAlign: 'center',
    marginTop: 100,
  },
});
