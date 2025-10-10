import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Utensils, ArrowLeft, School, Heart } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

type UserType = 'principal' | 'donor';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('principal');
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim(), userType);
      
      const successMessage = userType === 'principal' 
        ? 'Your principal account has been created successfully. You can now request to add your school.'
        : 'Your donor account has been created successfully. You can now start supporting schools in need.';
      
      // Immediately navigate to the login screen so the user can sign in.
      router.replace('/login');

      // Also show a confirmation alert that the account was created.
      // (No navigation in the alert callback to avoid platform inconsistencies.)
      Alert.alert('Success!', successMessage);
    } catch (error: any) {
      let errorMessage = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeInfo = (type: UserType) => {
    if (type === 'principal') {
      return {
        title: 'Principal Account',
        description: 'Manage your school\'s nutrition program',
        benefits: [
          'Request to add your school to the platform',
          'Create and manage meal plans for your school',
          'Request donations for your nutrition programs',
          'Manage teachers and track meal distributions',
          'View reports and analytics'
        ]
      };
    } else {
      return {
        title: 'Donor Account',
        description: 'Support schools and their nutrition programs',
        benefits: [
          'Browse donation requests from schools',
          'Make monetary donations to support meal programs',
          'Track your donation history and impact',
          'Connect with schools in your community',
          'Receive updates on how your donations help'
        ]
      };
    }
  };

  const currentUserTypeInfo = getUserTypeInfo(userType);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
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
              <Utensils color="#fff" size={40} />
            </View>
          )}
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Join NutriLink to make a difference in school nutrition</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* User Type Selection */}
          <View style={styles.userTypeSection}>
            <Text style={styles.sectionTitle}>I am a...</Text>
            <View style={styles.userTypeOptions}>
              <TouchableOpacity
                style={[
                  styles.userTypeOption,
                  userType === 'principal' && styles.userTypeOptionSelected
                ]}
                onPress={() => setUserType('principal')}
              >
                <School 
                  color={userType === 'principal' ? '#fff' : theme.colors.primary} 
                  size={24} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'principal' && styles.userTypeTextSelected
                ]}>
                  School Principal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeOption,
                  userType === 'donor' && styles.userTypeOptionSelected
                ]}
                onPress={() => setUserType('donor')}
              >
                <Heart 
                  color={userType === 'donor' ? '#fff' : theme.colors.primary} 
                  size={24} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'donor' && styles.userTypeTextSelected
                ]}>
                  Donor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <User size={20} color={theme.colors.text.secondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.text.light}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Mail size={20} color={theme.colors.text.secondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
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
              placeholder="Password (min 6 characters)"
              placeholderTextColor={theme.colors.text.light}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Lock size={20} color={theme.colors.text.secondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={theme.colors.text.light}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
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
                {loading ? 'Creating Account...' : `Create ${currentUserTypeInfo.title}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{currentUserTypeInfo.title} Benefits</Text>
          <Text style={styles.infoDescription}>{currentUserTypeInfo.description}</Text>
          <View style={styles.benefitsList}>
            {currentUserTypeInfo.benefits.map((benefit, index) => (
              <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
            ))}
          </View>
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.lg,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.md,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  form: {
    marginTop: theme.spacing.xl,
  },
  userTypeSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  userTypeOptions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  userTypeOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userTypeOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  userTypeTextSelected: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  button: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: theme.spacing.xl * 2,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  benefitsList: {
    gap: theme.spacing.sm,
  },
  benefitItem: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl * 2,
    gap: theme.spacing.sm,
  },
  loginText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  loginLink: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});