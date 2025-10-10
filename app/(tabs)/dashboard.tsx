import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { getAllMealTracking } from '@/services/firebase/mealTrackingService';
import { getAllDonations } from '@/services/firebase/donationService';
import { getAllFeedback } from '@/services/firebase/feedbackService';
import { TrendingUp, Users, DollarSign, MessageSquare } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalMealsServed: 0,
    todayMeals: 0,
    totalDonations: 0,
    pendingFeedback: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const mealTracking = await getAllMealTracking();
      const donations = await getAllDonations();
      const feedback = await getAllFeedback();

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

      const pendingFeedbackCount = Object.values(feedback).filter(
        (fb) => fb.status === 'submitted'
      ).length;

      setStats({
        totalMealsServed: totalMeals,
        todayMeals,
        totalDonations: totalDonationAmount,
        pendingFeedback: pendingFeedbackCount,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getRoleBasedGreeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    return `${greeting}, ${userData?.name || 'User'}`;
  };

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
        <Text style={styles.greeting}>{getRoleBasedGreeting()}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.role}>{userData?.role?.toUpperCase()}</Text>
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
              <MessageSquare color={theme.colors.surface} size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.pendingFeedback}</Text>
            <Text style={styles.statLabel}>Pending Feedback</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {userData?.role === 'teacher' && (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Track Today's Meals</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {userData?.role === 'principal' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/principal/dashboard')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Go to Principal Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {userData?.role === 'donor' && (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Make a Donation</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {userData?.role === 'parent' && (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Submit Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {userData?.role === 'admin' && (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Generate Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
  actionButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  actionButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});