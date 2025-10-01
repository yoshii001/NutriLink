import { Tabs } from 'expo-router';
import { LayoutDashboard, Package, UtensilsCrossed, DollarSign, MessageSquare, FileText, Settings, ClipboardCheck, History, Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import SettingsMenu from '@/components/SettingsMenu';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  const { userData } = useAuth();

  const getTabsForRole = () => {
    if (!userData) return [];

    const commonTabs = [
      { name: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
    ];

    switch (userData.role) {
      case 'admin':
        return [
          { name: 'admin-dashboard', title: 'Admin', icon: Settings },
          { name: 'donations', title: 'Donations', icon: DollarSign },
          { name: 'feedback', title: 'Feedback', icon: MessageSquare },
          { name: 'reports', title: 'Reports', icon: FileText },
        ];
      case 'teacher':
        return [
          ...commonTabs,
          { name: 'tracking', title: 'Track Meals', icon: ClipboardCheck },
          { name: 'history', title: 'History', icon: History },
        ];
      case 'principal':
        return [
          ...commonTabs,
          { name: 'menu', title: 'Menu Planning', icon: UtensilsCrossed },
          { name: 'inventory', title: 'Inventory', icon: Package },
          { name: 'reports', title: 'Reports', icon: FileText },
        ];
      case 'donor':
        return [
          ...commonTabs,
          { name: 'donations', title: 'My Donations', icon: DollarSign },
        ];
      case 'parent':
        return [
          ...commonTabs,
          { name: 'feedback', title: 'Feedback', icon: MessageSquare },
        ];
      default:
        return commonTabs;
    }
  };

  const tabs = getTabsForRole();
  const allowedTabNames = tabs.map(t => t.name);

  const allTabs = ['dashboard', 'admin-dashboard', 'inventory', 'donations', 'feedback', 'reports', 'tracking', 'history', 'menu'];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: {
          fontFamily: 'Inter-Bold',
          fontSize: 18,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.light,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 11,
        },
        headerRight: () => <SettingsMenu />,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => <tab.icon color={color} size={size} />,
          }}
        />
      ))}
      {allTabs.filter(tabName => !allowedTabNames.includes(tabName)).map((tabName) => (
        <Tabs.Screen
          key={tabName}
          name={tabName}
          options={{
            href: null,
          }}
        />
      ))}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}