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
import { Package, MapPin, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { createPublishedDonation, getPublishedDonationById, updatePublishedDonation } from '@/services/firebase/publishedDonationService';
import { theme } from '@/constants/theme';

export default function FoodDonationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    quantity: '',
    unit: '',
    availableFrom: new Date().toISOString().split('T')[0],
    expiryDate: '',
    deliveryOptions: [] as string[],
    location: '',
  });

  const deliveryOptionsList = ['Pickup', 'Delivery', 'Shipping'];

  const toggleDeliveryOption = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      deliveryOptions: prev.deliveryOptions.includes(option)
        ? prev.deliveryOptions.filter((o) => o !== option)
        : [...prev.deliveryOptions, option],
    }));
  };

  useEffect(() => {
    const editId = (params as any)?.editId as string | undefined;
    if (editId) {
      (async () => {
        try {
          setLoading(true);
          const existing = await getPublishedDonationById(editId);
          if (existing) {
            setFormData({
              itemName: existing.itemName || '',
              description: existing.description || '',
              quantity: String(existing.quantity ?? ''),
              unit: existing.unit || '',
              availableFrom: existing.availableFrom ? existing.availableFrom.split('T')[0] : new Date().toISOString().split('T')[0],
              expiryDate: existing.expiryDate || '',
              deliveryOptions: existing.deliveryOptions || [],
              location: existing.location || '',
            });
            setEditingId(editId);
          }
        } catch (err) {
          console.error('Failed to load donation for edit', err);
        } finally {
          setLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handlePublish = async () => {
    if (!user || !userData) {
      Alert.alert('Error', 'You must be logged in to publish donations');
      return;
    }

    if (!formData.itemName || !formData.quantity || !formData.unit || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.deliveryOptions.length === 0) {
      Alert.alert('Error', 'Please select at least one delivery option');
      return;
    }

    setLoading(true);
    try {
      const donationData: any = {
        donorId: user.uid,
        donorName: userData.name,
        donorEmail: userData.email,
        itemName: formData.itemName,
        description: formData.description,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        category: 'food',
        availableFrom: formData.availableFrom,
        deliveryOptions: formData.deliveryOptions,
      };

      if (formData.expiryDate) donationData.expiryDate = formData.expiryDate;
      if (formData.location) donationData.location = formData.location;

      if (editingId) {
        await updatePublishedDonation(editingId, donationData);
        Alert.alert('Success', 'Food donation updated!', [
          { text: 'OK', onPress: () => router.push('/public-donations') },
        ]);
      } else {
        await createPublishedDonation(donationData);
        Alert.alert('Success', 'Food donation published!', [
          { text: 'OK', onPress: () => router.push('/public-donations') },
        ]);
      }
    } catch (error) {
      console.error('Error publishing/updating food donation:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save donation: ${message}`);
    } finally {
      setLoading(false);
    }
  };

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
          <Package size={48} color={theme.colors.surface} strokeWidth={2} />
          <Text style={styles.headerTitle}>Publish Food Donation</Text>
          <Text style={styles.headerSubtitle}>Share food items to help schools</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Rice"
              value={formData.itemName}
              onChangeText={(t) => setFormData({ ...formData, itemName: t })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.quantity}
                onChangeText={(t) => setFormData({ ...formData, quantity: t })}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Unit *</Text>
              <TextInput
                style={styles.input}
                placeholder="kg, pcs"
                value={formData.unit}
                onChangeText={(t) => setFormData({ ...formData, unit: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the food items"
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color={theme.colors.text.light} />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                placeholder="City, State"
                value={formData.location}
                onChangeText={(t) => setFormData({ ...formData, location: t })}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Available From *</Text>
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={formData.availableFrom}
                onChangeText={(t) => setFormData({ ...formData, availableFrom: t })}
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={formData.expiryDate}
                onChangeText={(t) => setFormData({ ...formData, expiryDate: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Options *</Text>
            <View style={styles.checkboxContainer}>
              {deliveryOptionsList.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.checkboxRow}
                  onPress={() => toggleDeliveryOption(option)}
                >
                  <View style={[styles.checkbox, formData.deliveryOptions.includes(option) && styles.checkboxChecked]}>
                    {formData.deliveryOptions.includes(option) && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>{loading ? (editingId ? 'Saving...' : 'Publishing...') : (editingId ? 'Save Changes' : 'Publish Food Donation')}</Text>
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
  row: { flexDirection: 'row', gap: theme.spacing.md },
  flex1: { flex: 1 },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, paddingLeft: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  inputWithIconText: { flex: 1, borderWidth: 0, paddingLeft: theme.spacing.sm },
  checkboxContainer: { gap: theme.spacing.sm },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm },
  checkbox: { width: 24, height: 24, borderRadius: theme.borderRadius.sm, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.sm },
  checkboxChecked: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` },
  checkboxInner: { width: 12, height: 12, borderRadius: 2, backgroundColor: theme.colors.primary },
  checkboxLabel: { fontSize: 16, fontFamily: 'Inter-Regular', color: theme.colors.text.primary },
  button: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginTop: theme.spacing.lg, ...theme.shadows.lg },
  buttonGradient: { paddingVertical: theme.spacing.md + 4, alignItems: 'center' },
  buttonText: { fontSize: 18, fontFamily: 'Inter-Bold', color: theme.colors.surface },
});

