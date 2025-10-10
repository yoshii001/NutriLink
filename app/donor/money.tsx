import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { createMoneyDonation, getMoneyDonationById, updateMoneyDonation } from '@/services/firebase/moneyDonationService';
import { theme } from '@/constants/theme';

/**
 * MoneyDonationScreen
 * - Separate form for donors who want to publish a monetary donation (e.g., pledges or funds available)
 * - Saves data into a separate `moneyDonations` collection to keep DB areas independent.
 */
export default function MoneyDonationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    availableFrom: new Date().toISOString().split('T')[0],
  });

  const validate = (): boolean => {
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid donation amount');
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!user || !userData) {
      Alert.alert('Error', 'You must be logged in to publish donations');
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const payload: any = {
        donorId: user.uid,
        donorName: userData.name,
        donorEmail: userData.email,
        amount: parseFloat(formData.amount),
        note: formData.note,
        availableFrom: formData.availableFrom,
      };

      if (editingId) {
        await updateMoneyDonation(editingId, payload);
        Alert.alert('Success', 'Monetary donation updated!', [
          { text: 'OK', onPress: () => router.push('/public-donations') },
        ]);
      } else {
        const id = await createMoneyDonation(payload);
        Alert.alert('Success', 'Monetary donation published!', [
          { text: 'OK', onPress: () => router.push('/public-donations') },
        ]);
      }
    } catch (error) {
      console.error('Error publishing money donation:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to publish: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const editId = (params as any)?.editId as string | undefined;
    if (editId) {
      (async () => {
        try {
          setLoading(true);
          const existing = await getMoneyDonationById(editId);
          if (existing) {
            setFormData({
              amount: String(existing.amount ?? ''),
              note: existing.note || '',
              availableFrom: existing.availableFrom || new Date().toISOString().split('T')[0],
            });
            setEditingId(editId);
          }
        } catch (err) {
          console.error('Failed to load money donation for edit', err);
        } finally {
          setLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color={theme.colors.primary} strokeWidth={2} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <DollarSign size={48} color={theme.colors.surface} strokeWidth={2} />
          <Text style={styles.headerTitle}>Publish Monetary Donation</Text>
          <Text style={styles.headerSubtitle}>Offer funds or pledges to schools</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (USD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.amount}
              onChangeText={(t) => setFormData({ ...formData, amount: t })}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note or instructions"
              value={formData.note}
              onChangeText={(t) => setFormData({ ...formData, note: t })}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Available From</Text>
            <TextInput
              style={[styles.input, styles.inputWithIconText]}
              value={formData.availableFrom}
              onChangeText={(t) => setFormData({ ...formData, availableFrom: t })}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>{loading ? 'Publishing...' : 'Publish Monetary Donation'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: { backgroundColor: theme.colors.surface, paddingTop: 50, paddingBottom: 12, paddingHorizontal: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, ...theme.shadows.sm },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  backButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: theme.colors.primary },
  scrollContent: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.xl, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontFamily: 'Inter-Bold', color: theme.colors.surface, marginTop: theme.spacing.md },
  headerSubtitle: { fontSize: 14, fontFamily: 'Inter-Regular', color: theme.colors.surface, opacity: 0.9, marginTop: theme.spacing.xs },
  content: { padding: theme.spacing.xl },
  inputGroup: { marginBottom: theme.spacing.lg },
  label: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: 16, fontFamily: 'Inter-Regular', color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.border },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputWithIconText: { flex: 1, borderWidth: 0, paddingLeft: theme.spacing.sm },
  button: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginTop: theme.spacing.lg, ...theme.shadows.lg },
  buttonGradient: { paddingVertical: theme.spacing.md + 4, alignItems: 'center' },
  buttonText: { fontSize: 18, fontFamily: 'Inter-Bold', color: theme.colors.surface },
});
