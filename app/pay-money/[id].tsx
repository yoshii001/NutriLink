import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, DollarSign } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getMoneyDonationById } from '@/services/firebase/moneyDonationService';
import { processDonationPayment, createPaymentIntent } from '@/services/stripeService';
import mockPaymentService from '@/services/mockPaymentService';
import { CardField, useStripe } from '@/services/stripeClient';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { STRIPE_CONFIG } from '@/config/stripe';

export default function PayMoneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = (params.id as string) || '';
  const { user, userData } = useAuth();

  const [donation, setDonation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false); // mock acceptance
  const { confirmPayment } = useStripe();
  // Card details via CardField
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const isExpoGo = (Constants?.appOwnership === 'expo' || Constants?.appOwnership === 'expo-go');

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const d = await getMoneyDonationById(id);
        setDonation(d);
        // MOCK: simulate principal acceptance after short delay
        setTimeout(() => setIsAccepted(true), 600);
      } catch (err) {
        console.error('Error loading money donation:', err);
        Alert.alert('Error', 'Failed to load donation details');
      }
    })();
    // Initialize stripeReady for native builds only. Expo Go doesn't ship native stripe,
    // so keep stripeReady false there to avoid calling confirmPayment.
    if (!isExpoGo) {
      const t = setTimeout(() => setStripeReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [id]);

  // Card validation is handled by Stripe CardField and SDK

  const handlePayNow = async () => {
    if (!donation) return;
    if (!user || !userData) {
      Alert.alert('Error', 'Please log in to make a payment');
      return;
    }
    if (!isAccepted) {
      Alert.alert('Info', 'Donation not yet accepted by principal (mock)');
      return;
    }
    // Ensure card details collected via CardField
    if (!cardDetails?.complete) {
      Alert.alert('Invalid card', 'Please enter complete card details');
      return;
    }

    if (!stripeReady && isExpoGo && !STRIPE_CONFIG.BACKEND_URL) {
      // Expo Go + no backend: auto-simulate the payment silently (no popups)
        try {
          const paymentData = {
            amount: donation.amount,
            donorId: user.uid,
            donorName: userData.name,
            donorEmail: userData.email,
            donorMessage: `Simulated payment for money donation ${id}`,
            mealContribution: 0,
          } as any;
          const donationRecordId = await processDonationPayment(paymentData);
          await mockPaymentService.savePaymentRecord({ donationId: id, donorId: user.uid, amount: donation.amount, status: 'succeeded', details: { simulated: true, donationRecordId } });
          // Show success popup then navigate to My Donations
          Alert.alert('Payment successful', 'Your payment was recorded.', [{ text: 'OK', onPress: () => router.push('/my-donations') }]);
        } catch (err) {
          console.error('Simulation error', err);
          // Navigate to My Donations so the donor can inspect logs; show an error popup
          Alert.alert('Payment failed', String(err), [{ text: 'OK', onPress: () => router.push('/my-donations') }]);
        }
      return;
    }

    setLoading(true);
    try {
      // Prefer Checkout if backend exists
      if (STRIPE_CONFIG.BACKEND_URL) {
        try {
          const resp = await fetch(`${STRIPE_CONFIG.BACKEND_URL.replace(/\/$/, '')}/create-checkout-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(donation.amount * 100), currency: STRIPE_CONFIG.currency, metadata: { donationId: id, donorId: user.uid } }),
          });
          if (resp.ok) {
            const data = await resp.json().catch(() => ({}));
            const url = data.url || data.checkoutUrl || data.checkout_url;
            if (url) {
              await mockPaymentService.savePaymentRecord({ donationId: id, donorId: user.uid, amount: donation.amount, status: 'pending', details: { method: 'checkout', sessionId: data.id || null } });
              await WebBrowser.openBrowserAsync(url as string);
              // Opened Checkout in browser; user will complete payment there. Navigate to My Donations silently.
              router.push('/my-donations');
              return;
            }
          }
        } catch (err) {
          console.warn('[pay-money] create-checkout-session failed', err);
          // If backend Checkout fails and native SDK is available, we'll attempt a PaymentIntent fallback.
          if (isExpoGo) {
            // On Expo Go, avoid native fallback; offer simulation instead.
            // Auto-simulate silently when Checkout can't be opened in Expo Go.
            try {
              const paymentData = {
                amount: donation.amount,
                donorId: user.uid,
                donorName: userData.name,
                donorEmail: userData.email,
                donorMessage: `Simulated payment for money donation ${id}`,
                mealContribution: 0,
              } as any;
              const donationRecordId = await processDonationPayment(paymentData);
              await mockPaymentService.savePaymentRecord({ donationId: id, donorId: user.uid, amount: donation.amount, status: 'succeeded', details: { simulated: true, donationRecordId } });
            } catch (err) {
              console.error('Simulation error', err);
            }
            setLoading(false);
            router.push('/my-donations');
            return;
          }
        }
      }

      // Fallback: create PaymentIntent on backend or mocked in testMode
      const pi = await createPaymentIntent(donation.amount * 100, { donationId: id, donorId: user.uid });

      console.log('[pay-money] received clientSecret', pi.clientSecret, 'id', pi.paymentIntentId);

      // Confirm payment with native Stripe SDK
      if (!stripeReady) {
        throw new Error('Native Stripe SDK not ready in this environment');
      }

      const { error, paymentIntent } = await confirmPayment(pi.clientSecret, { paymentMethodType: 'Card', paymentMethodData: { billingDetails: { name: userData.name, email: userData.email } } } as any);

      if (error) {
        console.error('Stripe confirmPayment error', error);
        throw new Error(error.message || 'Payment confirmation failed');
      }

      console.log('Stripe paymentIntent', paymentIntent);

      // After successful payment, save donation record
      // For money donations we do NOT set donationRequestId — that's used for
      // donation requests (food items). Passing the money-donation id here caused
      // updateFulfilledAmount to attempt updating a non-existent donation request.
      const paymentData = {
        amount: donation.amount,
        donorId: user.uid,
        donorName: userData.name,
        donorEmail: userData.email,
        donorMessage: `Payment for money donation ${id}`,
        mealContribution: 0,
      } as any;

      const donationRecordId = await processDonationPayment(paymentData);

  await mockPaymentService.savePaymentRecord({ donationId: id, donorId: user.uid, amount: donation.amount, status: 'succeeded', details: { donationRecordId, paymentIntentId: paymentIntent?.id } });
  Alert.alert('Payment successful', 'Your payment was completed successfully.', [{ text: 'OK', onPress: () => router.push('/my-donations') }]);
    } catch (err: any) {
      console.error('Payment error', err);
      await mockPaymentService.savePaymentRecord({ donationId: id, donorId: user?.uid, amount: donation.amount || 0, status: 'failed', details: { error: err?.message || String(err) } });
      // Navigate to My Donations so the donor can inspect the failed payment log (no popup).
      router.push('/my-donations');
    } finally {
      setLoading(false);
    }
  };

  if (!donation) return <View style={styles.container}><Text style={{ padding: 20 }}>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.accent]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <DollarSign size={48} color={theme.colors.surface} />
          <Text style={styles.headerTitle}>Pay Monetary Donation</Text>
          <Text style={styles.headerSubtitle}>Complete payment for accepted donation (mock)</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>${donation.amount.toFixed(2)}</Text>

          <Text style={styles.label}>Note</Text>
          <Text style={styles.note}>{donation.note || '—'}</Text>

          <Text style={styles.label}>Donor</Text>
          <Text style={styles.note}>{donation.donorName}</Text>

          <View style={{ marginTop: 16 }}>
            <Text style={[styles.label, { marginBottom: 8 }]}>Principal acceptance</Text>
            <Text style={{ color: isAccepted ? theme.colors.success : theme.colors.text.secondary }}>
              {isAccepted ? 'Accepted by principal (mock)' : 'Waiting for principal (mock) — simulated'}
            </Text>
          </View>

          {isAccepted && (
            <>
              <View style={{ marginTop: 16 }}>
                <Text style={styles.label}>Card Details</Text>
                    <CardField
                      postalCodeEnabled={false}
                      placeholders={{ number: '4242 4242 4242 4242' }}
                      cardStyle={{ backgroundColor: theme.colors.background, textColor: theme.colors.text.primary }}
                      style={{ height: 50, marginTop: 8 }}
                      onCardChange={(details) => setCardDetails(details)}
                    />
              </View>

              <TouchableOpacity disabled={loading} style={styles.payButton} onPress={handlePayNow} activeOpacity={0.8}>
                <LinearGradient colors={[theme.colors.primary, theme.colors.accent]} style={styles.payGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.payText}>{loading ? 'Processing...' : 'Pay Now'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: { backgroundColor: theme.colors.surface, paddingTop: 50, paddingBottom: 12, paddingHorizontal: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, ...theme.shadows.sm },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  backButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: theme.colors.primary, marginLeft: 8 },
  content: { flex: 1 },
  header: { paddingTop: 40, paddingBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.lg, alignItems: 'center' },
  headerTitle: { fontSize: 20, color: theme.colors.surface, fontFamily: 'Inter-Bold', marginTop: theme.spacing.sm },
  headerSubtitle: { fontSize: 13, color: theme.colors.surface, opacity: 0.9 },
  card: { margin: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, ...theme.shadows.md },
  label: { fontFamily: 'Inter-SemiBold', color: theme.colors.text.primary, marginTop: 8 },
  amount: { fontSize: 28, fontFamily: 'Inter-Bold', color: theme.colors.primary, marginTop: 6 },
  note: { color: theme.colors.text.secondary, marginTop: 4 },
  // input style removed; card entry uses Stripe CardField
  payButton: { marginTop: 18, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  payGradient: { paddingVertical: theme.spacing.md, alignItems: 'center' },
  payText: { color: theme.colors.surface, fontFamily: 'Inter-Bold', fontSize: 16 },

});
