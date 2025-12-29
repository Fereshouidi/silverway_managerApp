import { colors, icons } from '@/constants'
import React from 'react'
import { GestureResponderEvent, Image, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native'

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
        className={`relative- w-full h-[60px] flex flex-row justify-center items-center ${className}`}
        style={[{ backgroundColor: colors.light[100] }, style]}
    >

        {onBackButtonPress && <TouchableOpacity 
            className='w-[60px] h-full absolute left-0 flex justify-center items-center'
            onPress={onBackButtonPress}
        >
            <Image
                source={icons.back}
                className='w-6 h-6'

            />
        </TouchableOpacity>}


        <View className='max-w-[60%] h-full absolute left-[50%] translate-x-[-50%] flex justify-center items-center'>
            <Text className='text-center text-lg font-semibold'>{title}</Text>

        </View>

        <View className='absolute right-2'>
            {items}
        </View>

    </View>
  )
}

export default Header
