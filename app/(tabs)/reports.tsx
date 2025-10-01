import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { getAllReports } from '@/services/firebase/reportService';
import { getAllMealTracking } from '@/services/firebase/mealTrackingService';
import { getAllDonations } from '@/services/firebase/donationService';
import { getAllFeedback } from '@/services/firebase/feedbackService';
import { getAllSchools } from '@/services/firebase/schoolService';
import { Report } from '@/types';
import { FileText, TrendingUp, DollarSign, MessageSquare, Users, Calendar, Download } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ReportsScreen() {
  const { userData } = useAuth();
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [liveStats, setLiveStats] = useState({
    totalMeals: 0,
    totalDonations: 0,
    totalFeedback: 0,
    totalSchools: 0,
    weekMeals: 0,
    monthMeals: 0,
    pendingFeedback: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  if (!userData || (userData.role !== 'admin' && userData.role !== 'principal')) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  const loadLiveStats = async () => {
    try {
      const [meals, donations, feedback, schools] = await Promise.all([
        getAllMealTracking(),
        getAllDonations(),
        getAllFeedback(),
        getAllSchools(),
      ]);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let totalMeals = 0;
      let weekMeals = 0;
      let monthMeals = 0;

      Object.entries(meals).forEach(([date, tracking]) => {
        const mealCount = Object.keys(tracking.students || {}).length;
        totalMeals += mealCount;

        const mealDate = new Date(date);
        if (mealDate >= weekAgo) weekMeals += mealCount;
        if (mealDate >= monthAgo) monthMeals += mealCount;
      });

      const totalDonationAmount = Object.values(donations).reduce(
        (sum, donation) => sum + donation.amount,
        0
      );

      const pendingFeedbackCount = Object.values(feedback).filter(
        (fb) => fb.status === 'submitted'
      ).length;

      setLiveStats({
        totalMeals,
        totalDonations: totalDonationAmount,
        totalFeedback: Object.keys(feedback).length,
        totalSchools: Object.keys(schools).length,
        weekMeals,
        monthMeals,
        pendingFeedback: pendingFeedbackCount,
      });
    } catch (error) {
      console.error('Error loading live stats:', error);
    }
  };

  const loadReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  useEffect(() => {
    loadReports();
    loadLiveStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadReports(), loadLiveStats()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.subtitle}>Comprehensive system insights</Text>
      </View>

      <View style={styles.liveStatsSection}>
        <Text style={styles.sectionTitle}>Live Statistics</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <TrendingUp color="#1976D2" size={24} />
            <Text style={styles.statCardValue}>{liveStats.totalMeals}</Text>
            <Text style={styles.statCardLabel}>Total Meals</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <DollarSign color="#388E3C" size={24} />
            <Text style={styles.statCardValue}>${liveStats.totalDonations}</Text>
            <Text style={styles.statCardLabel}>Donations</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <MessageSquare color="#F57C00" size={24} />
            <Text style={styles.statCardValue}>{liveStats.totalFeedback}</Text>
            <Text style={styles.statCardLabel}>Feedback</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <Users color="#7B1FA2" size={24} />
            <Text style={styles.statCardValue}>{liveStats.totalSchools}</Text>
            <Text style={styles.statCardLabel}>Schools</Text>
          </View>
        </View>

        <View style={styles.periodStats}>
          <View style={styles.periodStatItem}>
            <Text style={styles.periodValue}>{liveStats.weekMeals}</Text>
            <Text style={styles.periodLabel}>Meals This Week</Text>
          </View>
          <View style={styles.periodStatItem}>
            <Text style={styles.periodValue}>{liveStats.monthMeals}</Text>
            <Text style={styles.periodLabel}>Meals This Month</Text>
          </View>
          <View style={styles.periodStatItem}>
            <Text style={styles.periodValue}>{liveStats.pendingFeedback}</Text>
            <Text style={styles.periodLabel}>Pending Feedback</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Generated Reports</Text>
          <TouchableOpacity style={styles.exportButton}>
            <Download color="#007AFF" size={20} />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(reports)
          .sort(([, a], [, b]) =>
            new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime()
          )
          .map(([id, report]) => (
            <View key={id} style={styles.card}>
              <View style={styles.cardHeader}>
                <FileText color="#007AFF" size={24} />
                <View style={styles.headerText}>
                  <Text style={styles.reportId}>Report #{id.slice(-8)}</Text>
                  <View style={styles.dateRow}>
                    <Calendar color="#666" size={14} />
                    <Text style={styles.dateText}>
                      {new Date(report.dateGenerated).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <TrendingUp color="#4CAF50" size={20} />
                  <Text style={styles.statValue}>{report.mealsServed}</Text>
                  <Text style={styles.statLabel}>Meals Served</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{report.shortages}</Text>
                  <Text style={styles.statLabel}>Shortages</Text>
                </View>

                <View style={styles.statItem}>
                  <DollarSign color="#4CAF50" size={20} />
                  <Text style={styles.statValue}>${report.donationsReceived}</Text>
                  <Text style={styles.statLabel}>Donations</Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Feedback Summary</Text>
                <Text style={styles.summaryText}>{report.feedbackSummary}</Text>
              </View>
            </View>
          ))}

        {Object.keys(reports).length === 0 && (
          <View style={styles.emptyState}>
            <FileText color="#ccc" size={64} />
            <Text style={styles.emptyText}>No reports generated yet</Text>
            <Text style={styles.emptySubtext}>Reports will appear here once generated</Text>
          </View>
        )}
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
  liveStatsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  periodStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
  },
  periodStatItem: {
    alignItems: 'center',
  },
  periodValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#007AFF',
  },
  periodLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#007AFF',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    flex: 1,
  },
  reportId: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#bbb',
    marginTop: 8,
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