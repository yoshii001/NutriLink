// app/my-donations.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  DollarSign,
  Calendar,
  Package,
  CheckCircle,
  ArrowLeft,
  Home,
  Settings,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getDonationsByDonorId } from '@/services/firebase/donationService';
import { getPublishedDonationsByDonorId } from '@/services/firebase/publishedDonationService';
import mockPaymentService from '@/services/mockPaymentService';
import { Donation, PublishedDonation } from '@/types';
import { theme } from '@/constants/theme';

export default function MyDonationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [donations, setDonations] = useState<Record<string, Donation>>({});
  const [publishedDonations, setPublishedDonations] = useState<Record<string, PublishedDonation>>(
    {}
  );
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'monetary' | 'published'>('monetary');
  const [mockPayments, setMockPayments] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [donationsData, publishedData] = await Promise.all([
        getDonationsByDonorId(user.uid),
        getPublishedDonationsByDonorId(user.uid),
      ]);
      setDonations(donationsData);
      setPublishedDonations(publishedData);
        try {
          const payments = await mockPaymentService.getAllMockPayments();
          setMockPayments(payments.filter((p: any) => p.donorId === user.uid));
        } catch (err) {
          console.warn('Failed to load mock payments', err);
        }
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalDonated = Object.values(donations).reduce((sum, d) => sum + d.amount, 0);
  const totalMeals = Object.values(donations).reduce((sum, d) => sum + d.mealContribution, 0);
  const totalPublished = Object.keys(publishedDonations).length;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/dashboard')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2} />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Heart size={48} color={theme.colors.surface} strokeWidth={2} />
        <Text style={styles.headerTitle}>My Donations</Text>
        <Text style={styles.headerSubtitle}>Your impact on children's lives</Text>
      </LinearGradient>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <DollarSign size={28} color={theme.colors.success} strokeWidth={2} />
          <Text style={styles.statValue}>${totalDonated.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Donated</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Heart size={28} color={theme.colors.error} strokeWidth={2} />
          <Text style={styles.statValue}>{totalMeals}</Text>
          <Text style={styles.statLabel}>Meals Funded</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Package size={28} color={theme.colors.primary} strokeWidth={2} />
          <Text style={styles.statValue}>{totalPublished}</Text>
          <Text style={styles.statLabel}>Items Published</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'monetary' && styles.tabActive]}
          onPress={() => setActiveTab('monetary')}
        >
          <Text style={[styles.tabText, activeTab === 'monetary' && styles.tabTextActive]}>
            Monetary Donations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'published' && styles.tabActive]}
          onPress={() => setActiveTab('published')}
        >
          <Text style={[styles.tabText, activeTab === 'published' && styles.tabTextActive]}>
            Published Items
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'monetary' ? (
          <>
            {Object.keys(donations).length === 0 ? (
              <View style={styles.emptyState}>
                <DollarSign size={64} color={theme.colors.text.light} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No donations yet</Text>
                <Text style={styles.emptySubtext}>Start making a difference today</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/donation-requests')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyButtonGradient}
                  >
                    <Text style={styles.emptyButtonText}>Browse Requests</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              Object.entries(donations)
                .sort(([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(([id, donation]) => (
                  <View key={id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.statusBadge}>
                        <CheckCircle size={16} color={theme.colors.success} />
                        <Text style={styles.statusText}>Completed</Text>
                      </View>
                      <View style={styles.dateContainer}>
                        <Calendar size={14} color={theme.colors.text.light} />
                        <Text style={styles.dateText}>
                          {new Date(donation.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text style={styles.amount}>${donation.amount.toFixed(2)}</Text>
                      <View style={styles.mealsBadge}>
                        <Heart size={14} color={theme.colors.error} />
                        <Text style={styles.mealsText}>{donation.mealContribution} meals</Text>
                      </View>
                    </View>

                    {donation.schoolId && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>School:</Text>
                        <Text style={styles.infoValue}>
                          {donation.schoolId.replace(/-/g, ' ')}
                        </Text>
                      </View>
                    )}

                    {donation.donorMessage && (
                      <View style={styles.messageBox}>
                        <Text style={styles.messageLabel}>Your Message:</Text>
                        <Text style={styles.messageText}>{donation.donorMessage}</Text>
                      </View>
                    )}
                  </View>
                ))
            )}
          </>
        ) : (
          <>
            {Object.keys(publishedDonations).length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={64} color={theme.colors.text.light} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No published items</Text>
                <Text style={styles.emptySubtext}>Share what you can donate</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/publish-donation')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyButtonGradient}
                  >
                    <Text style={styles.emptyButtonText}>Publish Donation</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              Object.entries(publishedDonations)
                .sort(
                  ([, a], [, b]) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .map(([id, item]) => (
                  <View key={id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                          {item.category.toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'available' && styles.availableBadge,
                          item.status === 'reserved' && styles.reservedBadge,
                          item.status === 'fulfilled' && styles.fulfilledBadge,
                        ]}
                      >
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>

                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit}
                      {item.monetaryValue && ` (${item.monetaryValue})`}
                    </Text>

                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>

                    {item.location && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Location:</Text>
                        <Text style={styles.infoValue}>{item.location}</Text>
                      </View>
                    )}

                    <View style={styles.deliveryTags}>
                      {item.deliveryOptions.map((option, index) => (
                        <View key={index} style={styles.deliveryTag}>
                          <Text style={styles.deliveryTagText}>{option}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.itemFooter}>
                      <Text style={styles.itemDate}>
                        Published {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/(tabs)/dashboard')}
          activeOpacity={0.7}
        >
          <Home size={24} color={theme.colors.text.secondary} strokeWidth={2} />
          <Text style={styles.navButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/publish-donation')}
          activeOpacity={0.7}
        >
          <Package size={24} color={theme.colors.text.secondary} strokeWidth={2} />
          <Text style={styles.navButtonText}>Publish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    backgroundColor: theme.colors.surface,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    marginTop: theme.spacing.md,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.surface,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: -theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    ...theme.shadows.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    ...theme.shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.surface,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  availableBadge: {
    backgroundColor: `${theme.colors.success}15`,
  },
  reservedBadge: {
    backgroundColor: `${theme.colors.accent}15`,
  },
  fulfilledBadge: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.success,
    textTransform: 'capitalize',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  amount: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.success,
  },
  mealsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: `${theme.colors.error}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  mealsText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.error,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
  },
  messageBox: {
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  messageLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  categoryBadge: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  itemQuantity: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  deliveryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  deliveryTag: {
    backgroundColor: `${theme.colors.accent}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  deliveryTagText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.accent,
  },
  itemFooter: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.light,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  emptyButtonGradient: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 8,
    paddingTop: 8,
    ...theme.shadows.lg,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  navButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
});