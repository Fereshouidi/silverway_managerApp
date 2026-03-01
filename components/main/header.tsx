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
        className={`w-full h-16 flex-row items-center px-4 ${className}`}
        style={[{ backgroundColor: colors.light[100] }, style]}
    >
        {/* الجهة اليسرى: زر الرجوع */}
        <View className="w-10">
            {onBackButtonPress && (
                <TouchableOpacity 
                    className='w-10 h-10 flex justify-center items-center rounded-full'
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

        {/* المنتصف: العنوان */}
        <View className='flex-1 items-center justify-center'>
            <Text 
                className='text-lg font-bold' 
                numberOfLines={1}
                style={{ color: colors.dark[100] }}
            >
                {title}
            </Text>
        </View>

        {/* الجهة اليمنى: العناصر الإضافية */}
        <View className='min-w-[40px] flex-row justify-end items-center'>
            {items}
        </View>
    </View>
  )
}

export default Header