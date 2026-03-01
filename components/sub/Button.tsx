import { colors } from '@/constants';
import { ButtonParams } from '@/types';
import React, { memo } from 'react'
import { TouchableOpacity, View, Text, Image, useColorScheme } from 'react-native'

const Button = ({
    tittle,
    onPress,
    className,
    textClassName,
    icon,
    isWork,
    textStyle,
    style
}: ButtonParams) => {

    const theme = useColorScheme(); 
    const isDark = theme === 'dark';
    
  return (
    <TouchableOpacity
        className={`w-[90%] mt-5 h-14 flex flex-row justify-center items-center rounded-full ${isWork? 'shadow-sm' : 'opacity-50'} ${className}`}
        style={{
            shadowColor: '#0000008a',
            backgroundColor: colors.dark[100]
        }}
        activeOpacity={0.5}
        onPress={isWork ? onPress : undefined}
    >
        <Text 
            className={`font-bold ${className}`}
            style={{
                color: colors.light[200],
            }}
        >{tittle}</Text>

        {icon && <Image
            source={icon}
            className='w-5 h-5 mx-2'
        />}

    </TouchableOpacity>
  )
}

export default memo(Button);
