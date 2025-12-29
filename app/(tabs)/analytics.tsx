import { useLoadingScreen } from '@/contexts/loadingScreen';
import React, { useEffect } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const analytics = () => {

  // const { setLoadingScreen } = useLoadingScreen();

  // useEffect(() => {

  // }, [])

  // setLoadingScreen(true, "any thext ...")
  
  return (
    <SafeAreaView className='w-full h-full'>
      <ScrollView className='w-full h-full p-5'>

        <Text className=' text-[20px] font-bold'>analytics</Text>

      </ScrollView>
    </SafeAreaView>

  );
}
export default analytics;