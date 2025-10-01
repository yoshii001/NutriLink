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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { getSystemStats } from '@/services/firebase/adminService';
import { getAllMealTracking } from '@/services/firebase/mealTrackingService';
import { getAllDonations } from '@/services/firebase/donationService';
import { getPendingSchools } from '@/services/firebase/schoolService';
import { getActiveDonationRequests } from '@/services/firebase/donationRequestService';
import { Users, School, DollarSign, TrendingUp, CircleAlert as AlertCircle, FileText, Settings, Building2 } from 'lucide-react-native';
import { theme } from '@/constants/theme';

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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.greeting}>Admin Dashboard</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.role}>SYSTEM MANAGEMENT</Text>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={[theme.colors.accent, theme.colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardGradient}
          >
            <View style={styles.statIconContainer}>
              <TrendingUp color={theme.colors.surface} size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.todayMeals}</Text>
            <Text style={styles.statLabel}>Today's Meals</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardGradient}
          >
            <View style={styles.statIconContainer}>
              <Users color={theme.colors.surface} size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.totalMealsServed}</Text>
            <Text style={styles.statLabel}>Total Meals Served</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={[theme.colors.secondary, theme.colors.secondaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardGradient}
          >
            <View style={styles.statIconContainer}>
              <DollarSign color={theme.colors.surface} size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>${stats.totalDonations}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={[theme.colors.secondaryLight, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardGradient}
          >
            <View style={styles.statIconContainer}>
              <AlertCircle color={theme.colors.surface} size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </LinearGradient>
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
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Users color={theme.colors.surface} size={24} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>User Management</Text>
              <Text style={styles.actionSubtitle}>Add, edit, and manage users</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin-schools')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <School color={theme.colors.surface} size={24} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>School Management</Text>
              <Text style={styles.actionSubtitle}>
                Approve schools ({stats.pendingSchools} pending)
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin-donations')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <DollarSign color={theme.colors.surface} size={24} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Donation Management</Text>
              <Text style={styles.actionSubtitle}>Track and manage donations</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/reports')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <FileText color={theme.colors.surface} size={24} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Reports & Analytics</Text>
              <Text style={styles.actionSubtitle}>Generate comprehensive reports</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  role: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  statCardGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  roleCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    width: '30%',
  },
  roleValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.surface,
    marginTop: 2,
    opacity: 0.9,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 100,
  },
});
