import { colors } from '@/constants'
import React from 'react'
import { Text, TouchableOpacity, View, Image, TextInput, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

type BannerType = 'heroBanner' | 'bottomBanner';
type SizeType = 'sm' | 'md';

type Props = {
    pubData: any;
    setPubData: (data: any) => void;
}

const PubsSection = ({ pubData, setPubData }: Props) => {

    const updateTopBar = (text: string, lang: 'en' | 'fr') => {
        setPubData({
            ...pubData,
            topBar: { ...pubData.topBar, [lang]: text }
        });
    };

    const pickImage = async (banner: BannerType, size: SizeType) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: size === 'sm' ? [1, 1] : [16, 9], // مثال: مربع للصغير وعريض للكبير
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setPubData({
                ...pubData,
                [banner]: { 
                    ...pubData[banner], 
                    [size]: uri 
                }
            });
        }
    };

    // مكوّن فرعي لاختيار الصورة لمنع تكرار الكود
    const ImagePickerBox = ({ banner, size, label }: { banner: BannerType, size: SizeType, label: string }) => (
        <View className="w-[48%] gap-y-2 mb-4">
            <Text className="text-[10px] opacity-40 font-bold uppercase ml-1">{label}</Text>
            <TouchableOpacity onPress={() => pickImage(banner, size)} className="relative">
                <Image 
                    source={{ uri: pubData?.[banner]?.[size] }} 
                    className="w-full h-28 rounded-2xl bg-slate-200"
                    resizeMode="cover"
                />
                <View 
                    className="absolute bottom-2 right-2 w-7 h-7 rounded-full items-center justify-center shadow-sm"
                    style={{ backgroundColor: colors.dark[100] }}
                >
                    <MaterialCommunityIcons name="camera" size={14} color={colors.light[100]} />
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="mt-6 rounded-[32px] p-6" style={{ backgroundColor: colors.light[200] }}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-5">
                <View>
                    <Text className="text-lg font-bold" style={{ color: colors.dark[100] }}>
                        Store Advertisements
                    </Text>
                    <Text className="text-xs opacity-40 font-medium">Manage all 4 banner sizes</Text>
                </View>
                {/* <MaterialCommunityIcons name="image-multiple-outline" size={24} color={colors.dark[100]} /> */}
            </View>

            <View className="gap-y-5">
                {/* TextInput الحقل النصي */}
                <View className="gap-y-2">
                    <Text className="text-[10px] opacity-40 font-bold ml-1 uppercase">Top Bar Message (FR)</Text>
                    <TextInput 
                        className="p-4 rounded-2xl text-xs font-semibold"
                        style={{ backgroundColor: colors.light[100], color: colors.dark[100] }}
                        value={pubData?.topBar?.fr}
                        onChangeText={(t) => updateTopBar(t, 'fr')}
                        placeholder="Message en français..."
                    />
                </View>

                {/* قسم صور الـ Hero */}
                <View>
                    <Text className="text-xs font-bold mb-3 opacity-60" style={{ color: colors.dark[100] }}>Hero Banners</Text>
                    <View className="flex-row justify-between flex-wrap">
                        <ImagePickerBox banner="heroBanner" size="sm" label="Hero Small (Mobile)" />
                        <ImagePickerBox banner="heroBanner" size="md" label="Hero Medium (Tablet)" />
                    </View>
                </View>

                {/* قسم صور الـ Bottom */}
                <View>
                    <Text className="text-xs font-bold mb-3 opacity-60" style={{ color: colors.dark[100] }}>Bottom Banners</Text>
                    <View className="flex-row justify-between flex-wrap">
                        <ImagePickerBox banner="bottomBanner" size="sm" label="Bottom Small" />
                        <ImagePickerBox banner="bottomBanner" size="md" label="Bottom Medium" />
                    </View>
                </View>
            </View>
        </View>
    )
}

export default PubsSection;