import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set notification handler at the top level to ensure it's registered even if the app is closed/killed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function createNotificationChannel() {
  if (Platform.OS === 'android') {
    // Create 'orders-v3' to force a refresh of channel settings on the device
    await Notifications.setNotificationChannelAsync('orders-v3', {
      name: 'Orders Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'notificationsound', // Use resource name without extension
      enableVibrate: true,
      showBadge: true,
    });

    // Also ensure a 'default' channel exists just in case
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}