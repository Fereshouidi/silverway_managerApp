import { backEndUrl } from '@/api';
import { useAdmin } from '@/contexts/admin';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { isValidEmail, isValidPhone } from '@/lib';
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
    const { setAdmin, updateAdmin } = useAdmin();
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

        if (!isValidEmail(formData.email)) {
            setStatusBanner(true, "Please enter a valid email address.", "warning");
            return;
        }

        if (!isValidPhone(formData.phone)) {
            setStatusBanner(true, "Phone number must be exactly 8 digits.", "warning");
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

                // التحديث الآمن: نستخدم updateAdmin لدمج البيانات الجديدة
                // هذا يضمن بقاء التوكن والصلاحيات موجودة في الـ Context
                // @ts-ignore
                updateAdmin({ isVerified: true, ...data.admin });

                // التوجه لصفحة الترحيب
                router.replace('/(auth)/welcome');
            }
        } catch (error) {
            setStatusBanner(true, "The code you entered is incorrect.", "error");
            setLoading(false); // إيقاف التحميل في حالة الخطأ فقط هنا
        }
    };

    const isInvalidEmail = formData.email && !isValidEmail(formData.email);
    const isInvalidPhone = formData.phone && !isValidPhone(formData.phone);

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
                                <Text className={`text-[10px] font-black uppercase mb-2 ml-1 ${isInvalidEmail ? 'text-red-500' : 'text-black/30'}`}>Email Address {isInvalidEmail && "(Invalid)"}</Text>
                                <View className={`flex-row items-center bg-gray-50 rounded-2xl px-4 border ${isInvalidEmail ? 'border-red-500' : 'border-gray-100'}`}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={isInvalidEmail ? "#ef4444" : "#999"} />
                                    <TextInput className="flex-1 h-16 ml-3 font-bold text-black" placeholder="email@company.com" placeholderTextColor="#A3A3A3" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} />
                                </View>
                            </View>
                            <View>
                                <Text className={`text-[10px] font-black uppercase mb-2 ml-1 ${isInvalidPhone ? 'text-red-500' : 'text-black/30'}`}>Phone Number {isInvalidPhone && "(8 digits)"}</Text>
                                <View className={`flex-row items-center bg-gray-50 rounded-2xl px-4 border ${isInvalidPhone ? 'border-red-500' : 'border-gray-100'}`}>
                                    <MaterialCommunityIcons name="phone-outline" size={20} color={isInvalidPhone ? "#ef4444" : "#999"} />
                                    <TextInput
                                        className="flex-1 h-16 ml-3 font-bold text-black"
                                        placeholder="12345678"
                                        placeholderTextColor="#A3A3A3"
                                        keyboardType="phone-pad"
                                        value={formData.phone}
                                        maxLength={8}
                                        onChangeText={(t) => {
                                            const clean = t.replace(/\D/g, '').slice(0, 8);
                                            setFormData({ ...formData, phone: clean });
                                        }}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleUpdateAndSendOtp} disabled={loading} className="bg-black h-16 rounded-2xl items-center justify-center mt-6 shadow-xl">
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black uppercase">Send Code</Text>}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="gap-y-6">
                            <TextInput className="bg-gray-50 h-20 rounded-3xl border border-gray-100 text-center text-3xl font-black tracking-[10px] text-black" placeholder="000000" placeholderTextColor="#A3A3A3" keyboardType="number-pad" maxLength={6} autoFocus value={formData.otp} onChangeText={(t) => setFormData({ ...formData, otp: t })} />
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