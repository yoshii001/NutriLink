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
import { Package, Calendar, MapPin, User, ArrowLeft, Home } from 'lucide-react-native';
import { getAvailablePublishedDonations, deletePublishedDonation } from '@/services/firebase/publishedDonationService';
import { getAllMoneyDonations, MoneyDonationRecord } from '@/services/firebase/moneyDonationService';
import { deleteMoneyDonation } from '@/services/firebase/moneyDonationService';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';
import { PublishedDonation } from '@/types';
import { theme } from '@/constants/theme';

export default function PublicDonationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [donations, setDonations] = useState<Record<string, PublishedDonation>>({});
  const [moneyDonations, setMoneyDonations] = useState<Record<string, MoneyDonationRecord>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'food' | 'supplies' | 'monetary' | 'other'>('food');
  const [activeCategory, setActiveCategory] = useState<'food' | 'money'>('food');

  const loadDonations = async () => {
    try {
      const data = await getAvailablePublishedDonations();
      setDonations(data);

      // Load monetary donations separately and store them independently
      try {
        const money = await getAllMoneyDonations();
        setMoneyDonations(money);
      } catch (err) {
        console.error('Error loading money donations:', err);
        setMoneyDonations({});
      }
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

  // Compute filtered donations for the Food tab (publishedDonations)
  const filteredDonations =
    filter === 'all'
      ? donations
      : Object.fromEntries(
          Object.entries(donations).filter(([_, donation]) => donation.category === filter)
        );

  // For money tab, we only show moneyDonations (separate collection)
  const filteredMoneyDonations = moneyDonations;

  // categories shown in the filter bar — for Food tab we include food-related types;
  // Money tab will not show these (it displays monetary donations from a separate collection)
  const categories = activeCategory === 'food'
    ? [
        { value: 'food', label: 'Food' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'other', label: 'Other' },
        { value: 'all', label: 'All' },
      ]
    : [
        { value: 'money', label: 'Money Donations' },
      ];

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
        <Text style={styles.headerTitle}>Available Donations</Text>
        <Text style={styles.headerSubtitle}>See what the community is offering</Text>
      </LinearGradient>

      {/* Category tabs: Food Donations | Money Donations */}
      <View style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <TouchableOpacity
            style={[styles.tabButton, activeCategory === 'food' && styles.tabButtonActive]}
            onPress={() => { setActiveCategory('food'); setFilter('food'); }}
          >
            <Text style={[styles.tabButtonText, activeCategory === 'food' && styles.tabButtonTextActive]}>Food Donations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeCategory === 'money' && styles.tabButtonActive]}
            onPress={() => { setActiveCategory('money'); setFilter('all'); }}
          >
            <Text style={[styles.tabButtonText, activeCategory === 'money' && styles.tabButtonTextActive]}>Money Donations</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.filterButton, filter === (cat.value as any) && styles.filterButtonActive]}
              onPress={() => setFilter(cat.value as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === (cat.value as any) && styles.filterButtonTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeCategory === 'food' ? (
          Object.keys(filteredDonations).length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={64} color={theme.colors.text.light} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No food donations available</Text>
              <Text style={styles.emptySubtext}>Check back later for new food or supplies</Text>
            </View>
          ) : (
            Object.entries(filteredDonations)
              .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(([id, donation]) => (
                <View key={id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{donation.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Available</Text>
                    </View>
                  </View>

                  <Text style={styles.itemName}>{donation.itemName}</Text>

                  <Text style={styles.quantityText}>
                    {donation.quantity} {donation.unit}
                    {donation.monetaryValue && ` ($${donation.monetaryValue})`}
                  </Text>

                  <Text style={styles.description} numberOfLines={2}>
                    {donation.description}
                  </Text>

                  <View style={styles.infoRow}>
                    <User size={16} color={theme.colors.text.light} />
                    <Text style={styles.infoText}>{donation.donorName}</Text>
                  </View>

                  {donation.location && (
                    <View style={styles.infoRow}>
                      <MapPin size={16} color={theme.colors.text.light} />
                      <Text style={styles.infoText}>{donation.location}</Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Calendar size={16} color={theme.colors.text.light} />
                    <Text style={styles.infoText}>
                      Available from {new Date(donation.availableFrom).toLocaleDateString()}
                    </Text>
                  </View>

                  {donation.expiryDate && (
                    <View style={styles.infoRow}>
                      <Calendar size={16} color={theme.colors.text.light} />
                      <Text style={styles.infoText}>
                        Expires: {new Date(donation.expiryDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.deliveryOptions}>
                    <Text style={styles.deliveryLabel}>Delivery Options:</Text>
                    <View style={styles.deliveryTags}>
                      {donation.deliveryOptions.map((option, index) => (
                        <View key={index} style={styles.deliveryTag}>
                          <Text style={styles.deliveryTagText}>{option}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {/* Edit/Delete for owner */}
                  {user && donation.donorId === user.uid && (
                    <View style={styles.ownerActions}>
                      <TouchableOpacity
                        style={styles.ownerButton}
                        onPress={() => router.push(`/publish-donation?editId=${id}`)}
                        accessibilityLabel="Edit published donation"
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={[theme.colors.primary, theme.colors.accent]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.ownerButtonGradient}
                        >
                          <Text style={styles.ownerButtonText}>Edit</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.ownerButtonDanger}
                        onPress={() => {
                          Alert.alert(
                            'Delete donation',
                            'Are you sure you want to permanently delete this published donation? This cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await deletePublishedDonation(id);
                                    loadDonations();
                                  } catch (err) {
                                    console.error('Failed to delete published donation', err);
                                    Alert.alert('Error', 'Failed to delete donation. Please try again.');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        accessibilityLabel="Delete published donation"
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={[theme.colors.error, theme.colors.error]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.ownerButtonGradient}
                        >
                          <Text style={styles.ownerButtonText}>Delete</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
          )
        ) : (
          // Money donations list
          Object.keys(filteredMoneyDonations).length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={64} color={theme.colors.text.light} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No monetary donations available</Text>
              <Text style={styles.emptySubtext}>Check back later for monetary offerings</Text>
            </View>
          ) : (
            Object.entries(filteredMoneyDonations)
              .sort(([, a], [, b]) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
              .map(([id, donation]) => (
                <View key={id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>MONEY</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Available</Text>
                    </View>
                  </View>

                  <Text style={styles.itemName}>${donation.amount.toFixed(2)}</Text>

                  <Text style={styles.description} numberOfLines={2}>
                    {donation.note || 'Monetary donation available'}
                  </Text>

                  <View style={styles.infoRow}>
                    <User size={16} color={theme.colors.text.light} />
                    <Text style={styles.infoText}>{donation.donorName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Calendar size={16} color={theme.colors.text.light} />
                    <Text style={styles.infoText}>
                      Available from {new Date(donation.availableFrom || donation.createdAt || '').toLocaleDateString()}
                    </Text>
                  </View>
                <View style={{ marginTop: theme.spacing.md }}>
                  <TouchableOpacity
                    style={styles.payNowButton}
                    onPress={() => router.push({ pathname: '/pay-money/[id]', params: { id } })}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.payNowGradient}
                    >
                      <Text style={styles.payNowText}>Pay Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                  {/* Owner actions for money donations */}
                  {user && donation.donorId === user.uid && (
                    <View style={{ flexDirection: 'row', marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
                      <TouchableOpacity
                        style={[styles.payNowButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => router.push(`/donate/money?editId=${id}`)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={[theme.colors.primary, theme.colors.accent]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.payNowGradient}
                        >
                          <Text style={styles.payNowText}>Edit</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.payNowButton, { backgroundColor: theme.colors.error }]}
                        onPress={() => {
                          Alert.alert(
                            'Delete monetary donation',
                            'Are you sure you want to permanently delete this monetary donation? This cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await deleteMoneyDonation(id);
                                    loadDonations();
                                  } catch (err) {
                                    console.error('Failed to delete money donation', err);
                                    Alert.alert('Error', 'Failed to delete donation. Please try again.');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={[theme.colors.error, theme.colors.error]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.payNowGradient}
                        >
                          <Text style={styles.payNowText}>Delete</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
          )
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
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.surface,
    opacity: 0.9,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tabButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
  },
  tabButtonTextActive: {
    color: theme.colors.surface,
  },
  filterButtonTextActive: {
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
  payNowButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    width: 140,
  },
  payNowGradient: {
    paddingVertical: theme.spacing.sm + 6,
    alignItems: 'center',
  },
  payNowText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryBadge: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.success,
  },
  itemName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  deliveryOptions: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  deliveryLabel: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  deliveryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
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
  },
  ownerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  ownerButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    width: 110,
  },
  ownerButtonDanger: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    width: 110,
  },
  ownerButtonGradient: {
    paddingVertical: theme.spacing.sm + 4,
    alignItems: 'center',
  },
  ownerButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.surface,
  },
});
