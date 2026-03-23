import { colors } from '@/constants';
import { ButtonParams } from '@/types';
import React, { memo } from 'react'
import { TouchableOpacity, View, Text, Image, useColorScheme, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native'
import * as Haptics from 'expo-haptics';

const Button = ({
    tittle,
    onPress,
    className,
    textClassName,
    icon,
    isWork,
    textStyle,
    style,
    iconStyle,
    iconClassName
}: ButtonParams) => {

    const theme = useColorScheme();
    const isDark = theme === 'dark';

    const handlePress = () => {
        if (isWork) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress && onPress();
        }
    }

    return (
        <TouchableOpacity
            className={`w-[90%] mt-5 h-14 flex flex-row justify-center items-center rounded-full ${isWork ? 'shadow-sm' : 'opacity-50'} ${className}`}
            style={[
                {
                    shadowColor: '#0000008a',
                    backgroundColor: colors.dark[100],
                },
                style as ViewStyle
            ]}
            activeOpacity={0.7}
            onPress={handlePress}
        >
            <Text
                className={`font-bold ${textClassName}`}
                style={[
                    {
                        color: colors.light[200],
                    },
                    textStyle as TextStyle
                ]}
            >{tittle}</Text>

            {icon && <Image
                source={icon}
                className={`w-4 h-4 mx-2 opacity-80 ${iconClassName}`}
                resizeMode="contain"
                style={[
                    { tintColor: colors.light[100] },
                    iconStyle as ImageStyle
                ]}
            />}

        </TouchableOpacity>
    )
}

export default memo(Button);
