import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { user, userData, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  useEffect(() => {
    checkOnboarding();

    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const checkOnboarding = async () => {
    const seen = await AsyncStorage.getItem('hasSeenOnboarding');
    setHasSeenOnboarding(seen === 'true');
  };

  if (loading || hasSeenOnboarding === null || minLoadingTime) {
    return <LoadingScreen />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (user && userData) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/login" />;
}