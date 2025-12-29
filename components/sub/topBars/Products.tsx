import { colors, icons } from '@/constants'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Image, Pressable, TouchableOpacity, View, Text } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProductType } from '@/types';

type props = {
    searchBarActive: boolean, 
    setSearchBarActive: (value: boolean) => void
    productsSelected: ProductType[], 
    setProductsSelected: (value: ProductType[]) => void
}

const TopBarForProductsPage = ({
  searchBarActive,
  setSearchBarActive,
  productsSelected, 
  setProductsSelected
}: props) => {

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  //   // 2. وظيفة زر "اختيار الكل"
  // const toggleSelectAll = () => {
  //   if (isAllSelected) {
  //     setSelectedIds([]); // إلغاء تحديد الكل
  //   } else {
  //     const allIds = products.map(p => p._id);
  //     setSelectedIds(allIds); // تحديد الكل
  //   }
  // };
  
  return (
      <View className='bg-red-500- flex flex-row justify-between items-center h-[60px]'>

        <View className='w-[27.5%] h-full  flex flex-row justify-center items-center gap-5-'>

          <View className='w-[40%] h-full  flex flex-row justify-center gap-5'>

            <TouchableOpacity 
              className='w-full h-full flex justify-center items-center'
            >
                <Image
                  source={icons.trash}
                  className='w-6 h-6'
                />
            </TouchableOpacity>
          </View>

          <View className='w-[40%] h-full flex flex-row justify-center gap-5'>
            <TouchableOpacity 
              className='w-full h-full flex justify-center items-center'
              onPress={() => router.push("/screens/makeNewProduct")}
            >
              <Image
                source={icons.plus}
                className='w-6 h-6'
              />
            </TouchableOpacity>

          </View>

        </View>


        <View className='w-[27.5%] h-full flex flex-row justify-center items-center bg-red-500- gap-2'>

          <View className='w-[40%] bg-blue-300- h-full flex flex-row justify-center gap-5-'>
            <TouchableOpacity 
              className='w-full h-full flex justify-center items-center'
              onPress={() => setSearchBarActive(!searchBarActive)}
            >
              <Image
                source={icons.searchBlack}
                className='w-6 h-6'
              />
            </TouchableOpacity>

          </View>

          <TouchableOpacity 
            // onPress={toggleSelectAll}
            className="flex-row items-center p-1 rounded"
          >
            <MaterialCommunityIcons 
              name={false ? "checkbox-marked" : "checkbox-blank-outline"} 
              size={24} 
              color={false ? "#000" : colors.dark[100]} 
            />
          </TouchableOpacity>
        </View>

      </View>
  )
}

export default TopBarForProductsPage
