import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolByPrincipalId } from '@/services/firebase/schoolService';
import {
  getTeachersBySchoolId,
  addTeacher,
  updateTeacher,
  deactivateTeacher,
  activateTeacher,
} from '@/services/firebase/teacherService';
import { Teacher } from '@/types';
import { ArrowLeft, Plus, CreditCard as Edit2, UserX, UserCheck } from 'lucide-react-native';

export default function ManageTeachersScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      const schoolData = await getSchoolByPrincipalId(user.uid);

      if (!schoolData) {
        Alert.alert('No School', 'You need to request school addition first.');
        return;
      }

      setSchoolId(schoolData.id);
      const teachersData = await getTeachersBySchoolId(schoolData.id);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = () => {
    setEditingTeacherId(null);
    setFormData({ name: '', email: '' });
    setModalVisible(true);
  };

  const handleEditTeacher = (teacherId: string, teacher: Teacher) => {
    setEditingTeacherId(teacherId);
    setFormData({ name: teacher.name, email: teacher.email });
    setModalVisible(true);
  };

  const handleSaveTeacher = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!schoolId || !user || !userData) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    try {
      if (editingTeacherId) {
        await updateTeacher(editingTeacherId, formData);
        Alert.alert('Success', 'Teacher updated successfully');
      } else {
        await addTeacher({
          ...formData,
          schoolId,
          addedBy: user.uid,
          isActive: true,
        });
        Alert.alert('Success', 'Teacher added successfully');
      }

      setModalVisible(false);
      await loadData();
    } catch (error) {
      console.error('Error saving teacher:', error);
      Alert.alert('Error', 'Failed to save teacher');
    }
  };

  const handleToggleActive = async (teacherId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateTeacher(teacherId);
        Alert.alert('Success', 'Teacher deactivated');
      } else {
        await activateTeacher(teacherId);
        Alert.alert('Success', 'Teacher activated');
      }

      await loadData();
    } catch (error) {
      console.error('Error toggling teacher status:', error);
      Alert.alert('Error', 'Failed to update teacher status');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#007AFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Teachers</Text>
        <TouchableOpacity onPress={handleAddTeacher} style={styles.addButton}>
          <Plus color="#007AFF" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(teachers).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No teachers added yet</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddTeacher}>
              <Text style={styles.emptyButtonText}>Add First Teacher</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(teachers).map(([id, teacher]) => (
            <View key={id} style={styles.teacherCard}>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{teacher.name}</Text>
                <Text style={styles.teacherEmail}>{teacher.email}</Text>
                <Text style={[styles.teacherStatus, teacher.isActive ? styles.activeStatus : styles.inactiveStatus]}>
                  {teacher.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.teacherActions}>
                <TouchableOpacity
                  onPress={() => handleEditTeacher(id, teacher)}
                  style={styles.actionButton}
                >
                  <Edit2 color="#007AFF" size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleToggleActive(id, teacher.isActive)}
                  style={styles.actionButton}
                >
                  {teacher.isActive ? (
                    <UserX color="#FF3B30" size={20} />
                  ) : (
                    <UserCheck color="#34C759" size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTeacherId ? 'Edit Teacher' : 'Add Teacher'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Teacher name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveTeacher}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  teacherCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  teacherStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  activeStatus: {
    backgroundColor: '#D1F2EB',
    color: '#0C7C59',
  },
  inactiveStatus: {
    backgroundColor: '#FFE5E5',
    color: '#C70000',
  },
  teacherActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
