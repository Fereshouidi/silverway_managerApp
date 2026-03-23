import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { useAdmin } from '@/contexts/admin';
import { useLoadingScreen } from '@/contexts/loadingScreen';
import { useOwner } from '@/contexts/owner';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { getDeviceId } from '@/lib';
import { AdminType } from '@/types/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function AdminLogin() {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { ownerInfo } = useOwner();
  const { setAdmin } = useAdmin();
  const { setLoadingScreen } = useLoadingScreen();
  const { setStatusBanner } = useStatusBanner();

  const handleLogin = async () => {
    // ... (نفس كود الدالة الخاص بك بدون تغيير)
    if (!fullName || !password) {
      setStatusBanner(true, "Please fill in all fields", "warning");
      return;
    }

    try {
      setLoadingScreen(true, 'loading');
      const deviceId = await getDeviceId();

      const response = await axios.post(`${backEndUrl}/validateAdminLogin`, {
        fullName,
        password,
        newDevice: deviceId
      });

      if (response.status === 200) {
        const adminData = response.data?.admin;
        if (!adminData?.token) throw new Error("Invalid response from server");

        const admin = adminData as unknown as AdminType;
        await AsyncStorage.setItem("adminToken", admin.token?.toString() ?? "");
        setAdmin(admin);

        if (!adminData.isVerified) {
          router.push({ pathname: '/screens/handleAccount/[id]', params: { id: adminData._id } });
        } else {
          router.replace('/(auth)/welcome');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Invalid Credentials";
      setStatusBanner(true, errorMessage, "error");
    } finally {
      setLoadingScreen(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.light[100] }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="px-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full justify-center items-center mt-24 mb-10">
            {ownerInfo?.logo?.light && (
              <Image
                source={{ uri: ownerInfo.logo.light }}
                className="w-24 h-24"
                resizeMode="contain"
              />
            )}
          </View>

          <View className="mb-12">
            <Text
              className="text-4xl font-black text-center uppercase tracking-[4px]"
              style={{ color: colors.dark[100] }}
            >
              SilverWay
            </Text>
            <View className='flex-row items-center justify-center mt-2 gap-2'>
              <View className='h-[1px] w-8 bg-gray-200' />
              <Text className="text-gray-400 text-center font-bold uppercase text-[10px] tracking-widest">
                Admin Gateway
              </Text>
              <View className='h-[1px] w-8 bg-gray-200' />
            </View>
          </View>

          <View className="gap-y-6">
            <View>
              <Text className="text-[10px] font-black uppercase mb-2 ml-1 text-black/30">Identity</Text>
              <View className="flex-row items-center bg-gray-50 rounded-3xl px-5 border border-gray-100 h-16">
                <MaterialCommunityIcons name="account-outline" size={20} color="#999" />
                <TextInput
                  className="flex-1 ml-3 font-bold text-black"
                  placeholder="Full Name"
                  placeholderTextColor="#A3A3A3"
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  value={fullName}
                />
              </View>
            </View>

            <View>
              <Text className="text-[10px] font-black uppercase mb-2 ml-1 text-black/30">Authentication</Text>
              <View className="flex-row items-center bg-gray-50 rounded-3xl px-5 border border-gray-100 h-16">
                <MaterialCommunityIcons name="lock-outline" size={20} color="#999" />
                <TextInput
                  className="flex-1 ml-3 font-bold text-black"
                  placeholder="Secret Password"
                  placeholderTextColor="#A3A3A3"
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  value={password}
                />
              </View>
            </View>
          </View>

          <View className="items-center mt-12 w-full">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleLogin();
              }}
              className="w-full h-16 rounded-[20px] flex-row items-center justify-center px-6 shadow-xl shadow-black/30"
              style={{ backgroundColor: colors.dark[100] }}
            >
              <Text className="text-white font-black uppercase tracking-[2px] text-xs">
                Login
              </Text>
              <View className="ml-4 bg-white/10 p-1.5 rounded-lg">
                <MaterialCommunityIcons name="chevron-right" size={18} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          <View className='mt-10 items-center'>
            <Text className='text-gray-300 text-[10px] font-black uppercase tracking-widest'>Protected by SilverWay Security</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}