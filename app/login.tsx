import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Utensils } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          {!imageError ? (
            <Image
              source={{ uri: 'https://i.ibb.co/mPdLyjQ/Green-Orange-Illustrative-Kids-Meal-Logo-1-modified-1.png' }}
              style={styles.logo}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.logoCircle}>
              <Utensils size={56} color={theme.colors.surface} strokeWidth={2} />
            </View>
          )}
          <Text style={styles.title}>Kids Feed</Text>
          <Text style={styles.subtitle}>Nourishing Young Minds</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formCard}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.welcomeSubtext}>Sign in to continue</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail size={20} color={theme.colors.text.secondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.text.light}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock size={20} color={theme.colors.text.secondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.text.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.buttonGradient, loading && styles.buttonDisabled]}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.testCredentials}>
          <View style={styles.testHeader}>
            <View style={styles.testDivider} />
            <Text style={styles.testTitle}>Test Accounts</Text>
            <View style={styles.testDivider} />
          </View>

          <View style={styles.testGrid}>
            <View style={styles.testItem}>
              <View style={[styles.testBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.testBadgeText}>Admin</Text>
              </View>
              <Text style={styles.testText}>admin@gmail.com</Text>
            </View>

            <View style={styles.testItem}>
              <View style={[styles.testBadge, { backgroundColor: theme.colors.secondary }]}>
                <Text style={styles.testBadgeText}>Teacher</Text>
              </View>
              <Text style={styles.testText}>teacher1@gmail.com</Text>
            </View>

            <View style={styles.testItem}>
              <View style={[styles.testBadge, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.testBadgeText}>Principal</Text>
              </View>
              <Text style={styles.testText}>principle@gmail.com</Text>
            </View>

            <View style={styles.testItem}>
              <View style={[styles.testBadge, { backgroundColor: theme.colors.primaryDark }]}>
                <Text style={styles.testBadgeText}>Donor</Text>
              </View>
              <Text style={styles.testText}>donor1@gmail.com</Text>
            </View>

            <View style={styles.testItem}>
              <View style={[styles.testBadge, { backgroundColor: theme.colors.secondaryDark }]}>
                <Text style={styles.testBadgeText}>Parent</Text>
              </View>
              <Text style={styles.testText}>parent1@gmail.com</Text>
            </View>
          </View>

          <Text style={styles.testNote}>Use any password for testing</Text>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.md,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.surface,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
  },
  button: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  testCredentials: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  testDivider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  testTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
  },
  testGrid: {
    gap: theme.spacing.sm,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  testBadge: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  testBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.surface,
    textTransform: 'uppercase',
  },
  testText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
  },
  testNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.light,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});