import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getStudentsByTeacher } from '@/services/firebase/studentService';
import { saveMealTracking, addStudentMeal, updateStudentMeal, getMealTrackingByDate } from '@/services/firebase/mealTrackingService';
import { StudentProfile } from '@/types';
import { theme } from '@/constants/theme';

const reactionMap = {
  happy: { emoji: '😊', label: 'Enjoyed', color: '#10B981' },
  little: { emoji: '😐', label: 'Some', color: '#FBBF24' },
  none: { emoji: '😞', label: 'None', color: '#EF4444' }
} as const;

const healthMap = {
  null: { emoji: '⚕️', label: 'Normal', color: '#6B7280' },
  tired: { emoji: '😴', label: 'Tired', color: '#F59E0B' },
  sick: { emoji: '🤒', label: 'Sick', color: '#EF4444' },
  active: { emoji: '⚡', label: 'Active', color: '#10B981' }
} as const;

const StudentItem = ({ id, student, onToggleServed, onCycleReaction, onCycleHealth }: any) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
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

  const handleServedPress = () => {
    animatePress();
    onToggleServed(id);
  };

  const reactionData = reactionMap[student.mealReaction as keyof typeof reactionMap];
  const healthData = healthMap[(student.healthObservation ?? null) as keyof typeof healthMap];

  return (
    <Animated.View style={[styles.item, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.studentInfo}>
        <View style={[styles.avatarCircle, student.mealServed && styles.avatarServed]}>
          <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.sub}>{student.grade ?? 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[
            styles.servedBtn, 
            student.mealServed && styles.servedBtnActive,
            theme.shadows.sm
          ]} 
          onPress={handleServedPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.servedText, student.mealServed && styles.servedTextActive]}>
            {student.mealServed ? '✓ Served' : 'Mark'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.reactionBtn, { borderColor: reactionData.color }]}
          onPress={() => onCycleReaction(id)}
          activeOpacity={0.7}
        >
          <Text style={styles.reactionEmoji}>{reactionData.emoji}</Text>
          <Text style={[styles.reactionLabel, { color: reactionData.color }]}>
            {reactionData.label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.healthBtn, { borderColor: healthData.color }]}
          onPress={() => onCycleHealth(id)}
          activeOpacity={0.7}
        >
          <Text style={styles.healthEmoji}>{healthData.emoji}</Text>
          <Text style={[styles.healthLabel, { color: healthData.color }]}>
            {healthData.label}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function AttendanceScreen() {
  const { userData, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login' as any);
  };
  const [students, setStudents] = useState<Record<string, any>>({});
  const [dateStr] = useState(new Date().toISOString().split('T')[0]);
  const [headerAnim] = useState(new Animated.Value(0));

  const { user } = useAuth();

  const load = async () => {
    if (!user) return;
    const list = await getStudentsByTeacher(user.uid);
    const existing = await getMealTrackingByDate(dateStr);
    const initial: Record<string, any> = {};
    Object.entries(list || {}).forEach(([id, s]) => {
      initial[id] = {
        name: s.name,
        grade: s.grade,
        mealServed: existing?.students?.[id]?.mealServed ?? false,
        mealReaction: existing?.students?.[id]?.mealReaction ?? 'happy',
        healthObservation: existing?.students?.[id]?.healthObservation ?? null,
        notes: existing?.students?.[id]?.notes ?? ''
      };
    });
    setStudents(initial);

    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  useEffect(() => { load(); }, [userData]);

  const toggleServed = async (id: string) => {
    const s = { ...students[id], mealServed: !students[id].mealServed };
    setStudents({ ...students, [id]: s });
    try {
      await updateStudentMeal(dateStr, id, s);
    } catch (e) {
      await addStudentMeal(dateStr, user!.uid, s);
    }
  };

  const cycleReaction = async (id: string) => {
    const order: any = ['happy', 'little', 'none'];
    const cur = students[id].mealReaction || 'happy';
    const nxt = order[(order.indexOf(cur) + 1) % order.length];
    const s = { ...students[id], mealReaction: nxt };
    setStudents({ ...students, [id]: s });
    try { await updateStudentMeal(dateStr, id, s); } catch (e) { await addStudentMeal(dateStr, user!.uid, s); }
  };

  const cycleHealth = async (id: string) => {
    const order: any = [null, 'tired', 'sick', 'active'];
    const cur = students[id].healthObservation ?? null;
    const nxt = order[(order.indexOf(cur) + 1) % order.length];
    const s = { ...students[id], healthObservation: nxt };
    setStudents({ ...students, [id]: s });
    try { await updateStudentMeal(dateStr, id, s); } catch (e) { await addStudentMeal(dateStr, user!.uid, s); }
  };

  const totalServed = Object.values(students).filter((s: any) => s.mealServed).length;
  const totalStudents = Object.keys(students).length;
  const percentage = totalStudents > 0 ? Math.round((totalServed / totalStudents) * 100) : 0;

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>📋 Attendance</Text>
            <Text style={styles.dateText}>{new Date(dateStr).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ padding: 6 }}>
            <Text style={{ color: theme.colors.primary, fontFamily: 'Inter-SemiBold' }}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalServed}</Text>
            <Text style={styles.statLabel}>Served</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.percentageCard]}>
            <Text style={styles.percentageNumber}>{percentage}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>
      </Animated.View>

      <FlatList
        data={Object.entries(students)}
        keyExtractor={([id]) => id}
        renderItem={({ item: [id, s] }) => (
          <StudentItem
            id={id}
            student={s}
            onToggleServed={toggleServed}
            onCycleReaction={cycleReaction}
            onCycleHealth={cycleHealth}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
    fontFamily: 'Inter-Bold', 
    fontSize: 24, 
    color: theme.colors.text.primary 
  },
  dateText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  percentageCard: {
    backgroundColor: theme.colors.primaryLight + '20',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  percentageNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: theme.colors.primary,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  item: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  avatarServed: {
    backgroundColor: theme.colors.primaryLight + '30',
    borderColor: theme.colors.primary,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  nameContainer: {
    flex: 1,
  },
  name: { 
    fontFamily: 'Inter-SemiBold', 
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  sub: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 13,
    color: theme.colors.text.secondary 
  },
  controls: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  servedBtn: { 
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  servedBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  servedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  servedTextActive: {
    color: theme.colors.text.inverse,
  },
  reactionBtn: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 50,
    backgroundColor: theme.colors.surface,
  },
  reactionEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  reactionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
  },
  healthBtn: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 50,
    backgroundColor: theme.colors.surface,
  },
  healthEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  healthLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
  },
});