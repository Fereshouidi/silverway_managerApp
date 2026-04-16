import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { backEndUrl } from '@/api';
import { useOwner } from '@/contexts/owner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';

const CollectionsManagement = () => {
    const { type, title, currentSelected } = useLocalSearchParams<{ type: string, title: string, currentSelected: string }>();
    const router = useRouter();
    const { setOwnerInfo } = useOwner();

    const [loading, setLoading] = useState(false);
    const [allCollections, setAllCollections] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (currentSelected) setSelectedIds(currentSelected.split(',').filter(i => i !== ""));
    }, [currentSelected]);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${backEndUrl}/getAllCollections`);
                if (res.data.allCollections) setAllCollections(res.data.allCollections);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const toggle = (id: string) => {
        const updated = selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id];
        setSelectedIds(updated);
        if (type) setOwnerInfo((prev: any) => ({ ...prev, [type]: updated }));
    };

    const filtered = allCollections.filter(c =>
        (c.name.en || c.name.fr || "").toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.light[100] }}>
            <ActivityIndicator color={colors.dark[100]} />
        </View>
    );

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.light[100] }}>
            {/* Header مبسط */}
            <View className="px-6 py-4 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.dark[100]} />
                </TouchableOpacity>
                <Text className="text-lg font-bold" style={{ color: colors.dark[100] }}>{title}</Text>
                <View className="w-6" />
            </View>

            <View className="px-6 mb-4">
                <TextInput
                    placeholder="Search..."
                    placeholderTextColor="#A3A3A3"
                    value={search}
                    onChangeText={setSearch}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: colors.light[200], color: colors.dark[100] }}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {filtered.map((item) => {
                    const isSelected = selectedIds.includes(item._id);
                    return (
                        <TouchableOpacity
                            key={item._id}
                            onPress={() => toggle(item._id)}
                            activeOpacity={0.7}
                            className="flex-row items-center px-6 py-3 border-b border-gray-50"
                        >
                            <Image source={{ uri: item.thumbNail }} className="w-12 h-12 rounded-xl bg-gray-100" />
                            <View className="flex-1 ml-4">
                                <Text className="font-semibold" style={{ color: colors.dark[100] }}>
                                    {item.name.en || item.name.fr}
                                </Text>
                                <View className="flex-row items-center mt-3 ml-3 overflow-hidden">
                                    {/* نص الحالة */}
                                    <Text
                                        className="text-[9px] font-bold uppercase tracking-[1px]"
                                        style={{ color: colors.dark[100], opacity: 0.4 }}
                                    >
                                        {item.type}
                                    </Text>

                                    {/* فاصل نقطي بسيط */}
                                    <View
                                        className="w-1 h-1 rounded-full mx-2"
                                        style={{ backgroundColor: colors.dark[100], opacity: 0.2 }}
                                    />

                                    {/* نص أسلوب العرض */}
                                    <Text
                                        className="text-[9px] font-bold uppercase tracking-[1px]"
                                        style={{ color: colors.dark[100], opacity: 0.4 }}
                                    >
                                        {item.display === "vertical" ? "Grid (Normal)" : "Slider"}
                                    </Text>
                                </View>

                            </View>
                            <MaterialCommunityIcons
                                name={isSelected ? "checkbox-marked-circle" : "plus-circle-outline"}
                                size={24}
                                color={isSelected ? colors.dark[100] : colors.dark[100] + '40'}
                            />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* زر الحفظ العائم أو السفلي */}
            <View className="px-6 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-full py-4 rounded-xl items-center"
                    style={{ backgroundColor: colors.dark[100] }}
                >
                    <Text className="font-bold text-white" style={{ color: colors.light[100] }}>
                        Done ({selectedIds.length})
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default CollectionsManagement;