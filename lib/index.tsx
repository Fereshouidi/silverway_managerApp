import { backEndUrl } from "@/api";
import { AdminType, OrderType } from "@/types";
import axios from "axios";
// import Constants from 'expo-constants';
// import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
// import * as Notifications from 'expo-notifications';
import React from "react";
import { Linking, Platform, ScrollView, Text, View } from 'react-native';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system/legacy';

export const removeBackground = async (imageUri: string): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);

    const { data } = await axios.post(`${backEndUrl}/removeBackground`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min timeout for processing
    });

    if (data.success && data.url) {
      // Download the processed image locally for the editor to use
      const localUri = FileSystem.cacheDirectory + `bg_removed_${Date.now()}.png`;
      const download = await FileSystem.downloadAsync(data.url, localUri);
      return download.uri;
    }
    return null;
  } catch (error: any) {
    console.error('[RemoveBG Client]', error.message);
    return null;
  }
};

export function timeAgo(date: string | number | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = (now.getTime() - past.getTime()) / 1000;

  if (diffInSeconds < 60) return "just now";

  const minutes = diffInSeconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)} min ago`;

  const hours = diffInSeconds / 3600;
  if (hours < 24) return `${Math.floor(hours)} h ago`;

  const days = diffInSeconds / 86400;
  if (days < 7) return `${Math.floor(days)} days ago`;

  const weeks = diffInSeconds / 604800;
  if (weeks < 4) return `${Math.floor(weeks)} weeks ago`;

  const months = diffInSeconds / 2592000;
  if (months < 12) return `${Math.floor(months)} months ago`;

  const years = diffInSeconds / 31536000;
  return `${Math.floor(years)} years ago`;
}

export const calcTotalPrice = (order: OrderType) => {
  let totalPrice = 0;

  order.purchases.forEach((purchase) => {
    const basePrice = (purchase.specification as any)?.price || (purchase as any).specPrice || 0;
    const charmsPrice = purchase.customizedCharms?.reduce((acc, pc) => {
      const p = (pc.spec as any)?.price || (pc.charm as any)?.price || (pc.charm as any)?.specifications?.[0]?.price || 0;
      return acc + p;
    }, 0) || 0;
    const qty = purchase.quantity || 0;
    totalPrice += ((basePrice + charmsPrice) * qty);
  })

  return Number(totalPrice.toFixed(2))
}


export const pickImage = async (onError?: (msg: string) => void) => {
  // Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    if (onError) onError('Permission denied!');
    else alert('Permission denied!');
    return;
  }

  // Pick an image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    // result.assets[0].uri is the selected image URI
    console.log(result.assets[0].uri);
    // setSelectedImage(result.assets[0].uri); // save to state
    return result.assets[0].uri
  }
};

export const pickManyImages = async (onError?: (msg: string) => void) => {
  // Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    if (onError) onError('Permission denied!');
    else alert('Permission denied!');
    return [];
  }

  // Pick multiple images
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true, // ✅ important
    quality: 1,
  });

  if (!result.canceled) {
    // Get all image URIs
    const imagesUris = result.assets.map(asset => asset.uri);
    console.log(imagesUris);
    return imagesUris; // ✅ array of images
  }

  return [];
};

export const handleLongText = (text: string, limitLength: number): string => {
  if (!text) return "";

  if (text.length <= limitLength) {
    return text;
  }

  return text.substring(0, limitLength).trim() + "...";
};

// export async function registerForPushNotificationsAsync(admin?: AdminType) {
//   let token;

//   // إعداد القناة لأجهزة أندرويد لضمان ظهور الإشعار في الشريط العلوي
//   if (Platform.OS === 'android') {
//     await Notifications.setNotificationChannelAsync('orders-channel', {
//       name: 'Orders Alerts',
//       importance: Notifications.AndroidImportance.MAX,
//       sound: 'notificationsound.mp4',
//     });
//   }

//   if (Device.isDevice) {
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== 'granted') {
//       console.log('Permission not granted');
//       return;
//     }

//     try {
//       // Get the raw Firebase (FCM) token on Android or APNs token on iOS
//       token = (await Notifications.getDevicePushTokenAsync()).data;

//       console.log("Admin Token (Device/FCM):", token);

//       // منع التحديث إذا كان التوكن هو نفسه المخزن سابقاً
//       if (admin?.pushToken === token) return token;

//       // إرسال push token للسيرفر (لا نستخدم token لأنه خاص بالجلسة)
//       await axios.put(backEndUrl + '/updateAdmin', {
//         updatedRow: {
//           _id: admin?._id,
//           pushToken: token
//         }
//       });

//     } catch (error) {
//       console.error("Error fetching push token:", error);
//     }
//   } else {
//     console.log('Must use physical device for Push Notifications');
//   }

//   return token;
// }

export const getDeviceId = async () => {
  try {
    // Get the raw Device Token instead of Expo Push Token
    const token = (await Notifications.getDevicePushTokenAsync()).data;

    return token; // سيعيد: Device Token string (FCM/APNs)
  } catch (error) {
    console.error("Error getting Device ID:", error);
    return null;
  }
};

export const handleCall = (phoneNumber: string) => {
  Linking.openURL(`tel:${phoneNumber}`);
};

export const handleWhatsApp = (phoneNumber: string) => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  Linking.openURL(`https://wa.me/${cleanNumber}`);
};

