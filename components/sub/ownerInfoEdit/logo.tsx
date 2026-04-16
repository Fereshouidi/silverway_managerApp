import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type Props = {
    logo: { dark: string, light: string };
    setLogo: (value: { dark: string, light: string }) => void;
};

const LogoEditor = ({ logo, setLogo }: Props) => {

    const pickImage = async (type: 'dark' | 'light') => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1], // الشعارات عادة ما تكون مربعة أو دائرية
            quality: 1,
        });

        if (!result.canceled) {
            setLogo({ ...logo, [type]: result.assets[0].uri });
        }
    };

    const LogoBox = ({ type, uri }: { type: 'dark' | 'light', uri: string }) => (
        <View className="flex-1">
            <View className="flex-row items-center mb-3 ml-1">
                <MaterialCommunityIcons
                    name={type === 'light' ? "white-balance-sunny" : "moon-waning-crescent"}
                    size={14}
                    color={colors.dark[100]}
                    style={{ opacity: 0.6 }}
                />
                <Text className="text-[10px] font-bold uppercase tracking-widest ml-2 opacity-40" style={{ color: colors.dark[100] }}>
                    {type} Mode
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => pickImage(type)}
                activeOpacity={0.7}
                className="w-full h-44 rounded-[24px] border-2 border-dashed flex justify-center items-center overflow-hidden relative"
                style={{
                    backgroundColor: type === 'light' ? colors.light[100] : colors.dark[100],
                    borderColor: colors.dark[100] + '20'
                }}
            >
                {uri ? (
                    <>
                        <Image source={{ uri }} className="w-full h-full" resizeMode="contain" />
                        {/* Overlay للتعديل */}
                        <View className="absolute inset-0 bg-black/5 flex items-center justify-center">
                            <View className="absolute right-2 bottom-2 bg-white/90 p-2 rounded-full shadow-sm">
                                <MaterialCommunityIcons name="pencil" size={16} color="#000" />
                            </View>
                        </View>
                    </>
                ) : (
                    <View className="items-center">
                        <View
                            className="w-12 h-12 rounded-full items-center justify-center mb-2"
                            style={{ backgroundColor: type === 'light' ? colors.dark[100] + '10' : colors.light[100] + '20' }}
                        >
                            <MaterialCommunityIcons
                                name="upload"
                                size={20}
                                color={type === 'light' ? colors.dark[100] : colors.light[100]}
                            />
                        </View>
                        <Text className="text-[10px] font-medium opacity-40" style={{ color: type === 'light' ? colors.dark[100] : colors.light[100] }}>
                            Upload Logo
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="w-full px-6 py-8 rounded-[32px] mt-6" style={{ backgroundColor: colors.light[200] }}>
            <View className="flex-row items-center justify-between mb-6">
                <View>
                    <Text className="text-xl font-bold" style={{ color: colors.dark[100] }}>Logo</Text>
                    <Text className="text-xs opacity-40 font-medium">Choose your company's logo</Text>
                </View>
                <View className="p-3 rounded-xl bg-white/50">
                    <MaterialCommunityIcons name="drawing" size={20} color={colors.dark[100]} />
                </View>
            </View>

            <View className="flex-row gap-x-4">
                <LogoBox type="light" uri={logo?.light} />
                <LogoBox type="dark" uri={logo?.dark} />
            </View>

            {/* Note لمحاذاة الهوية */}
            <View className="mt-6 p-4 rounded-xl flex-row items-center border border-black/5" style={{ backgroundColor: colors.light[100] }}>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.dark[100]} style={{ opacity: 0.5 }} />
                <Text className="text-[10px] ml-2 flex-1 opacity-50 font-medium" style={{ color: colors.dark[100] }}>
                    Please upload a square logo that fills the entire image area without any empty margins.
                </Text>
            </View>
        </View>
    );
};

export default LogoEditor;