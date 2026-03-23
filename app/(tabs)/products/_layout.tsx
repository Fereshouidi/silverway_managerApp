import { Tabs } from 'expo-router';
import React, { useState } from 'react';

import { colors, icons } from '@/constants';
import { HapticTab } from '@/components/haptic-tab';
import { Image, ImageSourcePropType, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/main/header';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Collections from './collection';
import Products from './product';
import TopBarForProductsPage from '@/components/sub/topBars/Products';
import TopBarForCollectionsPage from '@/components/sub/topBars/collections';
import { CollectionType, ProductType } from '@/types';
import { Modal, TouchableOpacity, Text } from 'react-native';
import ProductsList from '@/components/main/PorductsList/PorductsList';
import { X } from 'lucide-react-native';


export default function TabLayout() {
    // const colorScheme = useColorScheme();

    const Tab = createMaterialTopTabNavigator();
    const [activePage, setActivePage] = useState<"products" | "collections">("products");
    const [searchBarActive, setSearchBarActive] = useState<boolean>(false);
    const [hiddenModalActive, setHiddenModalActive] = useState<boolean>(false);
    const [productsSelected, setProductsSelected] = useState<string[]>([]);
    const [collectionsSelected, setCollectionsSelected] = useState<string[]>([]);
    const [products, setProducts] = useState<ProductType[]>([]);
    const [collections, setCollections] = useState<CollectionType[]>([]);
    const [archivedProducts, setArchivedProducts] = useState<ProductType[]>([]);
    const [archivedSelected, setArchivedSelected] = useState<string[]>([]);

    const handleDeleteProducts = async () => {

    }


    return (
        <SafeAreaView className='w-full h-full'>

            <View
                className='w-full h-[45px] absolute top-0'
                style={{
                    backgroundColor: colors.light[150]

                }}
            ></View>

            <View
                className='relative'
                style={{
                    backgroundColor: colors.light[150]
                }}
            >
                {
                    activePage == "collections" ?
                        <TopBarForCollectionsPage
                            collections={collections}
                            setCollections={setCollections}
                            collectionsSelected={collectionsSelected}
                            setCollectionsSelected={setCollectionsSelected}
                        />
                        :
                        <TopBarForProductsPage
                            searchBarActive={searchBarActive}
                            setSearchBarActive={setSearchBarActive}
                            productsSelected={productsSelected}
                            setProductsSelected={setProductsSelected}
                            productsList={products}
                            setProductsList={setProducts}
                        />
                }

                <Header
                    className='w-full bg-red-500- absolute top-0'
                    title='Products management'
                    style={{
                        backgroundColor: 'transparent'
                    }}
                />
            </View>

            <Tab.Navigator
                screenListeners={{
                    state: (e) => {
                        const routeName = e.data.state.routes[e.data.state.index].name;

                        if (routeName === "Products") {
                            setActivePage("products");
                        } else if (routeName === "Collections") {
                            setActivePage("collections");
                        }
                    },
                }}
                screenOptions={{

                    tabBarActiveTintColor: colors.dark[150],
                    tabBarIndicatorStyle: { backgroundColor: colors.dark[150], height: 3 },
                    tabBarStyle: { backgroundColor: colors.light[150] },
                }}
            >
                <Tab.Screen name="Products">
                    {(props) => (
                        <Products
                            {...props}
                            searchBarActive={searchBarActive}
                            setSearchBarActive={setSearchBarActive}
                            productsSelected={productsSelected}
                            setProductsSelected={setProductsSelected}
                            products={products}
                            setProducts={setProducts}
                            setHiddenModalActive={setHiddenModalActive}
                        />
                    )}
                </Tab.Screen>

                <Tab.Screen name="Collections">
                    {(props) => (
                        <Collections
                            {...props}
                            CollectionsSelected={collectionsSelected}
                            setCollectionsSelected={setCollectionsSelected}
                            collections={collections}
                            setCollections={setCollections}
                        />
                    )}
                </Tab.Screen>

                {/* <Tab.Screen name="Collections" component={Collections} /> */}
            </Tab.Navigator>

            <Modal
                visible={hiddenModalActive}
                animationType="slide"
                onRequestClose={() => setHiddenModalActive(false)}
            >
                <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[150] }}>
                    <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
                        <View>
                            <Text className="text-[10px] font-bold opacity-30 uppercase tracking-[3px]">Stock Overview</Text>
                            <Text className="text-2xl font-black text-black">Hidden Products</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setHiddenModalActive(false)}
                            className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
                        >
                            <X size={20} color={colors.dark[100]} />
                        </TouchableOpacity>
                    </View>
                    
                    <ProductsList
                        products={archivedProducts}
                        setProducts={setArchivedProducts}
                        productsSelected={archivedSelected}
                        setProductsSelected={setArchivedSelected}
                        status={["archived"]}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>

    );
}
