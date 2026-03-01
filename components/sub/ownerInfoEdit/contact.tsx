import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type ContactData = {
    email: string;
    mailPassword?: string;
    phone: string; // سنعالج الرقم كنص في الإدخال لسهولة التعامل
};

type Props = {
    contact: ContactData;
    setContact: (value: ContactData) => void;
};

const ContactInfoEditor = ({ contact, setContact }: Props) => {
    const [showPassword, setShowPassword] = useState(false);

    const updateField = (field: keyof ContactData, value: string) => {
        setContact({ ...contact, [field]: value });
    };

    return (
        <View className="w-full px-5 py-6 rounded-3xl mt-5" style={{ backgroundColor: colors.light[200] }}>
            <Text className="text-lg font-bold mb-5" style={{ color: colors.dark[100] }}>
                Contact Details
            </Text>

            {/* Email Field */}
            <View className="mb-4">
                <Text className="text-xs mb-1 ml-1 opacity-50" style={{ color: colors.dark[100] }}>Official Email</Text>
                <View className="flex-row items-center p-3 rounded-2xl" style={{ backgroundColor: colors.light[100] }}>
                    <Ionicons name="mail-outline" size={20} color={colors.dark[100]} className="mr-2" />
                    <TextInput
                        value={contact.email}
                        onChangeText={(v) => updateField('email', v)}
                        placeholder="example@mail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="flex-1 ml-2"
                        style={{ color: colors.dark[100] }}
                    />
                </View>
            </View>

            {/* Mail Password Field */}
            <View className="mb-4">
                <Text className="text-xs mb-1 ml-1 opacity-50" style={{ color: colors.dark[100] }}>Mail App Password</Text>
                <View className="flex-row items-center p-3 rounded-2xl" style={{ backgroundColor: colors.light[100] }}>
                    <Ionicons name="key-outline" size={20} color={colors.dark[100]} className="mr-2" />
                    <TextInput
                        value={contact.mailPassword}
                        onChangeText={(v) => updateField('mailPassword', v)}
                        placeholder="Enter app password"
                        secureTextEntry={!showPassword}
                        className="flex-1 ml-2"
                        style={{ color: colors.dark[100] }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons 
                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color={colors.dark[100]} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Phone Number Field */}
            <View>
                <Text className="text-xs mb-1 ml-1 opacity-50" style={{ color: colors.dark[100] }}>Phone Number</Text>
                <View className="flex-row items-center p-3 rounded-2xl" style={{ backgroundColor: colors.light[100] }}>
                    <Ionicons name="call-outline" size={20} color={colors.dark[100]} className="mr-2" />
                    <TextInput
                        value={contact.phone}
                        onChangeText={(v) => updateField('phone', v)}
                        placeholder="12345678"
                        keyboardType="phone-pad"
                        className="flex-1 ml-2"
                        style={{ color: colors.dark[100] }}
                    />
                </View>
            </View>
        </View>
    );
};

export default ContactInfoEditor;