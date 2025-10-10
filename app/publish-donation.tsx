import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, ArrowLeft, Home, History } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function PublishDonationScreen() {
  const router = useRouter();

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

      <ScrollView style={styles.scrollContent}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Package size={48} color={theme.colors.surface} strokeWidth={2} />
          <Text style={styles.headerTitle}>Publish Donation</Text>
          <Text style={styles.headerSubtitle}>Choose a donation type to publish</Text>

          <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
            <TouchableOpacity
              style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}
              onPress={() => router.push('/donor/food')}
            >
              <Text style={{ fontFamily: 'Inter-SemiBold', color: theme.colors.primary }}>Food Donation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 8 }}
              onPress={() => router.push('/donor/money')}
            >
              <Text style={{ fontFamily: 'Inter-SemiBold', color: theme.colors.primary }}>Money Donation</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={{ fontFamily: 'Inter-SemiBold', color: theme.colors.text.secondary }}>
              Use the buttons above to publish Food or Money donations.
            </Text>
          </View>
        </View>
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
          onPress={() => router.push('/my-donations')}
          activeOpacity={0.7}
        >
          <History size={24} color={theme.colors.text.secondary} strokeWidth={2} />
          <Text style={styles.navButtonText}>My Donations</Text>
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
  scrollContent: {
    flex: 1,
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
  content: {
    padding: theme.spacing.xl,
  },
});
