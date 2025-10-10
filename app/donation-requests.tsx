import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, School, Calendar, Check, X, ArrowLeft, Home, Plus, Heart } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveDonationRequests } from '@/services/firebase/donationRequestService';
import { getPublishedDonationsByDonorId } from '@/services/firebase/publishedDonationService';
import { DonationRequest, PublishedDonation } from '@/types';
import { theme } from '@/constants/theme';

export default function DonationRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Record<string, DonationRequest>>({});
  const [myDonations, setMyDonations] = useState<Record<string, PublishedDonation>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{
    id: string;
    request: DonationRequest;
  } | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [requestsData, donationsData] = await Promise.all([
        getActiveDonationRequests(),
        getPublishedDonationsByDonorId(user.uid),
      ]);
      setRequests(requestsData);
      setMyDonations(donationsData);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleDonateNow = (requestId: string) => {
    router.push({
      pathname: '/donate',
      params: { requestId },
    });
    setSelectedRequest(null);
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
        <Bell size={48} color={theme.colors.surface} strokeWidth={2} />
        <Text style={styles.headerTitle}>Donation Requests</Text>
        <Text style={styles.headerSubtitle}>Schools that need your help</Text>
      </LinearGradient>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Object.keys(requests).length}</Text>
          <Text style={styles.statLabel}>Active Requests</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Object.values(myDonations).filter((d) => d.status === 'available').length}
          </Text>
          <Text style={styles.statLabel}>My Available Items</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.keys(requests).length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color={theme.colors.text.light} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No active requests</Text>
            <Text style={styles.emptySubtext}>Check back later for schools in need</Text>
          </View>
        ) : (
          Object.entries(requests)
            .sort(
              ([, a], [, b]) =>
                new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
            )
            .map(([id, request]) => {
              const daysUntil = getDaysUntilTarget(request.targetDate);
              const isUrgent = daysUntil <= 2;

              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.card, isUrgent && styles.cardUrgent]}
                  onPress={() => setSelectedRequest({ id, request })}
                  activeOpacity={0.7}
                >
                  {isUrgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>URGENT</Text>
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <View style={styles.schoolInfo}>
                      <School size={24} color={theme.colors.primary} />
                      <View style={styles.schoolDetails}>
                        <Text style={styles.schoolName}>{request.schoolName}</Text>
                        <Text style={styles.principalName}>by {request.principalName}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.purpose}>{request.purpose}</Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {request.description}
                  </Text>

                  <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount Needed:</Text>
                      <Text style={styles.detailValue}>${request.requestedAmount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fulfilled:</Text>
                      <Text style={styles.detailValue}>${request.fulfilledAmount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Remaining:</Text>
                      <Text style={[styles.detailValue, styles.remainingValue]}>
                        ${request.requestedAmount - request.fulfilledAmount}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min((request.fulfilledAmount / request.requestedAmount) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.dateInfo}>
                      <Calendar size={16} color={theme.colors.text.light} />
                      <Text style={styles.dateText}>
                        Needed by {new Date(request.targetDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.daysRemaining}>
                      <Text style={[styles.daysText, isUrgent && styles.daysTextUrgent]}>
                        {daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.donateButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDonateNow(id);
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.donateButtonGradient}
                    >
                      <Heart size={18} color={theme.colors.surface} />
                      <Text style={styles.donateButtonText}>Donate Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
        )}
      </ScrollView>

      <Modal
        visible={!!selectedRequest}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Request Details</Text>
                  <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                    <X size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>School</Text>
                    <Text style={styles.modalValue}>{selectedRequest.request.schoolName}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Principal</Text>
                    <Text style={styles.modalValue}>{selectedRequest.request.principalName}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Purpose</Text>
                    <Text style={styles.modalValue}>{selectedRequest.request.purpose}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Description</Text>
                    <Text style={styles.modalValue}>{selectedRequest.request.description}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Amount Needed</Text>
                    <Text style={styles.modalValue}>
                      ${selectedRequest.request.requestedAmount}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Already Raised</Text>
                    <Text style={styles.modalValue}>
                      ${selectedRequest.request.fulfilledAmount}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Still Needed</Text>
                    <Text style={[styles.modalValue, styles.highlightValue]}>
                      ${selectedRequest.request.requestedAmount - selectedRequest.request.fulfilledAmount}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Target Date</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedRequest.request.targetDate).toLocaleDateString()}
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleDonateNow(selectedRequest.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalButtonGradient}
                    >
                      <Heart size={20} color={theme.colors.surface} />
                      <Text style={styles.modalButtonText}>Donate Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
          onPress={() => router.push('/request-donation')}
          activeOpacity={0.7}
        >
          <Plus size={24} color={theme.colors.text.secondary} strokeWidth={2} />
          <Text style={styles.navButtonText}>New Request</Text>
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
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
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
  cardUrgent: {
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  urgentBadge: {
    position: 'absolute',
    top: -8,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    letterSpacing: 0.5,
  },
  cardHeader: {
    marginBottom: theme.spacing.md,
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  schoolDetails: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
  },
  principalName: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  purpose: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  requestDetails: {
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
  },
  remainingValue: {
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  daysRemaining: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  daysText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
  daysTextUrgent: {
    color: theme.colors.error,
  },
  donateButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  donateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm + 2,
  },
  donateButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  modalSection: {
    marginBottom: theme.spacing.md,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modalValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
  },
  highlightValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
  modalActions: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
  },
});