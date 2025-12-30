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
import { ProductType } from '@/types';


export default function TabLayout() {
  // const colorScheme = useColorScheme();

    const Tab = createMaterialTopTabNavigator();
    const [ activePage, setActivePage ] = useState<"products" | "collections">("products");
    const [ searchBarActive, setSearchBarActive ] = useState<boolean>(false);
    const [ productsSelected, setProductsSelected ] = useState<string[]>([]);

  const handleDeleteProducts = async () => {
    
  }


  return (
    <SafeAreaView className='w-full h-full'>

        <View   
            className='w-full h-[45px] absolute top-0'
            style={{
                backgroundColor: colors.light[100]
                
            }}
        ></View>

        <View 
            className='relative'
            style={{
                backgroundColor: colors.light[100]
            }}
        >
            {
                activePage == "collections" ? 
                    <TopBarForCollectionsPage/> : 
                    <TopBarForProductsPage
                        searchBarActive={searchBarActive} 
                        setSearchBarActive={setSearchBarActive}
                        productsSelected={productsSelected} 
                        setProductsSelected={setProductsSelected}
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
                
                tabBarActiveTintColor: colors.dark[100],
                tabBarIndicatorStyle: { backgroundColor: colors.dark[100], height: 3 },
                tabBarStyle: { backgroundColor: colors.light[100] },
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
                    />
                )}
            </Tab.Screen>

            <Tab.Screen name="Collections" component={Collections} />
        </Tab.Navigator>
    </SafeAreaView>

  );
}
