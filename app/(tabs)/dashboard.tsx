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
import mockPaymentService, { MockPaymentRecord } from '@/services/mockPaymentService';

export default function DashboardScreen() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [stats, setStats] = useState({
    totalMealsServed: 0,
    todayMeals: 0,
    totalDonations: 0,
    pendingFeedback: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [recentMocks, setRecentMocks] = useState<MockPaymentRecord[]>([]);
  const [donorMetrics, setDonorMetrics] = useState({ total: 0, count: 0, meals: 0, last: null as { amount: number; date: string } | null });

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

      // donor-specific metrics
      if (userData?.role === 'donor' && user?.uid) {
        const donorDonations = Object.values(donations).filter((d) => d.donorId === user.uid);
        const donorTotal = donorDonations.reduce((s, d) => s + d.amount, 0);
        const donorCount = donorDonations.length;
        const MEAL_COST = 0.5; // $ per meal (configurable)
        const donorMeals = Math.round(donorTotal / MEAL_COST);
        let last = null as { amount: number; date: string } | null;
        if (donorDonations.length > 0) {
          const sorted = donorDonations.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          last = { amount: sorted[0].amount, date: sorted[0].date };
        }
        setDonorMetrics({ total: donorTotal, count: donorCount, meals: donorMeals, last });
      } else {
        setDonorMetrics({ total: 0, count: 0, meals: 0, last: null });
      }

      const pendingFeedbackCount = Object.values(feedback).filter(
        (fb) => fb.status === 'submitted'
      ).length;

      setStats({
        totalMealsServed: totalMeals,
        todayMeals,
        totalDonations: totalDonationAmount,
        pendingFeedback: pendingFeedbackCount,
      });

      // load recent mock payments (donor preview)
      if (userData?.role === 'donor') {
        try {
          const recent = await mockPaymentService.getAllMockPayments();
          setRecentMocks(recent.slice(0, 3));
        } catch (e) {
          setRecentMocks([]);
        }
      }
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
        {userData?.role === 'donor' ? (
          <View style={styles.donorHeaderRow}>
            <View style={styles.donorHeaderText}>
              <Text style={styles.greetingSmall}>{getRoleBasedGreeting()}</Text>
              <Text style={styles.greetingLarge}>{userData?.name || 'Donor'}</Text>
            </View>
            <View style={styles.avatarSmall}>{
              <Text style={styles.avatarTextSmall}>{(userData?.name || 'D').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</Text>
            }</View>
          </View>
        ) : (
          <>
            <Text style={styles.greeting}>{getRoleBasedGreeting()}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.role}>{userData?.role?.toUpperCase()}</Text>
            </View>
          </>
        )}
      </LinearGradient>
      {userData?.role === 'donor' ? (
        <View style={styles.donorRoot}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.hero}
          >
            <Text style={styles.heroTitle}>Welcome back{userData?.name ? `, ${userData.name.split(' ')[0]}` : ''}!</Text>
            <Text style={styles.heroSubtitle}>Make an impact today — every donation helps feed students.</Text>
          </LinearGradient>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Donated</Text>
              <Text style={styles.summaryValue}>${userData?.role === 'donor' ? donorMetrics.total : stats.totalDonations}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Donations</Text>
              <Text style={styles.summaryValue}>{userData?.role === 'donor' ? donorMetrics.count : '—'}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Meals Equivalent</Text>
              <Text style={styles.summaryValue}>{userData?.role === 'donor' ? donorMetrics.meals : Math.round(stats.totalDonations / 1)}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Last Donation</Text>
              <Text style={styles.summaryValue}>{userData?.role === 'donor' && donorMetrics.last ? `$${donorMetrics.last.amount}` : '—'}</Text>
              {userData?.role === 'donor' && donorMetrics.last && (
                <Text style={styles.recentItemMeta}>{new Date(donorMetrics.last.date).toLocaleDateString()}</Text>
              )}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.ctaPrimary} onPress={() => router.push('/donor/money')} activeOpacity={0.9}>
              <Text style={styles.ctaPrimaryText}>Donate Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecondary} onPress={() => router.push('/donor/food')} activeOpacity={0.9}>
              <Text style={styles.ctaSecondaryText}>Donate Food</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentFullContainer}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Donations</Text>
              <TouchableOpacity onPress={() => router.push('/my-donations')}>
                <Text style={styles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentList}>
              {/* combine real donations + mock payments: show recentMocks for now */}
              {recentMocks.length === 0 ? (
                <Text style={styles.recentEmpty}>You haven't made any donations yet — start by tapping Donate Money.</Text>
              ) : (
                recentMocks.map((r) => (
                  <View key={r.id} style={styles.recentItem}>
                    <View>
                      <Text style={styles.recentItemText}>${r.amount}</Text>
                      <Text style={styles.recentItemMeta}>{r.status} • {r.donorId ? r.donorId : 'You'}</Text>
                    </View>
                    <Text style={styles.recentItemDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      ) : (
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
      )}

      {userData?.role !== 'donor' && (
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
            onPress={() => router.push('/principal-dashboard')}
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
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 40,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
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
  donorSection: {
    padding: theme.spacing.md,
  },
  givingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    ...theme.shadows.md,
  },
  givingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.primary,
  },
  givingAmount: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  givingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  givingActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  primaryActionText: {
    color: theme.colors.surface,
    fontFamily: 'Inter-SemiBold',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: theme.colors.surface,
    fontFamily: 'Inter-SemiBold',
  },
  recentContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  viewAll: {
    color: theme.colors.primary,
    fontFamily: 'Inter-SemiBold',
    marginTop: -28,
    alignSelf: 'flex-end',
  },
  recentList: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  recentEmpty: {
    color: theme.colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  recentItemText: {
    color: theme.colors.text.primary,
    fontFamily: 'Inter-SemiBold',
  },
  recentItemDate: {
    color: theme.colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  recentItemMeta: {
    color: theme.colors.text.secondary,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  donorRoot: {
    paddingBottom: theme.spacing.md,
  },
  hero: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    margin: theme.spacing.md,
  },
  heroTitle: {
    color: theme.colors.surface,
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  heroSubtitle: {
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
    fontFamily: 'Inter-Regular',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'flex-start',
    ...theme.shadows.sm,
  },
  summaryLabel: {
    color: theme.colors.text.secondary,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  summaryValue: {
    marginTop: theme.spacing.sm,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  ctaPrimary: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: theme.colors.surface,
    fontFamily: 'Inter-SemiBold',
  },
  ctaSecondary: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    color: theme.colors.surface,
    fontFamily: 'Inter-SemiBold',
  },
  recentFullContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donorHeaderText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  greetingSmall: {
    color: theme.colors.surface,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    opacity: 0.95,
  },
  greetingLarge: {
    color: theme.colors.surface,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginTop: theme.spacing.xs,
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    color: theme.colors.surface,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
});