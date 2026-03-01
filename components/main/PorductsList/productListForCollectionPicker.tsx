"use client";
import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { ProductType } from '@/types';
import axios from 'axios';
import React, { useEffect, useState, useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
    products: ProductType[], 
    setProducts: (value: ProductType[]) => void
    productsSelected: string[]
    setProductsSelected: (value: string[]) => void
    collectionId: string
    className?: string
}

const ProductListForCollectionPicker = ({
    products, 
    setProducts,
    productsSelected,
    setProductsSelected,
    collectionId
}: Props) => {

    const [skipAll, setSkipAll] = useState(0);
    const [totalAll, setTotalAll] = useState(0);
    const limit = 15;

    const [fullSelectedProducts, setFullSelectedProducts] = useState<ProductType[]>([]);
    const [skipSelected, setSkipSelected] = useState(0);
    const [totalSelected, setTotalSelected] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'selected'>('selected');

    const availableProducts = useMemo(() => {
        return products.filter(p => !productsSelected.includes(p._id as string));
    }, [products, productsSelected]);

    const toggleSelect = (productId: string) => {
        if (productsSelected.includes(productId)) {
            setProductsSelected(productsSelected.filter(id => id !== productId));
            setTotalSelected(prev => Math.max(0, prev - 1));
        } else {
            setProductsSelected([...productsSelected, productId]);
            setTotalSelected(prev => prev + 1);
        }
    };

    useEffect(() => {
        const newlySelected = products.filter(p => 
            productsSelected.includes(p._id as string) && 
            !fullSelectedProducts.find(f => f._id === p._id)
        );
        
        if (newlySelected.length > 0) {
            setFullSelectedProducts(prev => [...newlySelected, ...prev]);
        }
        setFullSelectedProducts(prev => prev.filter(p => productsSelected.includes(p._id as string)));
    }, [productsSelected]);

    const fetchAllProducts = async (newSkip: number, append: boolean = false) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getAllProducts`, {
                params: { skip: newSkip, limit, status: JSON.stringify(["active", "archived"]) }
            });
            setProducts(append ? [...products, ...data.products] : data.products);
            setTotalAll(data.productsCount);
        } catch (err) { console.log(err); } 
        finally { setIsLoading(false); setRefreshing(false); }
    };

    const fetchSelectedProducts = async (newSkip: number, append: boolean = false) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getProductsByCollection`, {
                params: { collectionId, skip: newSkip, limit, status: JSON.stringify(["active", "archived"]) }
            });
            setFullSelectedProducts(append ? [...fullSelectedProducts, ...data.products] : data.products);
            setTotalSelected(data.productsCount);
        } catch (err) { console.log(err); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchAllProducts(0);
        if (collectionId) fetchSelectedProducts(0);
    }, [collectionId]);

    // Infinite Scroll Logic
    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

        if (isCloseToBottom && !isLoading) {
            if (activeTab === 'all' && products.length < totalAll) {
                const nextSkip = skipAll + limit;
                setSkipAll(nextSkip);
                fetchAllProducts(nextSkip, true);
            } else if (activeTab === 'selected' && fullSelectedProducts.length < totalSelected) {
                const nextSkip = skipSelected + limit;
                setSkipSelected(nextSkip);
                fetchSelectedProducts(nextSkip, true);
            }
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.light[100] }}>
            <View className="px-5 py-4">
                <View className="flex-row p-1 rounded-2xl" style={{ backgroundColor: colors.light[200] }}>
                    <TouchableOpacity 
                        onPress={() => setActiveTab('selected')} 
                        className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-x-2" 
                        style={{ backgroundColor: activeTab === 'selected' ? colors.dark[100] : 'transparent' }}
                    >
                        <Text className="font-bold text-sm" style={{ color: activeTab === 'selected' ? colors.light[100] : colors.dark[100] }}>
                            Selected
                        </Text>
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: activeTab === 'selected' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }}>
                            <Text className="text-[10px] font-black" style={{ color: activeTab === 'selected' ? colors.light[100] : colors.dark[100] }}>
                                {totalSelected}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => setActiveTab('all')} 
                        className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-x-2" 
                        style={{ backgroundColor: activeTab === 'all' ? colors.dark[100] : 'transparent' }}
                    >
                        <Text className="font-bold text-sm" style={{ color: activeTab === 'all' ? colors.light[100] : colors.dark[100] }}>
                            Available
                        </Text>
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: activeTab === 'all' ? colors.light[100] : colors.dark[100] }}>
                            <Text className="text-[10px] font-black" style={{ color: activeTab === 'all' ? colors.dark[100] : colors.light[100] }}>
                                {totalAll}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={() => {
                            setSkipAll(0);
                            setSkipSelected(0);
                            activeTab === 'all' ? fetchAllProducts(0) : fetchSelectedProducts(0);
                        }} 
                    />
                }
            >
                <View className='gap-y-3'>
                    {(activeTab === 'all' ? availableProducts : fullSelectedProducts).map((item) => {
                        const isSelected = productsSelected.includes(item._id as string);
                        return (
                            <TouchableOpacity 
                                key={item._id}
                                activeOpacity={0.7}
                                onPress={() => toggleSelect(item._id as string)}
                                className="flex-row items-center p-3 rounded-[24px] bg-white border border-gray-50 shadow-sm shadow-black/5"
                            >
                                <Image source={{ uri: item.thumbNail }} className="w-14 h-14 rounded-2xl bg-gray-100" />
                                <View className="flex-1 ml-4">
                                    <Text numberOfLines={1} className="font-bold text-sm text-black uppercase tracking-tight">{item.name.fr}</Text>
                                    <Text className="text-gray-400 text-[10px] font-bold mt-1">{item.price} DZD</Text>
                                </View>
                                <View 
                                    className="w-7 h-7 rounded-full items-center justify-center border-2"
                                    style={{ 
                                        backgroundColor: isSelected ? colors.dark[100] : 'transparent',
                                        borderColor: isSelected ? colors.dark[100] : colors.light[300]
                                    }}
                                >
                                    {isSelected && <Feather name="check" size={14} color="white" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* New Loading Indicator at bottom */}
                {isLoading && (
                    <View className="py-8 items-center justify-center">
                        <ActivityIndicator size="small" color={colors.dark[100]} />
                        <Text className="text-[9px] font-black uppercase tracking-[2px] mt-3 opacity-30">Loading more</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default ProductListForCollectionPicker;