import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllUsers,
  createUser,
  updateUserData,
  deleteUser,
} from '@/services/firebase/adminService';
import { getAllSchools } from '@/services/firebase/schoolService';
import { User, UserRole, School } from '@/types';
import { X, Plus, CreditCard as Edit2, Trash2, Users, ChevronLeft } from 'lucide-react-native';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { userData } = useAuth();
  const [users, setUsers] = useState<Record<string, User & { uid: string }>>({});
  const [schools, setSchools] = useState<Record<string, School>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<(User & { uid: string }) | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher' as UserRole,
    schoolId: '',
  });

  const loadData = async () => {
    try {
      const [usersData, schoolsData] = await Promise.all([
        getAllUsers(),
        getAllSchools(),
      ]);
      setUsers(usersData);
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenModal = (user?: User & { uid: string }) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        schoolId: user.schoolId || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'teacher',
        schoolId: '',
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!editingUser && !formData.password) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        await updateUserData(editingUser.uid, {
          name: formData.name,
          role: formData.role,
          ...(formData.schoolId && { schoolId: formData.schoolId }),
        });
        Alert.alert('Success', 'User updated successfully');
      } else {
        await createUser(
          formData.email,
          formData.password,
          formData.name,
          formData.role,
          formData.schoolId || undefined
        );
        Alert.alert('Success', 'User created successfully');
      }
      handleCloseModal();
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save user');
    }
  };

  const handleDelete = (uid: string, name: string) => {
    Alert.alert('Confirm Delete', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(uid);
            Alert.alert('Success', 'User deleted successfully');
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete user');
          }
        },
      },
    ]);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      admin: '#FF5722',
      principal: '#9C27B0',
      teacher: '#2196F3',
      donor: '#4CAF50',
      parent: '#FF9800',
    };
    return colors[role];
  };

  if (userData?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied: Admin Only</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>{Object.keys(users).length} users</Text>
        </View>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.entries(users).map(([uid, user]) => (
          <View key={uid} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{user.name}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: getRoleBadgeColor(user.role) },
                  ]}
                >
                  <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.schoolId && schools[user.schoolId] && (
                <Text style={styles.userSchool}>
                  School: {schools[user.schoolId].name}
                </Text>
              )}
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                onPress={() => handleOpenModal(user)}
                style={styles.iconButton}
              >
                <Edit2 color="#007AFF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(uid, user.name)}
                style={styles.iconButton}
              >
                <Trash2 color="#f44336" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter name"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!editingUser}
              />

              {!editingUser && (
                <>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                </>
              )}

              <Text style={styles.label}>Role *</Text>
              <View style={styles.roleSelector}>
                {(['admin', 'principal', 'teacher', 'donor', 'parent'] as UserRole[]).map(
                  (role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        formData.role === role && styles.roleOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, role })}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          formData.role === role && styles.roleOptionTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {(formData.role === 'teacher' ||
                formData.role === 'principal' ||
                formData.role === 'parent') && (
                <>
                  <Text style={styles.label}>School (Optional)</Text>
                  <View style={styles.schoolSelector}>
                    <TouchableOpacity
                      style={[
                        styles.schoolOption,
                        !formData.schoolId && styles.schoolOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, schoolId: '' })}
                    >
                      <Text style={styles.schoolOptionText}>None</Text>
                    </TouchableOpacity>
                    {Object.entries(schools)
                      .filter(([_, school]) => school.status === 'approved')
                      .map(([id, school]) => (
                        <TouchableOpacity
                          key={id}
                          style={[
                            styles.schoolOption,
                            formData.schoolId === id && styles.schoolOptionActive,
                          ]}
                          onPress={() => setFormData({ ...formData, schoolId: id })}
                        >
                          <Text
                            style={[
                              styles.schoolOptionText,
                              formData.schoolId === id && styles.schoolOptionTextActive,
                            ]}
                          >
                            {school.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleSubmit}
              >
                <Text style={styles.modalButtonText}>
                  {editingUser ? 'Update' : 'Create'}
                </Text>
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
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E3F2FD',
  },
  addButton: {
    backgroundColor: '#0051D5',
    padding: 10,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 2,
  },
  userSchool: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  modalForm: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  roleOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
    textTransform: 'capitalize',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  schoolSelector: {
    gap: 8,
  },
  schoolOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  schoolOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  schoolOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  schoolOptionTextActive: {
    color: '#007AFF',
    fontFamily: 'Inter-SemiBold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonSubmit: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#f44336',
    textAlign: 'center',
    marginTop: 100,
  },
});
