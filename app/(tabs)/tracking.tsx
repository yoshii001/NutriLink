import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { addStudentMeal } from '@/services/firebase/mealTrackingService';
import { Camera, Check } from 'lucide-react-native';

export default function TrackingScreen() {
  const { user, userData } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!userData || userData.role !== 'teacher') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  const handleTrackMeal = async (mealServed: boolean) => {
    if (!studentName.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addStudentMeal(today, user!.uid, {
        name: studentName,
        mealServed,
        time: new Date().toISOString(),
        photoUrl: photoUrl || null,
      });

      Alert.alert('Success', `Meal ${mealServed ? 'served' : 'not served'} recorded for ${studentName}`);
      setStudentName('');
      setPhotoUrl('');
    } catch (error) {
      Alert.alert('Error', 'Failed to track meal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Track Student Meal</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Student Name</Text>
          <TextInput
            style={styles.input}
            value={studentName}
            onChangeText={setStudentName}
            placeholder="Enter student name"
            editable={!loading}
          />

          <Text style={styles.label}>Photo URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={photoUrl}
            onChangeText={setPhotoUrl}
            placeholder="Enter photo URL"
            editable={!loading}
          />

          <TouchableOpacity style={styles.cameraButton} disabled={loading}>
            <Camera color="#007AFF" size={24} />
            <Text style={styles.cameraButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.successButton, loading && styles.buttonDisabled]}
              onPress={() => handleTrackMeal(true)}
              disabled={loading}
            >
              <Check color="#fff" size={20} />
              <Text style={styles.buttonText}>Meal Served</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton, loading && styles.buttonDisabled]}
              onPress={() => handleTrackMeal(false)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Not Served</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  cameraButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#F44336',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
});