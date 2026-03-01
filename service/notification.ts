import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function createNotificationChannel() {
  if (Platform.OS === 'android') {
    // قمنا بتغيير المعرف إلى 'orders-channel' ليتوافق مع السيرفر
    await Notifications.setNotificationChannelAsync('orders-channel', {
      name: 'Orders Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      // تأكد أن الاسم هنا يطابق تماماً ما وضعته في app.json (بدون حروف كبيرة)
      sound: 'notificationsound.mp4',
      enableVibrate: true,
      showBadge: true,
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}