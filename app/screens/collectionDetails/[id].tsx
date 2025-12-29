import { backEndUrl } from '@/api'
import { colors, icons } from '@/constants'
import { useProductSection } from '@/contexts/productTab'
import HandleCollections from '@/components/main/handleCollections'
import HandleImages from '@/components/main/HandleImages'
import HandleSpecifications from '@/components/main/handleSpecifications'
import Header from '@/components/main/header'
import ProductStatistics from '@/components/main/productStatistics'
import SkeletonLoading from '@/components/sub/SkeletonLoading'
import { CollectionType, ProductToEditType, ProductType } from '@/types'
import axios from 'axios'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { pickImage } from '@/lib'
import { fakeProducts, newCollection } from '@/constants/data'
import { useLoadingScreen } from '@/contexts/loadingScreen'
import * as ImageManipulator from 'expo-image-manipulator';

type ProductSectionType = {
    visibility: boolean
    setVisibility: (value: boolean) => void
    product: ProductType
    containerClassName?: string
    containerStyle?: string
    className?: string
    style?: string
}

const ProductSection = ({
    className,
}: ProductSectionType) => {

    const { id } = useLocalSearchParams();
    const { setLoadingScreen } = useLoadingScreen();

    const [collection, setCollection] = useState<CollectionType | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [updatedCollection, setUpdatedCollection] = useState<CollectionType>(newCollection);

    useEffect(() => {
        const fetchData = async () => {
            await axios.get( backEndUrl + "/getCollectionById", {
                params: {
                    collectionId: id
                }
            })
            .then(({ data }) => {
                setCollection(data.collection)
                setUpdatedCollection(data.collection)
            })
            .catch(err => console.log('err : ' + err))
        }

        setLoading(true);
        fetchData();
        setLoading(false);
    }, [])

    const handleConfirm = async () => {

        if (!updatedCollection?.name.fr) {
            alert("The name of the collection is required !");
            return;
        }
        setLoadingScreen(true, "wait a little bit...");
    try {
        const formData = new FormData();

        formData.append(
        "thumbnail",
        {
            uri: updatedCollection.thumbNail,
            type: "image/jpeg",
            name: "thumbnail.jpg",
        } as any
        );

        formData.append("_id", updatedCollection._id || "");
        formData.append("nameFr", updatedCollection.name.fr || "");
        formData.append("type", updatedCollection.type);
        formData.append("display", updatedCollection.display);

        await axios.put(backEndUrl + "/updateCollection", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        router.back();
        alert("the collection has been updated successfully! ✅");

    } catch (err) {
        console.error(err);
        alert("something went wrong while updating the collection ! ❌");
    }

    setLoadingScreen(false)

    };

    useEffect(() => {
        console.log(JSON.stringify(updatedCollection, null, 2));
        
    }, [updatedCollection])

    if (typeof updatedCollection == "undefined") return;

    return (
        <SafeAreaView
            className='w-full h-full'
            style={{
                backgroundColor: colors.light[100]
            }}
        >

            <Stack.Screen options={{ headerShown: false }} />
            <View   
                className='w-full h-[45px] absolute top-0'
                style={{
                    backgroundColor: colors.light[100]
                    
                }}
            ></View>


                <Header
                    title='Edit Collection'
                    onBackButtonPress={() => router.back()}
                    items={<View>
                        <TouchableOpacity
                            onPress={handleConfirm}
                            className='bg-red-500- h-14 w-16 flex justify-center items-center rounded-sm'
                        >
                            <Image
                                source={require('@/app/assets/icons/tick.png')}
                                className='w-6 h-6 mx-4'
                            />
                        </TouchableOpacity>
                    </View>}
                />

                <ScrollView 
                    className='w-full bg-red-500- px-5'
                    keyboardShouldPersistTaps="handled"
                >

                    <View className='w-full flex justify-center items-center gap-4 py-5'>

                        {/* <Text className='font-bold text-[14px]'>ThumbNail : </Text> */}

                        <TouchableOpacity 
                            className='w-[220px] h-[200px] rounded-full bg-red-500- overflow-hidden p-2-'
                            style={{
                                borderRadius: 10,
                                overflow: "hidden"
                            }}
                            onPress={async () => {
                                try {
                                    const selectedThumbNail = await pickImage();
                                    
                                    // Check if image was actually selected
                                    if (!selectedThumbNail) {
                                        console.log('No image selected');
                                        return;
                                    }

                                    const compressedThumbNail = await ImageManipulator.manipulateAsync(
                                        selectedThumbNail,
                                        [{ resize: { width: 1000 } }],
                                        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                                    );

                                    // Update with the URI from the compressed image
                                    setUpdatedCollection({
                                        ...updatedCollection,
                                        thumbNail: compressedThumbNail.uri
                                    });
                                } catch (error) {
                                    console.error('Error processing image:', error);
                                    // Optionally show an error message to the user
                                }
                            }}
                        >

                            {
                                updatedCollection.thumbNail ?
                                    <Image
                                        source={{uri: updatedCollection.thumbNail}}
                                        className='w-full h-full rounded-full-'
                                    />
                                :

                                <View   
                                    className='w-full h-full rounded-full-'
                                    style={{
                                        backgroundColor: colors.light[300]
                                    }}
                                >
                                </View>
                            
                            }

                        </TouchableOpacity>
                    </View>

                    <View className='w-full flex justify-center items-center py-5 gap-4'>

                        <Text className='font-bold text-[14px]'>Name : </Text>

                        <TextInput
                            placeholder='collection name...'
                            defaultValue={updatedCollection?.name.fr?? ""}
                            className='w-[75%] h-14 rounded-sm px-5'
                            style={{
                                borderWidth: 1,
                                borderColor: colors.light[250],
                                borderRadius: 10
                            }}
                            onChangeText={(e) => setUpdatedCollection({
                                ...updatedCollection,
                                name: {
                                    ...updatedCollection.name,
                                    fr: e
                                }
                            })}
                        />

                    </View>

                    <View className='w-full flex justify-center items-center py-7 gap-4'>

                        <Text className='font-bold text-[14px]'>Type : </Text>

                        <View className='w-full flex flex-row justify-center items-center p-2 gap-5'>

                            <TouchableOpacity
                                className='p-4  min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: updatedCollection.type == "public" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setUpdatedCollection({
                                    ...updatedCollection,
                                    type: "public"
                                })}
                            >
                                <Text
                                    className='text-center'
                                    style={{
                                        color: updatedCollection.type == "public" ? colors.light[100] : colors.dark[100]
                                    }}
                                >Public</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='p-4 min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: updatedCollection.type == "private" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setUpdatedCollection({
                                    ...updatedCollection,
                                    type: "private"
                                })}
                            >
                                <Text
                                    className='text-center'
                                    style={{
                                        color: updatedCollection.type == "private" ? colors.light[100] : colors.dark[100]
                                    }}
                                >Private</Text>
                            </TouchableOpacity>

                        </View>

                        <View className='w-full flex gap-1'>
                            <Text className='font-semibold'>Note : </Text>
                            <Text className='text-sm opacity-80'> . Categories set as Public are visible to customers.</Text>
                            <Text className='text-sm opacity-80'> . Categories set as Private are hidden from customers while keeping all their data in the system.</Text>
                        </View>

                    </View>

                    <View className='w-full flex justify-center items-center py-7 gap-4'>

                        <Text className='font-bold text-[14px]'>Display : </Text>

                        <View className='w-full flex flex-row justify-center items-center p-2 gap-5'>

                            <TouchableOpacity
                                className='p-4  min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: updatedCollection.display == "vertical" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setUpdatedCollection({
                                    ...updatedCollection,
                                    display: "vertical"
                                })}
                            >
                                <Text
                                    className='text-center'
                                    style={{
                                        color: updatedCollection.display == "vertical" ? colors.light[100] : colors.dark[100]
                                    }}
                                >Normal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='p-4 min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: updatedCollection.display == "horizontal" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setUpdatedCollection({
                                    ...updatedCollection,
                                    display: "horizontal"
                                })}
                            >
                                <Text
                                    className='text-center'
                                    style={{
                                        color: updatedCollection.display == "horizontal" ? colors.light[100] : colors.dark[100]
                                    }}
                                >Slider</Text>
                            </TouchableOpacity>

                        </View>

                        <View className='w-full flex gap-1'>
                            <Text className='font-semibold'>Note : </Text>
                            <Text className='text-sm opacity-80'> . The Display option controls how this category’s products appear on the homepage.</Text>
                            <Text className='text-sm opacity-80'> . Choose Normal for a standard layout, or Slider to showcase the products in a sliding section.</Text>
                        </View>

                    </View>

                </ScrollView>
                
        </SafeAreaView>

    )
}

export default ProductSection
