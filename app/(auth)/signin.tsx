import { backEndUrl } from '@/api';
import CustomInput from '@/components/sub/customInput';
import { colors } from '@/constants';
import { useAdmin } from '@/contexts/admin';
import { useLoadingScreen } from '@/contexts/loadingScreen';
import { useOwner } from '@/contexts/owner';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { getDeviceId } from '@/lib';
import { AdminType } from '@/types/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLogin() {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { ownerInfo } = useOwner();
  const { setAdmin } = useAdmin();
  const { setLoadingScreen } = useLoadingScreen();
  const { setStatusBanner } = useStatusBanner();

  const handleLogin = async () => {
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

        if (!adminData?.token) {
          throw new Error("Invalid response from server");
        }

        const admin = adminData as unknown as AdminType;

        await AsyncStorage.setItem("adminToken", admin.token?.toString() ?? "");
        setAdmin(admin);

        if (!adminData.isVerified) {
          router.push({
            pathname: '/screens/handleAccount/[id]',
            params: { id: adminData._id }
          });
        } else {
          router.push('/(auth)/welcome');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Invalid Credentials";
      setStatusBanner(true, errorMessage, "error");
      console.log("Login Error:", err);
    } finally {
      setLoadingScreen(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.light[100] }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="px-10"
      >
        <View className="w-full justify-center items-center mt-32 mb-10">
          {ownerInfo?.logo?.light && (
            <Image
              source={{ uri: ownerInfo.logo.light }}
              className="w-[80px] h-[80px]"
              resizeMode="contain"
            />
          )}
        </View>

        <View className="mb-10">
          <Text
            className="text-3xl font-black text-center uppercase tracking-widest"
            style={{ color: colors.dark[100] }}
          >
            Admin Panel
          </Text>
          <Text className="text-gray-400 text-center font-medium mt-2">
            Please sign in to continue
          </Text>
        </View>

        <View className="gap-y-4">
          <CustomInput
            tittle="FullName"
            placeholder="Enter your full name..."
            className="w-full px-0"
            inputStyle={{ color: colors.dark[200] }}
            inputClassName="h-16"
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <CustomInput
            tittle="Password"
            placeholder="Enter your password..."
            className="w-full px-0"
            inputStyle={{ color: colors.dark[200] }}
            inputClassName="h-16"
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.8}
          className="p-5 rounded-3xl mt-12 shadow-lg shadow-black/20"
          style={{ backgroundColor: colors.dark[100] }}
        >
          <Text className="text-white text-center font-black uppercase tracking-widest">
            Login as Admin
          </Text>
        </TouchableOpacity>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}