import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { accessesDispo } from '@/constants/data';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { AdminAccess } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddAdmin = () => {
    const router = useRouter();
    const { setStatusBanner } = useStatusBanner();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        password: '',
        accesses: [] as string[], // متوافق مع Schema (Access)
        type: 'normalAdmin',    // متوافق مع Schema (enum)
    });

    const handleCreate = async () => {
        if (!formData.fullName || !formData.password) {
            setStatusBanner(true, "Please provide both name and password.", "warning");
            return;
        }

        setLoading(true);
        Keyboard.dismiss();

        try {
            // استخدام الـ Endpoint الجديد: /addAdmin
            const { data } = await axios.post(`${backEndUrl}/addAdmin`, { adminData: formData });

            if (data) {
                setStatusBanner(true, "Admin account has been registered.", "success");
                router.back();
            }
        } catch (error: any) {
            // التعامل مع خطأ التكرار (Duplicate Key) لأن الحقول في الـ Schema فريدة (unique)
            const errorMsg = error.response?.data?.message || "Check if the name is already taken.";
            setStatusBanner(true, errorMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleAccess = (accessItem: string) => {
        const current = formData.accesses;
        const updated = current.includes(accessItem)
            ? current.filter(i => i !== accessItem)
            : [...current, accessItem];
        setFormData({ ...formData, accesses: updated });
    };

    useEffect(() => {
        console.log({ formData });

    }, [formData])

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                    <MaterialCommunityIcons name="close" size={24} color="black" />
                </TouchableOpacity>

                <View className="items-center">
                    <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/30">System Guard</Text>
                    <Text className="text-base font-black text-black">Add Normal Admin</Text>
                </View>

                <View className="w-10" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 20 }}
                    >
                        {/* Identity & Security */}
                        <View className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
                            <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px] mb-6">Login Info</Text>

                            {/* Full Name - Unique in Schema */}
                            <View className="mb-6">
                                <View className="flex-row items-center mb-2">
                                    <MaterialCommunityIcons name="account-circle-outline" size={16} color={colors.dark[100]} />
                                    <Text className="text-[10px] font-bold text-black/40 uppercase ml-2">Full Name (Unique)</Text>
                                </View>
                                <TextInput
                                    className="text-base font-bold text-black border-b border-gray-200 pb-2"
                                    placeholder="e.g. Admin_Alpha"
                                    placeholderTextColor="#CCC"
                                    value={formData.fullName}
                                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                                />
                            </View>

                            {/* Password */}
                            <View>
                                <View className="flex-row items-center mb-2">
                                    <MaterialCommunityIcons name="shield-key-outline" size={16} color={colors.dark[100]} />
                                    <Text className="text-[10px] font-bold text-black/40 uppercase ml-2">Initial Password</Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <TextInput
                                        className="flex-1 text-base font-bold text-black border-b border-gray-200 pb-2"
                                        placeholder="••••••••"
                                        placeholderTextColor="#CCC"
                                        secureTextEntry={!showPassword}
                                        value={formData.password}
                                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color="#CCC" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Permissions Matrix */}
                        <View className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-10">
                            <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px] mb-6">Assign Access Privileges</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {accessesDispo.map((item, index) => {
                                    const isSelected = formData.accesses.includes(item as AdminAccess);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => toggleAccess(item as AdminAccess)}
                                            className={`px-4 py-2.5 rounded-xl border ${isSelected ? 'bg-black border-black' : 'bg-gray-50 border-gray-100'}`}
                                        >
                                            <Text className={`text-[10px] font-black uppercase ${isSelected ? 'text-white' : 'text-black/40'}`}>{item}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={loading}
                            className="bg-black py-5 rounded-xl items-center mb-10 shadow-lg"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-[12px] uppercase tracking-[4px]">Deploy Admin</Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddAdmin;