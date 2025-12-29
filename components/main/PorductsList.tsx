import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { productsLoading } from '@/constants/data';
import { ProductType } from '@/types';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import ProductCard from '../sub/productCard';
import React from 'react';
import MoreBotton from '../sub/skipButton';

type Props = {
    products: ProductType[], 
    setProducts: (value: ProductType[]) => void
    className?: string
    productsSelected: ProductType[]
    setProductsSelected: (value: ProductType[]) => void
}


const Porducts = ({
    products, 
    setProducts,
    className,
    productsSelected,
    setProductsSelected
}: Props) => {

    const [skip, setSkip] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [productsCount, setProductsCount] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);
    


    useEffect(() => {

        setProducts(productsLoading);
        const fetchData = async () => {
            await axios.get( backEndUrl + '/getAllProducts', { params: {
                skip,
                limit
            }})
            .then(({ data }) => {
                setProducts(data.products);
                setProductsCount(data.productsCount);
            })
        }

        fetchData();

    }, [])

    // useEffect(() => {

    //     // setProducts(productsLoading);
    //     const fetchData = async () => {
    //         await axios.get( backEndUrl + '/getAllProducts', { params: {
    //             skip,
    //             limit
    //         }})
    //         .then(({ data }) => {
    //             if (skip == 0) {
    //                 setProducts(data.products);
    //                 setProductsCount(data?.productsCount || 0);
    //             } else {
    //                 // console.log(products);
                    
    //                 setProducts([...products, ...data.products]);
    //             }
    //         })
    //         .catch(err => {
    //             console.log({err: err});
                
    //         })
    //     }

    //     setIsLoading(true);
    //     fetchData();
    //     setIsLoading(false);

    // }, [skip])

    const onSkip = async () => {
        setIsLoading(true);

        await axios.get( backEndUrl + '/getAllProducts', { params: {
            skip: skip + limit,
            limit
        }})
        .then(({ data }) => {
            setProducts([...products, ...data.products]);
        })
        .catch(err => {
            console.log({err: err});
            
        })
        setSkip(skip + limit);
        setIsLoading(false);
    }
    
    const onRefresh = async () => {
        setRefreshing(true);
        await axios.get( backEndUrl + '/getAllProducts', { params: {
            skip: 0,
            limit
        }})
        .then(({ data }) => {
            setProducts(data.products);
        })
        setSkip(0);
        setRefreshing(false);
    }
    
    return (
        <ScrollView
            className={`${className}`}
            style={{
                backgroundColor: colors.light[100],
            }}
            contentContainerStyle={{
                padding: 20,
                paddingBottom: 100,
                flexDirection: "column",
                // justifyContent: "center",
                alignItems: "center",
                gap: 5,
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
            <View className='flex flex-row flex-wrap justify-between gap-y-5'>
                {products.map((item, index) => (
                    <View key={item._id ?? index.toString()} style={{ width: "48%" }}>
                        <ProductCard 
                            product={item} 
                            productsSelected={productsSelected} 
                            setProductsSelected={setProductsSelected}
                        />
                    </View>
                ))}
            </View>
            
            {products.length < productsCount && <MoreBotton
                limit={limit}
                skip={skip}
                setSkip={setSkip}
                isLoading={isLoading}
                onClick={onSkip}
                className='flex flex-1 mt-10 rounded-2xl'
            />}

        </ScrollView>
    )
}

export default Porducts
