import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getAllFeedback, submitFeedback } from '@/services/firebase/feedbackService';
import { Feedback } from '@/types';
import { MessageSquare, Send } from 'lucide-react-native';

export default function FeedbackScreen() {
  const { user, userData } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Record<string, Feedback>>({});
  const [newFeedback, setNewFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!userData || (userData.role !== 'parent' && userData.role !== 'admin')) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You don't have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  const loadFeedback = async () => {
    try {
      const data = await getAllFeedback();
      setFeedbackList(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedback();
    setRefreshing(false);
  };

  const handleSubmitFeedback = async () => {
    if (!newFeedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await submitFeedback(today, {
        parentId: user!.uid,
        feedback: newFeedback,
        mealDate: today,
        status: 'submitted',
      });

      Alert.alert('Success', 'Feedback submitted successfully');
      setNewFeedback('');
      await loadFeedback();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Feedback</Text>

        {userData?.role === 'parent' && (
          <View style={styles.submitCard}>
            <Text style={styles.submitTitle}>Submit Feedback</Text>
            <TextInput
              style={styles.textarea}
              value={newFeedback}
              onChangeText={setNewFeedback}
              placeholder="Share your thoughts about today's meal..."
              multiline
              numberOfLines={4}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmitFeedback}
              disabled={loading}
            >
              <Send color="#fff" size={20} />
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent Feedback</Text>

        {Object.entries(feedbackList)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
          .map(([date, feedback]) => (
            <View key={date} style={styles.card}>
              <View style={styles.cardHeader}>
                <MessageSquare color="#007AFF" size={20} />
                <Text style={styles.dateText}>{date}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        feedback.status === 'reviewed' ? '#E8F5E9' : '#FFF3E0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: feedback.status === 'reviewed' ? '#4CAF50' : '#F57C00',
                      },
                    ]}
                  >
                    {feedback.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.feedbackText}>{feedback.feedback}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Meal Date: {feedback.mealDate}</Text>
              </View>
            </View>
          ))}

        {Object.keys(feedbackList).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No feedback submitted yet</Text>
          </View>
        )}
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
    marginBottom: 16,
  },
  submitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  submitTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
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