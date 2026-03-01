import { colors } from '@/constants';
import React, { memo } from 'react'
import { View, Text, Image, TextInput, useColorScheme, StyleSheet } from 'react-native';

const CustomInput = ({
    tittle,
    className,
    style,
    inputClassName,
    inputStyle,
    tittleClassName,
    tittleStyle,
    placeholder,
    icon,
    iconClassname,
    iconStyle,
    numberOfLines,
    value,
    onChangeText,
    ...rest
}: any) => {

  const theme = useColorScheme(); 
  
  return (
    <View 
      className={`w-full p-4 ${className}`} 
      style={style}
    >
        {/* Title */}
        {tittle && (
          <Text
            className={`text-blackScale-900 dark:text-whiteScale-900 font-bold mb-2 mx-2 self-start ${tittleClassName}`}
            style={tittleStyle}
          >
            {tittle + ' : '}
          </Text>
        )}

        <View className="w-full h-fit relative justify-center">
          <TextInput 
              placeholder={placeholder}
              className={`bg-whiteScale-10 dark:bg-blackScale-10 text-blackScale-900 dark:text-whiteScale-900 w-full min-h-7 px-5 rounded-full border border-gray-200 dark:border-gray-800 ${icon ? 'pr-14' : ''} ${inputClassName}`}
              style={[
                inputStyle,
                { textAlignVertical: numberOfLines ? 'top' : 'center' }
              ]}
              placeholderTextColor={colors.dark[500]}
              numberOfLines={numberOfLines}
              value={value}
              autoComplete="off"
              onChangeText={onChangeText}
              {...rest}
          />

          {/* Icon handling */}
          {icon && (
            <Image
              source={typeof icon === 'string' ? { uri: icon } : icon}
              className={`w-6 h-6 absolute right-5 ${iconClassname}`}
              style={iconStyle}
              resizeMode="contain"
            />
          )}
        </View>
    </View>
  )
}

export default memo(CustomInput);