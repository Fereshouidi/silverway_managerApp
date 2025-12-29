import { backEndUrl } from '@/api'
import Header from '@/components/main/header'
import SkeletonLoading from '@/components/sub/SkeletonLoading'
import { colors } from '@/constants'
import { newCollection } from '@/constants/data'
import { useLoadingScreen } from '@/contexts/loadingScreen'
import { pickImage } from '@/lib'
import { CollectionType } from '@/types'
import axios from 'axios'
import * as ImageManipulator from 'expo-image-manipulator';
import { router, Stack } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


const MakeNewCollection = () => {

    const [ collection, setCollection ] = useState<CollectionType>(newCollection);
    const { setLoadingScreen } = useLoadingScreen();
    

    const handleConfirm = async () => {

        if (!collection?.name.fr) {
            alert("The name of the collection is required ! ❌");
            return;
        }
        setLoadingScreen(true, "this way take munites ...")
    try {
        const formData = new FormData();

        formData.append(
        "thumbnail",
        {
            uri: collection.thumbNail,
            type: "image/jpeg",
            name: "thumbnail.jpg",
        } as any
        );

        formData.append("nameFr", collection.name.fr || "");
        formData.append("type", collection.type);
        formData.append("display", collection.display);


        await axios.post(backEndUrl + "/addCollection", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        router.back();
        alert("the collection has been added successfully! ✅");

    } catch (err) {
        console.error(err);
        alert("something went wrong while updating the collection ! ❌");
    }

    setLoadingScreen(false)

    };

    useEffect(() => {
        console.log(JSON.stringify(collection, null, 2));
        
    }, [collection])

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
                    title='New Collection'
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

                    <View className='w-full flex justify-center items-center py-5'>
                        <TouchableOpacity 
                            className='w-[200px] h-[200px] rounded-full bg-red-500- overflow-hidden p-2-'
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
                                    setCollection({
                                        ...collection,
                                        thumbNail: compressedThumbNail.uri
                                    });
                                } catch (error) {
                                    console.error('Error processing image:', error);
                                    // Optionally show an error message to the user
                                }
                            }}
                        >

                            {
                                collection.thumbNail ?
                                    <Image
                                        source={{uri: collection.thumbNail}}
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
                            className='w-[75%] rounded-sm p-5'
                            style={{
                                borderWidth: 1,
                                borderColor: colors.light[250],
                                borderRadius: 10
                            }}
                            onChangeText={(e) => setCollection({
                                ...collection,
                                name: {
                                    ...collection.name,
                                    fr: e
                                }
                            })}
                        />

                    </View>

                    <View className='w-full flex justify-center items-center py-7 gap-4'>

                        <Text className='font-bold text-[14px]'>Type : </Text>

                        <View className='w-full flex flex-row justify-center items-center p-2 gap-5'>

                            <TouchableOpacity
                                className='p-5  min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: collection.type == "public" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setCollection({
                                    ...collection,
                                    type: "public"
                                })}
                            >
                                <Text
                                    style={{
                                        color: collection.type == "public" ? colors.light[100] : colors.dark[100]
                                    }}
                                >Public</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='p-5 min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: collection.type == "private" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setCollection({
                                    ...collection,
                                    type: "private"
                                })}
                            >
                                <Text
                                    style={{
                                        color: collection.type == "private" ? colors.light[100] : colors.dark[100]
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
                                className='p-5  min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: collection.display == "vertical" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setCollection({
                                    ...collection,
                                    display: "vertical"
                                })}
                            >
                                <Text
                                    style={{
                                        color: collection.display == "vertical" ? colors.light[100] : colors.dark[100]
                                    }}
                                >Normal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='p-5 min-w-24'
                                style={{
                                    borderWidth: 1,
                                    borderColor: colors.light[250],
                                    borderRadius: 10,
                                    backgroundColor: collection.display == "horizontal" ? colors.dark[100] : colors.light[100]
                                }}
                                onPress={() => setCollection({
                                    ...collection,
                                    display: "horizontal"
                                })}
                            >
                                <Text
                                    style={{
                                        color: collection.display == "horizontal" ? colors.light[100] : colors.dark[100]
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

export default MakeNewCollection
