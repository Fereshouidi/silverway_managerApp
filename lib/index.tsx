import { backEndUrl } from "@/api";
import { AdminType, OrderType } from "@/types";
import axios from "axios";
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import React from "react";
import { Linking, Platform, ScrollView, Text, View } from 'react-native';


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

  order.purchases.map((purchase) => {
    if (!purchase?.specification || !purchase?.quantity) return;
    //@ts-ignore
    totalPrice = totalPrice + (purchase?.specification?.price * purchase?.quantity);
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

export async function registerForPushNotificationsAsync(admin?: AdminType) {
  let token;


  // إعداد القناة لأجهزة أندرويد لضمان ظهور الإشعار في الشريط العلوي
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders-channel', {
      name: 'Orders Alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'notificationsound.mp4',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted');
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: "c909cf83-8f7d-4cd3-87bf-cc2806a028e0"
      })).data;

      console.log("Admin Token:", token);

      // منع التحديث إذا كان التوكن هو نفسه المخزن سابقاً
      if (admin?.pushToken === token) return token;

      // إرسال push token للسيرفر (لا نستخدم token لأنه خاص بالجلسة)
      await axios.put(backEndUrl + '/updateAdmin', {
        updatedRow: {
          _id: admin?._id,
          pushToken: token
        }
      });

    } catch (error) {
      console.error("Error fetching push token:", error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export const getDeviceId = async () => {
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      "c909cf83-8f7d-4cd3-87bf-cc2806a028e0";

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    return token; // سيعيد: ExponentPushToken[xxxxxxxxxxxx]
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
    <View style={{ flexShrink: 1 }} className="max-h-[200px]">
      {segments.map((segment, index) => {
        const isTable = segment.trim().startsWith('|') && segment.includes('---');

        if (isTable) {
          const lines = segment.split('\n').filter(l => l.trim() !== '');

          return (
            <View key={index} className="my-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                // This prevents the horizontal scroll from trying to calculate vertical height
                contentContainerStyle={{ flexDirection: 'column' }}
              >
                <View
                  className={`border rounded-xl overflow-hidden ${isAI ? 'border-gray-200 bg-white' : 'border-white/20 bg-white/10'}`}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {lines.map((line, lIdx) => {
                    if (line.includes('---')) return null;

                    const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
                    const isHeader = lIdx === 0;

                    return (
                      <View
                        key={lIdx}
                        className={`flex-row border-b ${isAI ? 'border-gray-100' : 'border-white/10'} ${isHeader ? (isAI ? 'bg-gray-100' : 'bg-white/20') : ''}`}
                      >
                        {cells.map((cell, cIdx) => (
                          <View key={cIdx} style={{ width: 120 }} className={`p-3 border-r ${isAI ? 'border-gray-50' : 'border-white/5'} last:border-r-0`}>
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

//ExponentPushToken[S5IkH8OTWgIuoFXfJpAPxm]