import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOwner } from '@/contexts/owner';


const HomeCollectionsEditor = () => {
    const router = useRouter();
    const { ownerInfo } = useOwner();

    return (
        <TouchableOpacity
            onPress={() => router.push({
                pathname: '/screens/collectionsManagement',
                params: {
                    type: 'homeCollections',
                    title: 'Home Collections',
                    currentSelected: (ownerInfo?.homeCollections || []).join(',')
                }
            })}
            activeOpacity={0.7}
            className="w-full px-5 py-6 rounded-xl mt-5"
            style={{ backgroundColor: colors.light[200] }}
        >
            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-lg font-bold" style={{ color: colors.dark[100] }}>Home Collections</Text>
                    <Text className="text-xs opacity-50" style={{ color: colors.dark[100] }}>Featured on your home screen</Text>
                </View>
                <View className="flex-row items-center">
                    <View className="px-4 py-2 rounded-xl mr-2" style={{ backgroundColor: colors.dark[100] }}>
                        <Text className="font-bold text-xs" style={{ color: colors.light[100] }}>{(ownerInfo?.homeCollections || []).length}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.dark[100]} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default HomeCollectionsEditor;