import React, { useState, useEffect } from 'react';
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
import { getSchoolByPrincipalId } from '@/services/firebase/schoolService';
import { getTeachersBySchoolId } from '@/services/firebase/teacherService';
import { getMealPlansBySchoolId } from '@/services/firebase/mealPlanService';
import { getDonationsBySchoolId } from '@/services/firebase/donationService';
import { getDonationRequestsBySchoolId } from '@/services/firebase/donationRequestService';
import {
  School,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  ChevronRight,
} from 'lucide-react-native';

export default function PrincipalDashboardScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');
  const [stats, setStats] = useState({
    teachers: 0,
    mealPlans: 0,
    donations: 0,
    activeRequests: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [hasSchool, setHasSchool] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const schoolData = await getSchoolByPrincipalId(user.uid);

      if (!schoolData) {
        setHasSchool(false);
        return;
      }

      setHasSchool(true);
      setSchoolId(schoolData.id);
      setSchoolName(schoolData.school.name);

      const [teachers, mealPlans, donations, requests] = await Promise.all([
        getTeachersBySchoolId(schoolData.id),
        getMealPlansBySchoolId(schoolData.id),
        getDonationsBySchoolId(schoolData.id),
        getDonationRequestsBySchoolId(schoolData.id),
      ]);

      const activeRequests = Object.values(requests).filter((r) => r.status === 'active').length;
      const totalDonations = Object.values(donations).reduce((sum, d) => sum + d.amount, 0);

      setStats({
        teachers: Object.keys(teachers).length,
        mealPlans: Object.keys(mealPlans).length,
        donations: totalDonations,
        activeRequests,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!hasSchool) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Principal Dashboard</Text>
        </View>

        <View style={styles.noSchoolContainer}>
          <School color="#007AFF" size={64} />
          <Text style={styles.noSchoolTitle}>No School Registered</Text>
          <Text style={styles.noSchoolText}>
            You need to request school addition before you can access principal features.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/principal/request-school')}
          >
            <Text style={styles.primaryButtonText}>Request School Addition</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Principal Dashboard</Text>
          <Text style={styles.schoolName}>{schoolName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Users color="#1976D2" size={32} />
            <Text style={styles.statValue}>{stats.teachers}</Text>
            <Text style={styles.statLabel}>Teachers</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <Calendar color="#7B1FA2" size={32} />
            <Text style={styles.statValue}>{stats.mealPlans}</Text>
            <Text style={styles.statLabel}>Meal Plans</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <DollarSign color="#388E3C" size={32} />
            <Text style={styles.statValue}>${stats.donations}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <FileText color="#F57C00" size={32} />
            <Text style={styles.statValue}>{stats.activeRequests}</Text>
            <Text style={styles.statLabel}>Active Requests</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/principal/manage-teachers')}
          >
            <View style={styles.actionIcon}>
              <Users color="#007AFF" size={24} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Manage Teachers</Text>
              <Text style={styles.actionDescription}>Add and manage school teachers</Text>
            </View>
            <ChevronRight color="#999" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/principal/meal-plans')}
          >
            <View style={styles.actionIcon}>
              <Calendar color="#34C759" size={24} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Meal Plans</Text>
              <Text style={styles.actionDescription}>Create and approve meal plans</Text>
            </View>
            <ChevronRight color="#999" size={24} />
          </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/principal/donor-list')}>
            <View style={styles.actionIcon}>
              <DollarSign color="#FF9500" size={24} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>View Donors</Text>
              <Text style={styles.actionDescription}>Track donation impact</Text>
            </View>
            <ChevronRight color="#999" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/principal/request-donation')}
          >
            <View style={styles.actionIcon}>
              <Plus color="#FF3B30" size={24} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Request Donations</Text>
              <Text style={styles.actionDescription}>Create donation requests</Text>
            </View>
            <ChevronRight color="#999" size={24} />
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  schoolName: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  noSchoolContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noSchoolTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  noSchoolText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
});