export const renderMessageContent = (content: string, isAI: boolean) => {
  const segments = content.split(/(\|[^\n]+\|\n\|(?:\s*[:?-]+[:?\s-]*\|)+\n(?:\|[^\n]+\|\n?)+)/g);

  return (
    <View className="w-full">
      {segments.map((segment, index) => {
        const isTable = segment.trim().startsWith('|') && segment.includes('---');

        if (isTable) {
          const lines = segment.split('\n').filter(l => l.trim() !== '');

          return (
            <View key={index} className="my-3 w-full">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ flexDirection: 'column' }}
                nestedScrollEnabled={true}
              >
                <View
                  className={`border rounded-sm overflow-hidden ${isAI ? 'border-gray-100 bg-white' : 'border-white/10 bg-white/5'}`}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {lines.map((line, lIdx) => {
                    const isSeparator = line.includes('---');
                    if (isSeparator) return null;

                    const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
                    const isHeader = lIdx === 0;

                    return (
                      <View
                        key={lIdx}
                        className={`flex-row border-b ${isAI ? 'border-gray-100' : 'border-white/5'} ${isHeader ? (isAI ? 'bg-gray-50' : 'bg-white/10') : ''}`}
                        style={{ minHeight: 30 }}
                      >
                        {cells.map((cell, cIdx) => (
                          <View
                            key={cIdx}
                            style={{ minWidth: 100, maxWidth: 200 }}
                            className={`p-2 border-r ${isAI ? 'border-gray-50' : 'border-white/5'} last:border-r-0 justify-center`}
                          >
                            <Text className={`text-[11px] ${isHeader ? 'font-black' : 'font-medium'} ${isAI ? 'text-black' : 'text-white'}`}>
                              {cell.trim()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          );
        }

        if (segment.trim() === '') return null;

        return (
          <Text
            key={index}
            className={`text-[13px] leading-6 mb-2 ${isAI ? 'text-black font-medium' : 'text-white font-medium'}`}
          >
            {segment.replace(/\*+/g, '').trim()}
          </Text>
        );
      })}
    </View>
  );
};

export async function registerForPushNotificationsAsync(admin?: AdminType) {
  let token;

  // 1. التحقق من أن الجهاز حقيقي (الإشعارات لا تعمل على المحاكي في بعض الحالات)
  if (Device.isDevice) {

    // 2. طلب التصريح من المستخدم
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    // 3. الحصول على الـ FCM Token مباشرة من Google/Firebase
    try {
      // هذا هو السطر الأهم للحصول على الـ Token الخاص بـ Firebase
      token = (await Notifications.getDevicePushTokenAsync()).data;
      console.log("FCM Device Token:", token);

      // 4. تحديث التوكن في قاعدة البيانات إذا كان لدينا أدمن
      if (admin && token) {
        // نرسل التوكن للسيرفر ليتم إضافته لمصفوفة devices
        await axios.put(backEndUrl + '/updateAdmin', {
          updatedRow: {
            _id: admin?._id,
            newDevice: token
          }
        });
        console.log("Device token saved successfully for admin:", admin._id);
      }

    } catch (e) {
      console.error("Error getting token or updating backend:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  // إعدادات إضافية للأندرويد (قنوات الإشعارات)
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Checks if the string consists of exactly 8 digits
  const regex = /^\d{8}$/;
  return regex.test(phone);
};
