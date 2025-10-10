import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Keyboard,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  getStudentsByTeacher,
  addStudent,
  updateStudent,
  deleteStudent,
} from '@/services/firebase/studentService';
import { StudentProfile } from '@/types';
import { theme } from '@/constants/theme';

const StudentCard = ({ id, student, onDelete }: any) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDelete = () => {
    animatePress();
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => onDelete());
          },
        },
      ]
    );
  };

  const getGradeColor = (grade: string) => {
    const gradeNum = parseInt(grade.replace(/\D/g, ''), 10);
    if (gradeNum <= 5) return theme.colors.accent;
    if (gradeNum <= 8) return theme.colors.secondary;
    return theme.colors.primary;
  };

  return (
    <Animated.View
      style={[
        styles.studentCard,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.studentHeader}>
        <View
          style={[
            styles.gradeCircle,
            { backgroundColor: getGradeColor(student.grade) + '30' },
          ]}
        >
          <Text
            style={[styles.gradeText, { color: getGradeColor(student.grade) }]}
          >
            {student.grade}
          </Text>
        </View>
        <View style={styles.studentMainInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <View style={styles.ageBadge}>
            <Text style={styles.ageText}>🎂 {student.age} years</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.parentInfo}>
        <View style={styles.parentRow}>
          <Text style={styles.parentLabel}>👤 Parent:</Text>
          <Text style={styles.parentValue}>{student.parentName}</Text>
        </View>
        <View style={styles.parentRow}>
          <Text style={styles.parentLabel}>📞 Contact:</Text>
          <Text style={styles.parentValue}>{student.parentContact}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function StudentsScreen() {
  const { userData, user } = useAuth();
  const [students, setStudents] = useState<Record<string, StudentProfile>>({});
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [headerAnim] = useState(new Animated.Value(0));
  const [fabAnim] = useState(new Animated.Value(0));

  const load = async () => {
    if (!user) return;
    const list = await getStudentsByTeacher(user.uid);
    setStudents(list || {});
  };

  useEffect(() => {
    load();

    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(fabAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
        delay: 200,
      }),
    ]).start();
  }, [user]);

  const handleAdd = async () => {
    if (
      !name.trim() ||
      !age.trim() ||
      !grade.trim() ||
      !parentName.trim() ||
      !parentContact.trim()
    ) {
      Alert.alert('Missing fields', 'Please fill all required fields');
      return;
    }

    const payload: StudentProfile = {
      name: name.trim(),
      age: parseInt(age, 10),
      grade: grade.trim(),
      parentName: parentName.trim(),
      parentContact: parentContact.trim(),
      parentEmail: undefined,
    };

    try {
      await addStudent(user!.uid, payload);
      setName('');
      setAge('');
      setGrade('');
      setParentName('');
      setParentContact('');
      setShowAddModal(false);
      Keyboard.dismiss();
      await load();
      Alert.alert('Success', `${payload.name} added successfully! 🎉`);
    } catch (err: any) {
      console.error('Failed to add student:', err);
      const message = err?.message || String(err) || 'Could not add student';
      Alert.alert('Error adding student', message);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStudent(user!.uid, id);
    await load();
  };

  const filtered = Object.entries(students).filter(([id, s]) => {
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.grade.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q)
    );
  });

  const totalStudents = Object.keys(students).length;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          theme.shadows.sm,
          {
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
            opacity: headerAnim,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>👨‍🎓 Students</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalStudents}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor={theme.colors.text.light}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={([id]) => id}
        renderItem={({ item: [id, s] }) => (
          <StudentCard id={id} student={s} onDelete={() => handleDelete(id)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>
              {query ? 'No students found' : 'No students yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {query
                ? 'Try a different search'
                : 'Tap + to add your first student'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          theme.shadows.lg,
          {
            transform: [
              {
                scale: fabAnim,
              },
            ],
            opacity: fabAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Add Student Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setShowAddModal(false);
            }}
          />

          <View style={[styles.modalContent, theme.shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Student</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalClose}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Student Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter student name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Age *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                      maxLength={2}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Grade *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Grade"
                      value={grade}
                      onChangeText={setGrade}
                      autoCapitalize="characters"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Parent Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Parent Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter parent name"
                    value={parentName}
                    onChangeText={setParentName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    value={parentContact}
                    onChangeText={setParentContact}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleAdd}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addButton, theme.shadows.md]}
                onPress={handleAdd}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>✓ Add Student</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text.primary,
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  countText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: theme.colors.text.inverse,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: theme.colors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  clearIcon: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  studentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  gradeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  studentMainInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  ageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  ageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  deleteIcon: {
    fontSize: 20,
  },
  parentInfo: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  parentLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
    minWidth: 85,
  },
  parentValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: theme.colors.text.primary,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: theme.colors.text.inverse,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: theme.colors.text.secondary,
  },
  formSection: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
});
