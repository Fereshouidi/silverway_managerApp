import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { accessesDispo } from '@/constants/data';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { AdminAccess, AdminType } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics'; // تأكد من تثبيت expo-haptics
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView, // أضفنا Keyboard لإغلاقه برمجياً عند الحاجة
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const AdminProfileScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { setStatusBanner } = useStatusBanner();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [admin, setAdmin] = useState<AdminType | null>(null);
    const [formData, setFormData] = useState<AdminType | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const { data } = await axios.get(`${backEndUrl}/getAdminById`, {
                    params: { id: id }
                });
                if (data.admin) {
                    setAdmin(data.admin);
                    setFormData(data.admin);
                    console.log(data.admin);

                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };
        if (id) fetchAdmin();
    }, [id]);

    const handleSave = async () => {
        if (!formData) return;

        setLoading(true);
        Keyboard.dismiss();

        try {
            const { data } = await axios.put(`${backEndUrl}/updateAdmin`, { updatedRow: formData });

            if (data.success) {
                // 1. اهتزاز النجاح (شعور ملموس بالنجاح)
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // 2. تحديث البيانات محلياً
                setAdmin(formData);

                // 3. تأخير بصري بسيط ليشعر المستخدم أن التغيير حدث فعلاً
                setTimeout(() => {
                    setIsEditing(false);
                    setLoading(false);

                    // 4. رسالة نجاح محفزة وودودة
                    setStatusBanner(true, "Admin profile has been synchronized and secured perfectly!", "success");
                }, 600);

                return; // الخروج لتجنب الـ finally في حالة النجاح لترك الـ loading يتوقف يدوياً
            }
        } catch (error) {
            // اهتزاز الفشل
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setStatusBanner(true, "We couldn't reach the server. Please try again.", "error");
        } finally {
            // نضع هذه هنا لضمان توقف الـ loading في حالة الخطأ فقط 
            // لأننا أوقفناها يدوياً في النجاح بعد الـ timeout
            setLoading(false);
        }
    };

    const toggleAccess = (accessItem: string) => {
        if (!formData) return;
        const current = formData.accesses || [];
        const isSelected = current.includes(accessItem as any);
        const updated = isSelected
            ? current.filter(i => i !== accessItem)
            : [...current, accessItem as any];
        setFormData({ ...formData, accesses: updated });
    };

    if (!admin || !formData) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator color={colors.dark[100]} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F8F9FA]">
            <View
                className='h-14'
                style={{
                    height: 45,
                    backgroundColor: colors.light[100]
                }}
            ></View>

            <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                    <MaterialCommunityIcons name="chevron-left" size={28} color="black" />
                </TouchableOpacity>

                <View className="items-center">
                    <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/30">Admin Profile</Text>
                    <Text className="text-base font-black text-black">{isEditing ? 'Editing Mode' : admin.fullName}</Text>
                </View>

                <TouchableOpacity
                    onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`w-10 h-10 rounded-full items-center justify-center ${isEditing ? 'bg-black' : 'bg-gray-100'}`}
                >
                    <MaterialCommunityIcons
                        name={loading ? "dots-horizontal" : (isEditing ? "check" : "pencil-outline")}
                        size={20}
                        color={isEditing ? "white" : "black"}
                    />
                </TouchableOpacity>
            </View>

            {/* التعديل هنا: إضافة Offset لمنع تداخل الحقول مع الكيبورد */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 20 }}
                    keyboardShouldPersistTaps="handled" // يسمح بالضغط على العناصر حتى والكيبورد مفتوح
                >

                    {!isEditing ?
                        (
                            <View className="flex-row items-center mb-8 bg-white p-4 rounded-[30px] border border-gray-100 shadow-sm">
                                <View className="w-14 h-14 bg-black rounded-2xl items-center justify-center">
                                    <MaterialCommunityIcons name="shield-account" size={30} color="white" />
                                </View>
                                <View className="ml-4">
                                    <Text className="text-xs font-bold text-black/40 uppercase tracking-widest">{admin.type}</Text>
                                    <Text className="text-lg font-black text-black">Master Access</Text>
                                </View>
                            </View>
                        )
                        :
                        <View className="bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm mb-6 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View
                                    className="w-10 h-10 rounded-2xl items-center justify-center"
                                    style={{ backgroundColor: formData.isVerified ? '#ecfdf5' : '#fff7ed' }}
                                >
                                    <MaterialCommunityIcons
                                        name={formData.isVerified ? "check-decagram" : "alert-circle-outline"}
                                        size={20}
                                        color={formData.isVerified ? "#059669" : "#d97706"}
                                    />
                                </View>
                                <View className="ml-3">
                                    <Text className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Verification Status</Text>
                                    <Text className={`text-sm font-black ${formData.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {formData.isVerified ? 'ACCOUNT VERIFIED' : 'PENDING APPROVAL'}
                                    </Text>
                                </View>
                            </View>

                            <Switch
                                disabled={!isEditing}
                                value={formData.isVerified}
                                onValueChange={(val) => setFormData({ ...formData, isVerified: val })}
                                trackColor={{ false: "#D1D5DB", true: "#10B981" }}
                                thumbColor={Platform.OS === 'ios' ? undefined : (formData.isVerified ? "#fff" : "#f4f3f4")}
                            />
                        </View>
                    }

                    <View className="bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm mb-6">
                        <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px] mb-6">Personal Details</Text>

                        {[
                            { label: 'Full Name', icon: 'account-outline', key: 'fullName' as const },
                            { label: 'Email', icon: 'email-outline', key: 'email' as const, keyboard: 'email-address' as const },
                            { label: 'Phone', icon: 'phone-outline', key: 'phone' as const, keyboard: 'phone-pad' as const }
                        ].map((item, idx) => (
                            <View key={idx} className={`mb-6 ${idx === 2 ? 'mb-0' : ''}`}>
                                <View className="flex-row items-center mb-2">
                                    <MaterialCommunityIcons name={item.icon as any} size={16} color={colors.dark[100]} />
                                    <Text className="text-[10px] font-bold text-black/40 uppercase ml-2 tracking-tighter">{item.label}</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput
                                        className="text-base font-bold text-black border-b border-gray-200 pb-2"
                                        value={String((formData as any)[item.key] || "")}
                                        onChangeText={(text) => setFormData({ ...formData, [item.key]: text })}
                                        keyboardType={item.keyboard || 'default'}
                                        autoCapitalize="none"
                                    />
                                ) : (
                                    <Text className="text-base font-bold text-black">{String((admin as any)[item.key] || '---')}</Text>
                                )}
                                {/* <Text>generational_status: "SUCCESS"</Text> */}
                            </View>
                        ))}
                    </View>

                    <View className="bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm mb-6">
                        <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px] mb-6">Security & Notes</Text>

                        <View className="mb-6-">
                            <View className="flex-row items-center mb-2">
                                <MaterialCommunityIcons name="lock-outline" size={16} color={colors.dark[100]} />
                                <Text className="text-[10px] font-bold text-black/40 uppercase ml-2">Password</Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                {isEditing ? (
                                    <TextInput
                                        className="flex-1 text-base font-bold text-black border-b border-gray-200 pb-2"
                                        value={formData.password}
                                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                                        secureTextEntry={!showPassword}
                                    />
                                ) : (
                                    <Text className="text-base font-bold text-black">••••••••</Text>
                                )}
                                {isEditing && (
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color="#CCC" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    <View className="bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm">
                        <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px] mb-6">Access</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {accessesDispo.map((item, index) => {
                                const isSelected = isEditing
                                    ? formData.accesses?.includes(item as AdminAccess)
                                    : admin.accesses?.includes(item as AdminAccess);
                                if (!isEditing && !isSelected) return null;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        disabled={!isEditing}
                                        onPress={() => toggleAccess(item as any)}
                                        className={`px-4 py-2.5 rounded-2xl border ${isSelected ? 'bg-black border-black' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                        <Text className={`text-[10px] font-black uppercase ${isSelected ? 'text-white' : 'text-black/40'}`}>{item}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {isEditing && (
                        <TouchableOpacity
                            onPress={() => { setIsEditing(false); setFormData(admin); Keyboard.dismiss(); }}
                            className="mt-8 mb-10 items-center"
                        >
                            <Text className="text-red-500 font-black text-[10px] uppercase tracking-[3px]">Discard Changes</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default AdminProfileScreen;