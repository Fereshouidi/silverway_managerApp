import { colors, icons } from '@/constants'
import React from 'react'
import { Image, TextInput, TouchableOpacity, View } from 'react-native'

const SearchBar = () => {
  return (
    <View 
        className={`w-full h-full h-[80px]- py-1 flex justify-center items-center`}
        style={{
            backgroundColor: colors.light[100],
        }}
    >

        <View
            className='w-[90%] h-[78%] rounded-full flex flex-row border-[0.5px]'
            style={{
                backgroundColor: colors.light[100],
                borderColor: colors.light[300]
            }}
        >
            <TextInput
                placeholder='search...'
                className=' h-full rounded-sm flex flex-1 px-7 pr-[60px] text-black'
                placeholderTextColor={colors.dark[600]}
            />

            <TouchableOpacity 
                className='w-[47px] h-[85%] flex justify-center items-center rounded-full bg-black absolute right-[5px] top-[50%] translate-y-[-50%]'
            >
                <Image
                    source={icons.searchWhite}
                    className='w-6 h-6'
                />
            </TouchableOpacity>
            
        </View>

    </View>
  )
}

export default SearchBar
