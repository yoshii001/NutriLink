import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolByPrincipalId } from '@/services/firebase/schoolService';
import { createDonationRequest } from '@/services/firebase/donationRequestService';
import { getMealPlansBySchoolId } from '@/services/firebase/mealPlanService';
import { MealPlan } from '@/types';
import { ArrowLeft } from 'lucide-react-native';

export default function RequestDonationScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});

  const [formData, setFormData] = useState({
    requestedAmount: '',
    purpose: '',
    description: '',
    targetDate: '',
    mealPlanId: '',
  });

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    if (!user) return;

    try {
      const schoolData = await getSchoolByPrincipalId(user.uid);

      if (!schoolData) {
        Alert.alert('No School', 'You need to request school addition first.');
        return;
      }

      setSchoolId(schoolData.id);
      setSchoolName(schoolData.school.name);

      const plans = await getMealPlansBySchoolId(schoolData.id);
      setMealPlans(plans);
    } catch (error) {
      console.error('Error loading school data:', error);
      Alert.alert('Error', 'Failed to load school data');
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.requestedAmount ||
      !formData.purpose ||
      !formData.description ||
      !formData.targetDate
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!schoolId || !user || !userData) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    setLoading(true);

    try {
      await createDonationRequest({
        schoolId,
        schoolName,
        principalId: user.uid,
        principalName: userData.name,
        mealPlanId: formData.mealPlanId || undefined,
        requestedAmount: parseFloat(formData.requestedAmount),
        purpose: formData.purpose,
        description: formData.description,
        targetDate: formData.targetDate,
        status: 'active',
      });

      Alert.alert(
        'Success',
        'Donation request has been submitted. Donors can now see and contribute to your request.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting donation request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Donations</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Create a donation request to let donors know about your school's needs. Be specific about
          what you need and how the funds will be used.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purpose</Text>
            <TextInput
              style={styles.input}
              value={formData.purpose}
              onChangeText={(text) => setFormData({ ...formData, purpose: text })}
              placeholder="e.g., Weekly Breakfast Program"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Requested Amount ($)</Text>
            <TextInput
              style={styles.input}
              value={formData.requestedAmount}
              onChangeText={(text) => setFormData({ ...formData, requestedAmount: text })}
              placeholder="e.g., 500"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Date</Text>
            <TextInput
              style={styles.input}
              value={formData.targetDate}
              onChangeText={(text) => setFormData({ ...formData, targetDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe how the donation will be used, number of students to benefit, etc."
              multiline
              numberOfLines={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Link to Meal Plan (Optional)</Text>
            <View style={styles.mealPlanList}>
              <TouchableOpacity
                style={[
                  styles.mealPlanOption,
                  !formData.mealPlanId && styles.mealPlanOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, mealPlanId: '' })}
              >
                <Text style={styles.mealPlanText}>No specific meal plan</Text>
              </TouchableOpacity>

              {Object.entries(mealPlans).map(([id, plan]) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.mealPlanOption,
                    formData.mealPlanId === id && styles.mealPlanOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, mealPlanId: id })}
                >
                  <Text style={styles.mealPlanText}>
                    {plan.date} - {plan.menu[0]?.mealName || 'Meal Plan'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    padding: 16,
    backgroundColor: '#E8F5E9',
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mealPlanList: {
    gap: 8,
  },
  mealPlanOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  mealPlanOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  mealPlanText: {
    fontSize: 14,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
