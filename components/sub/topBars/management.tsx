import { colors } from '@/constants'
import { router } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View, Text, ActivityIndicator } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
    onSave: () => void;
    isSaving: boolean;
    hasChanges: boolean;
}

const TopBarForManagement = ({
    onSave,
    isSaving,
    hasChanges = false
}: Props) => {

    return (
        <View 
            className='flex flex-row justify-between items-center h-[60px] px-4'
            style={{ backgroundColor: colors.light[100] }}
        >
            {/* الجهة اليسرى: زر الرجوع */}
            <View className='w-[20%] h-full flex flex-row items-center'>
                <TouchableOpacity 
                    className='w-10 h-10 flex justify-center items-center rounded-full'
                    onPress={() => router.back()}
                    style={{ backgroundColor: colors.light[200] }}
                >
                    <MaterialCommunityIcons 
                        name="chevron-left" 
                        size={28} 
                        color={colors.dark[100]} 
                    />
                </TouchableOpacity>
            </View>

            {/* المنتصف: عنوان الصفحة */}
            <View className='flex-1 h-full justify-center items-center'>
                <Text className='font-bold text-lg' style={{ color: colors.dark[100] }}>
                    Management
                </Text>
            </View>

            {/* الجهة اليمنى: زر الحفظ (المطور) */}
            <View className='w-[20%] h-full flex flex-row justify-end items-center'>
                <TouchableOpacity 
                    disabled={isSaving || !hasChanges}
                    onPress={onSave}
                    className='w-10 h-10 flex justify-center items-center rounded-full'
                    style={{ 
                        // يتغير اللون إلى الداكن فقط عند وجود تغييرات
                        backgroundColor: hasChanges ? colors.dark[100] : colors.light[200],
                        // إضافة ظل بسيط إذا كان نشطاً
                        elevation: hasChanges ? 2 : 0,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        opacity: isSaving ? 0.7 : 1
                    }}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color={colors.light[100]} />
                    ) : (
                        <MaterialCommunityIcons 
                            name="check" 
                            size={24} 
                            // يتغير لون الأيقونة للأبيض إذا كان الزر داكناً
                            color={hasChanges ? colors.light[100] : colors.dark[100] + '40'} 
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default TopBarForManagement;