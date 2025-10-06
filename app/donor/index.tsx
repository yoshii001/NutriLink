import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function DonorIndex() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donor Area</Text>
      <Text style={styles.subtitle}>Pages for donors will live here.</Text>
      <TouchableOpacity onPress={() => router.push('/')} style={styles.button}>
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
