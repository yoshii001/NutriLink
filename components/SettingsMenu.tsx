import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { MoveVertical as MoreVertical, User, Settings, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';

export default function SettingsMenu() {
  const [visible, setVisible] = useState(false);
  const { userData, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    setVisible(false);
    await signOut();
    router.replace('/login');
  };

  const handleProfile = () => {
    setVisible(false);
    router.push('/profile');
  };

  const handleSettings = () => {
    setVisible(false);
    router.push('/settings');
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.menuButton}>
        <MoreVertical color="#fff" size={24} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData?.name}</Text>
              <Text style={styles.userRole}>{userData?.role}</Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
              <User color="#333" size={20} />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <Settings color="#333" size={20} />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <LogOut color="#F44336" size={20} />
              <Text style={[styles.menuText, { color: '#F44336' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginRight: 16,
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginTop: 60,
    marginRight: 16,
    minWidth: 200,
    ...theme.shadows.lg,
  },
  userInfo: {
    padding: theme.spacing.md,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
  },
});
