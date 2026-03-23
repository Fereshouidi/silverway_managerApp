import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { accessesDispo } from '@/constants/data';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { isValidEmail, isValidPhone } from '@/lib';
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
    View,
    Alert
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

        // Validation
        if (formData.email && !isValidEmail(formData.email)) {
            setStatusBanner(true, "Please provide a valid email address.", "warning");
            return;
        }

        if (formData.phone && !isValidPhone(String(formData.phone))) {
            setStatusBanner(true, "Phone number must be exactly 8 digits.", "warning");
            return;
        }

        setLoading(true);
        Keyboard.dismiss();

        try {
            const { data } = await axios.put(`${backEndUrl}/updateAdmin`, { updatedRow: formData });

            if (data.success) {
                // 1. اهتزاز النجاح (شعور ملموس بالنجاح)
                // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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

    const handleDelete = async () => {
        Alert.alert(
            "Delete Admin",
            "Are you sure you want to completely delete this admin? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { data } = await axios.delete(`${backEndUrl}/deleteAdmin`, {
                                params: { id: id }
                            });
                            if (data.success) {
                                setStatusBanner(true, "Admin deleted successfully", "success");
                                router.back();
                            }
                        } catch (error) {
                            setStatusBanner(true, "Failed to delete admin", "error");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDismiss = async () => {
        if (!admin) return;

        // Case 1: Admin is already eliminated -> Reactivate
        if ((admin.accesses?.length || 0) === 0) {
            setIsEditing(true);
            setStatusBanner(true, "Assign permissions to reactivate this admin.", "success");
            return;
        }

        // Case 2: Admin is active -> Eliminate
        Alert.alert(
            "Eliminate Admin",
            "This will deactivate the admin and remove all their accesses. Do you want to proceed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Eliminate",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const updatedData = {
                                ...admin,
                                isVerified: false,
                                accesses: []
                            };
                            const { data } = await axios.put(`${backEndUrl}/updateAdmin`, { updatedRow: updatedData });
                            if (data.success) {
                                setAdmin(updatedData);
                                setFormData(updatedData);
                                setStatusBanner(true, "Admin has been eliminated/deactivated", "success");
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                        } catch (error) {
                            setStatusBanner(true, "Failed to eliminate admin", "error");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
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
                                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${admin.isVerified && admin.accesses?.length > 0 ? 'bg-black' : 'bg-gray-100'}`}>
                                    <MaterialCommunityIcons
                                        name={admin.isVerified && admin.accesses?.length > 0 ? "shield-check" : "shield-off"}
                                        size={30}
                                        color={admin.isVerified && admin.accesses?.length > 0 ? "white" : "#9ca3af"}
                                    />
                                </View>
                                <View className="ml-4 flex-1">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-xs font-bold text-black/40 uppercase tracking-widest">{admin.type}</Text>
                                        <View className={`px-2 py-0.5 rounded-full ${admin.isVerified && admin.accesses?.length > 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                            <Text className={`text-[8px] font-black uppercase ${admin.isVerified && admin.accesses?.length > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {admin.isVerified && admin.accesses?.length > 0 ? 'STATUS: ACTIVE' : (admin.accesses?.length === 0 ? 'STATUS: ELIMINATED' : 'STATUS: PENDING')}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-lg font-black text-black">
                                        {admin.isVerified && admin.accesses?.length > 0 ? 'Master Access' : 'Access Restricted'}
                                    </Text>
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
                        ].map((item, idx) => {
                            const isEmail = item.key === 'email';
                            const isPhone = item.key === 'phone';
                            const value = String((formData as any)[item.key] || "");

                            const isInvalidEmail = isEmail && value && !isValidEmail(value);
                            const isInvalidPhone = isPhone && value && !isValidPhone(value);
                            const isInvalid = isInvalidEmail || isInvalidPhone;

                            return (
                                <View key={idx} className={`mb-6 ${idx === 2 ? 'mb-0' : ''}`}>
                                    <View className="flex-row items-center mb-2">
                                        <MaterialCommunityIcons name={item.icon as any} size={16} color={isInvalid ? "#ef4444" : colors.dark[100]} />
                                        <Text className={`text-[10px] font-bold uppercase ml-2 tracking-tighter ${isInvalid ? 'text-red-500' : 'text-black/40'}`}>{item.label}</Text>
                                    </View>
                                    {isEditing ? (
                                        <TextInput
                                            className={`text-base font-bold text-black border-b pb-2 ${isInvalid ? 'border-red-500' : 'border-gray-200'}`}
                                            value={value}
                                            onChangeText={(text) => {
                                                let val = text;
                                                if (isPhone) {
                                                    val = text.replace(/\D/g, '').slice(0, 8);
                                                }
                                                setFormData({ ...formData, [item.key]: val });
                                            }}
                                            keyboardType={item.keyboard || 'default'}
                                            autoCapitalize="none"
                                            maxLength={isPhone ? 8 : undefined}
                                        />
                                    ) : (
                                        <Text className="text-base font-bold text-black">{String((admin as any)[item.key] || '---')}</Text>
                                    )}
                                    {isEditing && isInvalidEmail && (
                                        <Text className="text-[9px] text-red-500 font-bold mt-1 uppercase">Invalid email format</Text>
                                    )}
                                    {isEditing && isInvalidPhone && (
                                        <Text className="text-[9px] text-red-500 font-bold mt-1 uppercase">Must be 8 digits</Text>
                                    )}
                                </View>
                            );
                        })}
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
                            className="mt-8 mb-4 items-center"
                        >
                            <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[3px]">Discard Changes</Text>
                        </TouchableOpacity>
                    )}

                    {!isEditing && admin.type !== 'bigBoss' && (
                        <View className="mt-10 mb-10 gap-4">
                            {/* <TouchableOpacity
                                onPress={handleDismiss}
                                disabled={loading}
                                className={`flex-row items-center justify-center p-4 rounded-3xl border ${(admin.accesses?.length || 0) === 0 ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}
                            >
                                <MaterialCommunityIcons
                                    name={(admin.accesses?.length || 0) === 0 ? "account-check-outline" : "account-off"}
                                    size={18}
                                    color={(admin.accesses?.length || 0) === 0 ? "#059669" : "#d97706"}
                                />
                                <Text className={`ml-2 font-bold text-[10px] uppercase tracking-[2px] ${(admin.accesses?.length || 0) === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {(admin.accesses?.length || 0) === 0 ? 'Reactivate Admin' : 'Eliminate / Deactivate'}
                                </Text>
                            </TouchableOpacity> */}

                            <TouchableOpacity
                                onPress={handleDelete}
                                disabled={loading}
                                className="flex-row items-center justify-center p-4 rounded-3xl border border-red-100 bg-red-50"
                            >
                                <MaterialCommunityIcons name="trash-can" size={18} color="#dc2626" />
                                <Text className="ml-2 text-red-600 font-bold text-[10px] uppercase tracking-[2px]">Delete This Admin</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default AdminProfileScreen;