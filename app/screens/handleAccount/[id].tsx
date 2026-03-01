import { backEndUrl } from '@/api';
import { useAdmin } from '@/contexts/admin';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Keyboard,
    KeyboardAvoidingView, Platform,
    ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HandleAccount = () => {
    const { id } = useLocalSearchParams();
    const { setAdmin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'info' | 'otp'>('info');
    const [formData, setFormData] = useState({ email: '', phone: '', otp: '' });
    const router = useRouter();

    const handleUpdateAndSendOtp = async () => {
        if (!formData.email || !formData.phone) {
            setStatusBanner(true, "Please provide your email and phone number.", "warning");
            return;
        }
        setLoading(true);
        Keyboard.dismiss();
        try {
            const { data } = await axios.put(`${backEndUrl}/updateAdmin`, {
                updatedRow: { _id: id, email: formData.email, phone: formData.phone }
            });
            if (data.success) setStep('otp');
        } catch (error: any) {
            setStatusBanner(true, error.response?.data?.message || "Something went wrong", "error");
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        if (!formData.otp) {
            setStatusBanner(true, "Please enter the verification code.", "warning");
            return;
        }

        // إغلاق الكيبورد ضروري لمنع مشاكل الـ UI أثناء الانتقال
        Keyboard.dismiss();
        setLoading(true);

        try {
            const { data } = await axios.put(`${backEndUrl}/updateAdmin`, {
                updatedRow: { _id: id, isVerified: true, verificationCode: formData.otp }
            });

            if (data.success) {
                // إيقاف التحميل المحلي قبل تحديث الحالة العامة
                setLoading(false);

                // التحديث الآمن: ندمج البيانات الجديدة مع القديمة
                // هذا يضمن بقاء الـ accesses و token موجودين في الـ Context
                // مما يمنع شاشة التحميل اللانهائية في الـ RootLayout أو Tabs
                setAdmin(data.admin || {});

                // router.replace('/welcome');

                // لا نحتاج لـ router.replace هنا، الـ RootLayout سيقوم بالمهمة فوراً
            }
        } catch (error) {
            setStatusBanner(true, "The code you entered is incorrect.", "error");
            setLoading(false); // إيقاف التحميل في حالة الخطأ فقط هنا
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 30, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-6">
                            <MaterialCommunityIcons name={step === 'info' ? "shield-account-outline" : "email-check-outline"} size={40} color="black" />
                        </View>
                        <Text className="text-2xl font-black text-center uppercase tracking-tighter text-black">
                            {step === 'info' ? "Security Step" : "Verify Email"}
                        </Text>
                        <Text className="text-gray-400 text-center font-medium mt-2 px-6">
                            {step === 'info' ? "Update contact info to receive code." : `We sent a code to ${formData.email}`}
                        </Text>
                    </View>

                    {step === 'info' ? (
                        <View className="gap-y-6">
                            <View>
                                <Text className="text-[10px] font-black text-black/30 uppercase mb-2 ml-1">Email Address</Text>
                                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 border border-gray-100">
                                    <MaterialCommunityIcons name="email-outline" size={20} color="#999" />
                                    <TextInput className="flex-1 h-16 ml-3 font-bold text-black" placeholder="email@company.com" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} />
                                </View>
                            </View>
                            <View>
                                <Text className="text-[10px] font-black text-black/30 uppercase mb-2 ml-1">Phone Number</Text>
                                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 border border-gray-100">
                                    <MaterialCommunityIcons name="phone-outline" size={20} color="#999" />
                                    <TextInput className="flex-1 h-16 ml-3 font-bold text-black" placeholder="+123..." keyboardType="phone-pad" value={formData.phone} onChangeText={(t) => setFormData({ ...formData, phone: t })} />
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleUpdateAndSendOtp} disabled={loading} className="bg-black h-16 rounded-2xl items-center justify-center mt-6 shadow-xl">
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase">Send Code</Text>}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="gap-y-6">
                            <TextInput className="bg-gray-50 h-20 rounded-3xl border border-gray-100 text-center text-3xl font-black tracking-[10px] text-black" placeholder="000000" keyboardType="number-pad" maxLength={6} autoFocus value={formData.otp} onChangeText={(t) => setFormData({ ...formData, otp: t })} />
                            <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} className="bg-black h-16 rounded-2xl items-center justify-center shadow-xl">
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase">Verify & Access</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStep('info')} className="items-center">
                                <Text className="text-gray-400 font-bold text-[11px] uppercase">Back to Info</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default HandleAccount;