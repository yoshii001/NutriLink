import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Package, Users, Bell } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function DonorInfoScreen() {
  const router = useRouter();

  const features = [
    {
      icon: Package,
      title: 'Publish Donations',
      description: 'Share what you can donate - food, supplies, or monetary support',
    },
    {
      icon: Bell,
      title: 'Receive Requests',
      description: 'Get notified when schools need your specific donations',
    },
    {
      icon: Users,
      title: 'Community Impact',
      description: 'See other donors and the collective impact we make together',
    },
    {
      icon: Heart,
      title: 'Track History',
      description: 'View your donation history and the meals you helped provide',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.iconCircle}>
          <Heart size={60} color={theme.colors.surface} strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Welcome, Donor!</Text>
        <Text style={styles.headerSubtitle}>
          Thank you for joining our mission to feed children in need
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>How It Works</Text>
          <Text style={styles.cardText}>
            1. Publish what you can donate to the system{'\n'}
            2. School principals browse available donations{'\n'}
            3. Receive requests from schools when they need your donation{'\n'}
            4. Accept requests and help feed children
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What You Can Do</Text>

        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <IconComponent size={32} color={theme.colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.importantCard}>
          <Text style={styles.importantTitle}>Important to Know</Text>
          <Text style={styles.importantText}>
            • You can publish unlimited donations{'\n'}
            • Principals request donations 1+ days before they need them{'\n'}
            • You can choose which requests to accept{'\n'}
            • Track all your contributions in one place
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/dashboard')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  content: {
    padding: theme.spacing.xl,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  cardText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  featureCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...theme.shadows.sm,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  importantCard: {
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  importantTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  importantText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  button: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md + 4,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
  },
});
