import { colors } from '@/constants';
import Header from '@/components/main/header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  date: string;
  data?: Record<string, unknown>;
};

const NotificationsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    };
    checkPermission();
  }, []);

  useEffect(() => {
    const subReceived = Notifications.addNotificationReceivedListener((n) => {
      setNotifications((prev) => [
        {
          id: n.request.identifier || String(Date.now()),
          title: n.request.content.title || 'Notification',
          body: n.request.content.body || '',
          date: new Date().toISOString(),
          data: n.request.content.data as Record<string, unknown>,
        },
        ...prev.slice(0, 49),
      ]);
    });

    const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { url?: string } | undefined;
      if (data?.url) router.push(data.url as any);
    });

    return () => {
      Notifications.removeNotificationSubscription(subReceived);
      Notifications.removeNotificationSubscription(subResponse);
    };
  }, []);
 
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.light[100] }}>
      <Header
        title="Notifications"
        onBackButtonPress={() => router.back()}
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {permissionStatus !== 'granted' && (
          <View
            className="rounded-2xl p-4 mb-4 flex-row items-center"
            style={{ backgroundColor: colors.light[200] }}
          >
            <MaterialCommunityIcons name="bell-off-outline" size={28} color={colors.dark[200]} />
            <View className="ml-3 flex-1">
              <Text className="font-bold" style={{ color: colors.dark[100] }}>
                Notifications disabled
              </Text>
              <Text className="text-sm mt-1 opacity-70" style={{ color: colors.dark[200] }}>
                Enable in device settings to receive order alerts.
              </Text>
            </View>
          </View>
        )}

        <View className="rounded-3xl overflow-hidden" style={{ backgroundColor: colors.light[200] }}>
          {notifications.length === 0 ? (
            <View className="py-16 items-center justify-center px-6">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.light[300] }}
              >
                <MaterialCommunityIcons name="bell-outline" size={40} color={colors.light[600]} />
              </View>
              <Text className="text-lg font-bold text-center" style={{ color: colors.dark[100] }}>
                No notifications yet
              </Text>
              <Text className="text-sm text-center mt-2 opacity-70" style={{ color: colors.dark[200] }}>
                New order alerts and updates will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((n) => (
              <View
                key={n.id}
                className="px-5 py-4 border-b border-gray-100"
              >
                <Text className="font-bold" style={{ color: colors.dark[100] }}>
                  {n.title}
                </Text>
                <Text className="text-sm mt-1 opacity-80" style={{ color: colors.dark[200] }}>
                  {n.body}
                </Text>
                <Text className="text-xs mt-2 opacity-50" style={{ color: colors.dark[200] }}>
                  {new Date(n.date).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
