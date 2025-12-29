import { backEndUrl } from '@/api';
import CollectionCard from '@/components/sub/collectionCard';
import { colors } from '@/constants';
import { CollectionType } from '@/types';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const Collections = () => {

  const [allCollections, setAllCollections] = useState<CollectionType[]>([]);
  const [ isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {

    setIsLoading(true);
    getAllCollections()
    setIsLoading(false);

  }, [])

  const onRefresh = () => {
    setRefreshing(true);
    getAllCollections();
    setRefreshing(false);
  }

  const getAllCollections = async () => {
    await axios.get( backEndUrl + "/getAllCollections")
    .then(({ data }) => {
      setAllCollections(data.allCollections);
      console.log({collectionsLength : data.allCollections.length});
    })
    .catch(( err ) => {
      console.log({err});
      alert("something went wrong while fetching the collections !")
    })
  }

  return (
    <View 
      className='w-screen h-screen- pt-2-'
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.light[100],
      }}
    >
      {/* <Text className='text'>All Collections</Text> */}

      <ScrollView 
        className='w-full h-full pt-2 bg-red-500-'
        contentContainerStyle={{
            flexDirection: "column",
            paddingBottom: 100,
            alignItems: "center",
        }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.dark[200]]} // Android
            tintColor={colors.dark[200]} // iOS
            title={'loading...'}
            titleColor={'#000'}
          />
        }
      >

        <View className='flex flex-row flex-wrap justify-between gap-5 px-5'>
          {allCollections.map((colection, index) => (
            <CollectionCard
              key={index}
              collection={colection}
              isLoading={isLoading}
            />
          ))}
        </View>


      </ScrollView>

    </View>
  );
}
export default Collections;