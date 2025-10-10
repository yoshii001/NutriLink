import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllDonations } from '@/services/firebase/donationService';
import { getAvailablePublishedDonations } from '@/services/firebase/publishedDonationService';
import { getActiveDonationRequests } from '@/services/firebase/donationRequestService';
import { Donation, PublishedDonation, DonationRequest } from '@/types';
import { DollarSign, Heart, Package, Bell, Plus, List, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';

export default function DonationsScreen() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [donations, setDonations] = useState<Record<string, Donation>>({});
  const [publishedDonations, setPublishedDonations] = useState<Record<string, PublishedDonation>>({});
  const [requests, setRequests] = useState<Record<string, DonationRequest>>({});
  const [refreshing, setRefreshing] = useState(false);

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

  const loadDonations = async () => {
    try {
      const [donationsData, publishedData, requestsData] = await Promise.all([
        getAllDonations(),
        getAvailablePublishedDonations(),
        getActiveDonationRequests(),
      ]);
      setDonations(donationsData);
      setPublishedDonations(publishedData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  };

  const totalDonations = Object.values(donations).reduce((sum, d) => sum + d.amount, 0);
  const totalMeals = Object.values(donations).reduce((sum, d) => sum + d.mealContribution, 0);

  if (userData.role === 'donor') {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Donor Community</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Package size={28} color={theme.colors.primary} />
              <Text style={styles.statValue}>{Object.keys(publishedDonations).length}</Text>
              <Text style={styles.statLabel}>Available Items</Text>
            </View>
            <View style={styles.statCard}>
              <Bell size={28} color={theme.colors.accent} />
              <Text style={styles.statValue}>{Object.keys(requests).length}</Text>
              <Text style={styles.statLabel}>Active Requests</Text>
            </View>
          </View>

          <View style={styles.actionCardsContainer}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/publish-donation')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardIconContainer}>
                  <Plus size={32} color={theme.colors.surface} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionCardTitle}>Publish Donation</Text>
                <Text style={styles.actionCardDescription}>
                  Share what you can donate with schools
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/donation-requests')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.secondary, theme.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardIconContainer}>
                  <Bell size={32} color={theme.colors.surface} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionCardTitle}>View Requests</Text>
                <Text style={styles.actionCardDescription}>
                  See what schools need from you
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/public-donations')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primaryDark, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardIconContainer}>
                  <List size={32} color={theme.colors.surface} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionCardTitle}>Browse Community</Text>
                <Text style={styles.actionCardDescription}>
                  See what others are donating
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/my-donations')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.secondaryDark, theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardIconContainer}>
                  <Settings size={32} color={theme.colors.surface} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionCardTitle}>Manage My Donations</Text>
                <Text style={styles.actionCardDescription}>
                  Edit or delete your published items
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>About KidsFeed</Text>
          <View style={styles.kidsfeedCardGradientWrap}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.kidsfeedCardGradient}
            >
              <Text style={styles.kidsfeedTaglineGradient}>Connecting Communities, Nourishing Futures.</Text>
              <Text style={styles.kidsfeedTextGradient}>
                KidsFeed brings donors, schools and volunteers together to ensure nutritious meals reach children who need them most. Publish items, respond to requests, and see the difference your generosity makes.
              </Text>
              <TouchableOpacity onPress={() => router.push('/public-donations')} activeOpacity={0.7}>
                <Text style={styles.kidsfeedLink}>Browse Community →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  actionCardsContainer: {
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  actionCardGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  actionCardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  actionCardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  actionCardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
  impactCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  impactContent: {
    flex: 1,
  },
  impactValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  impactLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  impactDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
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
  kidsfeedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    marginBottom: theme.spacing.lg,
  },
  kidsfeedTagline: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  kidsfeedText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  kidsfeedActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  kidsfeedButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  kidsfeedButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  kidsfeedButtonText: {
    color: theme.colors.surface,
    fontFamily: 'Inter-SemiBold',
  },
  kidsfeedButtonTextSecondary: {
    color: theme.colors.primary,
  },
  kidsfeedCardGradientWrap: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  kidsfeedCardGradient: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kidsfeedTaglineGradient: {
    color: theme.colors.surface,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  kidsfeedTextGradient: {
    color: theme.colors.surface,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    opacity: 0.95,
  },
  kidsfeedLink: {
    color: theme.colors.surface,
    textDecorationLine: 'underline',
    fontFamily: 'Inter-SemiBold',
  },
  highlightsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    marginBottom: theme.spacing.lg,
  },
  highlightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
  },
  highlightValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
  },
  highlightLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  highlightCTA: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  highlightCTAText: {
    color: theme.colors.surface,
    fontFamily: 'Inter-SemiBold',
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