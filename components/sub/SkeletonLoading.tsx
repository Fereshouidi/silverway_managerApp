
import { colors } from '@/constants';
import '@/global.css';
import React from 'react';
import { View } from 'react-native';

const SkeletonLoading = () => {


  return (

    <View 
        className='w-full h-full relative overflow-hidden'
        style={{
            backgroundColor: colors.light[300]
        }}
    >
        <View 
            className='w-[50%] h-full absolute top-0 left-0 animate-move'
            style={{
                backgroundColor: colors.light[350],
                boxShadow: `5px 5px 70px ${colors.light[350]}`
            }}
        >

        </View>
    </View>
  )
}

export default SkeletonLoading
