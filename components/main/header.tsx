import { colors } from '@/constants'
import React from 'react'
import { GestureResponderEvent, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';

type HeaderProps = {
    onBackButtonPress?: (event: GestureResponderEvent) => void
    title: string
    className?: string
    style?: StyleProp<ViewStyle>
    items?: React.ReactNode
}

const Header = ({
    onBackButtonPress,
    title,
    className,
    style,
    items
}: HeaderProps) => {

  return (
    <View 
        className={`w-full h-[45px] flex-row items-center px-4 relative- ${className}`}
        style={[{ backgroundColor: colors.light[100] }, style]}
    >
        {/* الجهة اليسرى: زر الرجوع */}
        <View className="z-20">
            {onBackButtonPress && (
                <TouchableOpacity 
                    className='w-10 h-10 ml-2 flex justify-center items-center rounded-full'
                    onPress={onBackButtonPress}
                    style={{ backgroundColor: colors.light[200] }}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons 
                        name="chevron-left" 
                        size={28} 
                        color={colors.dark[100]} 
                    />
                </TouchableOpacity>
            )}
        </View>

        {/* المنتصف: العنوان باستخدام التموضع المطلق لضمان التوسط الحقيقي */}
        <View 
            className="absolute left-0 right-0 top-0 bottom-0 flex justify-center items-center pointer-events-none"
            style={{ zIndex: 10 }}
        >
            <View className="px-16 w-full items-center">
                <Text 
                    className='text-lg font-bold' 
                    numberOfLines={1}
                    style={{ color: colors.dark[100] }}
                >
                    {title}
                </Text>
            </View>
        </View>

        {/* الجهة اليمنى: العناصر الإضافية */}
        <View className='flex-1 flex-row justify-end items-center z-20'>
            {items}
        </View>
    </View>
  )
}

export default Header