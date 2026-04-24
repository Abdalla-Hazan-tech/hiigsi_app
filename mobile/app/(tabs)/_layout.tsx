import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ListTodo, Tag, History, User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#020617',
        },
        headerTintColor: '#f8fafc',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="activities/index"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <ListTodo size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="categories/index"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <Tag size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile/edit"
        options={{
          href: null,
          title: 'Personal Information',
        }}
      />
      <Tabs.Screen
        name="profile/security"
        options={{
          href: null,
          title: 'Security',
        }}
      />
      <Tabs.Screen
        name="profile/preferences"
        options={{
          href: null,
          title: 'Preferences',
        }}
      />
    </Tabs>
  );
}
