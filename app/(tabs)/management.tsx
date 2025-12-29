import React from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Management = () => {
  return (
    <SafeAreaView className='w-full h-full'>
      <ScrollView className='w-full h-full p-5'>

        <Text className=' text-[20px] font-bold'>Management</Text>

      </ScrollView>
    </SafeAreaView>
  );
}
export default Management;