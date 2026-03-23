import { backEndUrl } from '@/api';
import CollectionCard from '@/components/sub/collectionCard';
import { colors } from '@/constants';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { CollectionType } from '@/types';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  CollectionsSelected: string[],
  setCollectionsSelected: (value: string[]) => void
  collections: CollectionType[]
  setCollections: (value: CollectionType[]) => void
}

const Collections = ({
  CollectionsSelected,
  setCollectionsSelected,
  collections,
  setCollections
}: Props) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const { setStatusBanner } = useStatusBanner();

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
    await axios.get(backEndUrl + "/getAllCollections")
      .then(({ data }) => {
        setCollections([...data.allCollections].reverse());
        console.log({ collectionsLength: data.allCollections?.length });
      })
      .catch((err) => {
        console.log({ err });
        setStatusBanner(true, "something went wrong while fetching the collections !", "error");
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
          paddingBottom: 110 + insets.bottom,
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
          {collections.map((colection, index) => (
            <CollectionCard
              key={index}
              collection={colection}
              isLoading={isLoading}
              collectionsSelected={CollectionsSelected}
              setCollectionsSelected={setCollectionsSelected}
              collections={collections}
              setCollections={setCollections}
            />
          ))}
        </View>


      </ScrollView>

    </View>
  );
}
export default Collections;