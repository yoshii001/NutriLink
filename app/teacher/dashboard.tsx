import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherDashboard() {
  const router = useRouter();
  const { userData, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login' as any);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.title}>Teacher Dashboard</Text>
            <Text style={styles.subtitle}>Welcome, {userData?.name || 'Teacher'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ padding: 6 }}>
            <Text style={{ color: theme.colors.surface, fontFamily: 'Inter-SemiBold' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Dashboard Cards */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/teacher/students' as any)}>
          <Ionicons name="people-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Manage Students</Text>
          <Text style={styles.cardDesc}>Add or view student profiles and QR codes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/teacher/attendance' as any)}>
          <Ionicons name="checkmark-done-circle-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Mark Attendance & Feedback</Text>
          <Text style={styles.cardDesc}>Track daily attendance and give feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/teacher/reports' as any)}>
          <Ionicons name="bar-chart-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Monthly Reports</Text>
          <Text style={styles.cardDesc}>View performance and attendance summaries</Text>
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
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: theme.spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.surface,
    marginTop: 6,
    opacity: 0.9,
  },
  actions: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    marginTop: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
});
