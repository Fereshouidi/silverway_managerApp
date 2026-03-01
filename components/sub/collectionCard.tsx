"use client";
import React, { useState } from 'react';
import { View, Text, Image, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { CollectionType } from '@/types';
import { colors } from '@/constants';
import SkeletonLoading from './SkeletonLoading';

type CollectionCardType = {
    collection: CollectionType;
    isLoading: boolean;
    collectionsSelected: string[], 
    setCollectionsSelected: (value: string[]) => void
    collections: CollectionType[]
    setCollections: (value: CollectionType[]) => void
};

const CollectionCard = ({ 
    collection, 
    isLoading,  
    collectionsSelected,
    setCollectionsSelected,
    collections,
    setCollections
}: CollectionCardType) => {
    
    const [isPressed, setIsPressed] = useState(false);
    const router = useRouter();
    
    const isSelected = collectionsSelected.includes(collection._id || "");
    const isArchived = collection.status === "archived";

    const handlePress = () => {
        if (isArchived) return;

        if (collectionsSelected?.length > 0) {
            if (isSelected) {
                setCollectionsSelected(collectionsSelected.filter(id => id !== collection._id));
            } else {
                setCollectionsSelected([...collectionsSelected, collection._id!]);
            }
        } else {
            if (!collection._id) return;
            router.push({ pathname: '/screens/collectionDetails/[id]', params: { id: collection._id } });
        }
    };

    return (
        <Pressable
            onPressIn={() => !isArchived && setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={handlePress}
            onLongPress={() => !isArchived && setCollectionsSelected([...collectionsSelected, collection._id || ""])}
            className="w-[47%] h-[200px] mb-5 self-center"
        >
            <MotiView
                animate={{
                    scale: isPressed ? 0.98 : 1,
                    // التغيير هنا ليتطابق مع الـ ProductCard
                    backgroundColor: isSelected ? colors.light[300] : colors.light[200],
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: colors.light[950],
                }}
                transition={{ type: 'timing', duration: 200 }}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 8, 
                    overflow: 'hidden',
                    opacity: isArchived ? 0.3 : 1,
                    ...Platform.select({
                        ios: {
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isSelected ? 0.2 : 0.05,
                            shadowRadius: 10,
                        },
                        android: {
                            elevation: isSelected ? 6 : 4,
                        },
                    }),
                }}
            >
                {/* Image Section */}
                <View 
                    style={{ backgroundColor: colors.dark[300] }}
                    className="w-full h-[80%] items-center justify-center relative"
                >
                    {collection.thumbNail ? (
                        <Image 
                            source={{ uri: collection.thumbNail }} 
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : isLoading ? (
                        <SkeletonLoading />
                    ) : null}

                    {/* Selection Indicator */}
                    {isSelected && (
                        <View 
                            className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center shadow-md"
                            style={{ backgroundColor: colors.light[950] }}
                        >
                            <Text className="text-white text-[10px] font-black">✓</Text>
                        </View>
                    )}
                </View>

                {/* Text Section */}
                <View className="flex-1 justify-center p-3">
                    {collection.name?.en ? (
                        <Text 
                            style={{ color: colors.dark[150] }}
                            className="text-center font-bold text-sm"
                            numberOfLines={1}
                        >
                            {collection.name.en}
                        </Text>
                    ) : (
                        <View className="h-4">
                            <SkeletonLoading />
                        </View>
                    )}
                </View>
            </MotiView>
        </Pressable>
    );
};

export default CollectionCard;