import React, { useState } from 'react';
import { View, Text, Image, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti'; // سنستخدمها للتحريك السلس بدلاً من hover

import { CollectionType, FiltrationType } from '@/types';
import { useLoadingScreen } from '@/contexts/loadingScreen';
import { colors } from '@/constants';
import SkeletonLoading from './SkeletonLoading';

type CollectionCardType = {
    collection: CollectionType;
    isLoading: boolean;
};

const CollectionCard = ({ collection, isLoading }: CollectionCardType) => {
    
    const [isPressed, setIsPressed] = useState(false);
    const router = useRouter();
    const { setLoadingScreen } = useLoadingScreen();


    return (
        <Pressable
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            className="w-[47%] h-[200px] mb-5 self-center"
            onPress={() => {
                if (!collection._id) return;
                router.push({ pathname: '/screens/collectionDetails/[id]', params: { id: collection._id } })
            }}
        >
            <MotiView
                animate={{
                    scale: isPressed ? 0.98 : 1, // تأثير الضغط بدلاً من الـ hover
                    shadowOpacity: isPressed ? 0.2 : 0.05,
                }}
                transition={{ type: 'timing', duration: 200 }}
                style={{
                    width: "100%", // الموبايل يحتاج مقاسات ثابتة أو flex
                    height: "100%",
                    backgroundColor: colors.light[100],
                    borderRadius: 8,
                    overflow: 'hidden',
                    // ظلال متوافقة مع أندرويد و iOS
                    ...Platform.select({
                        ios: {
                            shadowColor: "#0d0d0d",
                            shadowOffset: { width: 0, height: 4 },
                            shadowRadius: 10,
                        },
                        android: {
                            elevation: 4,
                        },
                    }),
                }}
            >
                <View 
                    style={{ backgroundColor: colors.light[300] }}
                    className="w-full h-[80%] items-center justify-center"
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
                </View>

                <View className="flex-1 justify-center p-3">
                    {collection.name?.en ? (
                        <Text 
                            style={{ color: colors.dark[150] }}
                            className="text-center font-bold text-base"
                        >
                            {collection.name.en}
                        </Text>
                    ) : (
                        <View className="h-6">
                            <SkeletonLoading />
                        </View>
                    )}
                </View>
            </MotiView>
        </Pressable>
    );
};

export default CollectionCard;