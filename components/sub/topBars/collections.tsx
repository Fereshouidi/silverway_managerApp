import { icons } from '@/constants'
import { router } from 'expo-router'
import React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

const TopBarForCollectionsPage = () => {
  return (
      <View className='bg-red-500- flex flex-row justify-between items-center h-[60px]'>

        <View className='w-[27.5%] h-full  flex flex-row justify-center gap-5'>

          <TouchableOpacity 
            className='w-full h-full flex justify-center items-center'
          >
              <Image
                source={icons.trash}
                className='w-6 h-6'
              />
          </TouchableOpacity>
        </View>

        <View className='w-[27.5%] h-full flex flex-row justify-center bg-red-500- gap-5'>
          <TouchableOpacity 
            className='w-full h-full flex justify-center items-center'
            onPress={() => router.push("/screens/makeNewCollection")}
          >
            <Image
              source={icons.plus}
              className='w-6 h-6'
            />
          </TouchableOpacity>

        </View>

      </View>
  )
}

export default TopBarForCollectionsPage
