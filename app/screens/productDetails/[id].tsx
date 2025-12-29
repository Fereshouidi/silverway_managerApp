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
import { fakeProducts } from '@/constants/data'
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
    const { productSectionActive } = useProductSection();
    const { setLoadingScreen } = useLoadingScreen();

    const [product, setProduct] = useState<ProductType>(fakeProducts[0]);
    const [allCollections, setAllCollections] = useState<CollectionType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    // const [product, setProduct] = useState<ProductToEditType | undefined>(undefined);
    const [updatedProduct, setUpdatedProduct] = useState<ProductToEditType>({
            ...product,
            price: product.price?.toString()?? '',
            specifications: product.specifications.reverse()
        });

    useEffect(() => {
        const fetchData = async () => {
            await axios.get( backEndUrl + "/getProductById", {
                params: {
                    productId: id
                }
            })
            .then(({ data }) => {
                setProduct(data.product)
                setUpdatedProduct(data.product)
            })
            .catch(err => console.log('err : ' + err))
        }

        setLoading(true);
        fetchData();
        setLoading(false);
    }, [])

    const handleConfirm = async () => {

        if (!updatedProduct.name.en || !updatedProduct.description.en || !updatedProduct.thumbNail || !updatedProduct.price) {
            alert("Please fill in all required fields: Name, Description, Thumbnail, and Price.");
            return;
        }
        setLoadingScreen(true, "this way take munites ...")
    try {
        const formData = new FormData();

        formData.append(
        "thumbnail",
        {
            uri: updatedProduct.thumbNail,
            type: "image/jpeg",
            name: "thumbnail.jpg",
        } as any
        );

        updatedProduct.images.forEach((imgUri, index) => {
        formData.append(
            "images",
            {
            uri: imgUri,
            type: "image/jpeg",
            name: `image_${index}.jpg`,
            } as any
        );
        });

        formData.append("_id", updatedProduct._id || "");
        formData.append("nameEn", updatedProduct.name.en || "");
        formData.append("price", updatedProduct.price || "0");
        formData.append("descriptionEn", updatedProduct.description.en || "");

        // Collections (array) → تحويل إلى JSON string
        formData.append("collections", JSON.stringify(updatedProduct.collections || []));

        // Specifications (array of objects) → تحويل إلى JSON string
        const cleanedSpecifications = updatedProduct.specifications.map(spec => ({
            ...spec,
            price: spec.price ? parseFloat(spec.price) : 0,
        }));

        formData.append(
            "specifications",
            JSON.stringify(cleanedSpecifications)
        );

        await axios.put(backEndUrl + "/updateProduct", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        router.back();
        alert("the product has been updated successfully! ✅");

    } catch (err) {
        console.error(err);
        alert("something went wrong while updating the product ! ❌");
    }

    setLoadingScreen(false)

    };

    useEffect(() => {
        console.log(JSON.stringify(updatedProduct, null, 2));
        
    }, [updatedProduct])


    return (
        <SafeAreaView 
            className='w-full h-full flex justify-center items-center'
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
                    title='Edit Product'
                    onBackButtonPress={() => router.back()}
                    items={<View>
                        <TouchableOpacity
                            onPress={handleConfirm}
                            className='bg-red-500- h-14 w-14 flex justify-center items-center rounded-sm'
                        >
                            <Image
                                source={require('@/app/assets/icons/tick.png')}
                                className='w-6 h-6 mx-4'
                            />
                        </TouchableOpacity>
                    </View>}
                />

                <ScrollView 
                    className='w-full h-full p-2'
                    keyboardShouldPersistTaps="handled"
                >

                    <View className='w-full h-fit flex flex-row justify-between items-center'>

                        <TouchableOpacity 
                            className='w-[150px] h-[150px] rounded-2xl overflow-hidden p-2'
                            onPress={async () => {
                                try {
                                    const result = await pickImage();

                                    if (!result) return;

                                    //@ts-ignore
                                    const imageUri = typeof result === 'string' ? result : result.uri;

                                    if (!imageUri) {
                                        console.log('No valid image URI found');
                                        return;
                                    }

                                    const compressedResult = await ImageManipulator.manipulateAsync(
                                        imageUri,
                                        [{ resize: { width: 1000 } }], 
                                        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                                    );

                                    setUpdatedProduct(prev => ({
                                        ...prev,
                                        thumbNail: compressedResult.uri
                                    }));

                                } catch (error) {
                                    console.error('Error processing image:', error);
                                }
                            }}
                        >

                            {updatedProduct?.thumbNail ? <Image
                                    source={{ uri: updatedProduct?.thumbNail }}
                                    className='w-full h-full rounded-2xl'
                                />
                                :
                                <View 
                                    className='w-full h-full rounded-2xl overflow-hidden'
                                    style={{
                                        backgroundColor: colors.light[250]
                                    }}
                                ></View>
                            }

                            <Image
                                source={icons.editText}
                                className='w-5 h-5 absolute bottom-5 right-5'
                            />

                        </TouchableOpacity>

                        <View className=' flex flex-1 flex-col justify-start gap-4 min-h-[150px] p-4'>

                                <View className='w-full min-h-[30%]-'>
                                    <Text className='text-md font-semibold m-1- mb-2'>Name : </Text>
                                    <TextInput 
                                        value={updatedProduct?.name.en || ''}
                                        placeholder='product name...'
                                        placeholderClassName='text-sm'
                                        onChangeText={(e) => setUpdatedProduct({
                                            ...updatedProduct, 
                                            name: {
                                                ...updatedProduct?.name,
                                                en: e
                                            }
                                        })}
                                        className='min-h-12 border-[0.2px] rounded-lg p-2 mt-2- text-md'
                                        style={{
                                            borderColor: colors.light[500]
                                        }}
                                        maxLength={200}
                                        multiline
                                    />
                                </View>
                            
                            {/* <View className='w-full min-h-[40%] flex flex-row justify-start items-center'>
                                <Text className='text-md font-medium'>{product?.name.fr}</Text>
                            </View> */}
                            <View className='w-full'>

                                <Text className='text-md font-semibold mb-2'>Price : </Text>

                                <View className='flex flex-row items-center'>
                                    <TextInput
                                        value={updatedProduct?.price != "0" ? updatedProduct?.price?.toString()  : ''}
                                        placeholder='0.00'
                                        onChangeText={(e) => {
                                            if (/^\d*\.?\d{0,2}$/.test(e)) {
                                                setUpdatedProduct({
                                                    ...updatedProduct,
                                                    price: e
                                                });
                                            }
                                        }}
                                        className=' min-w-32 min-h-12 border-[0.2px] rounded-lg p-2 px-4 text-md'
                                        maxLength={7}
                                        keyboardType="decimal-pad" // Use decimal keyboard if available
                                    />
                                    <Text className='text-md ml-2'> D.T</Text>

                                </View>
                            </View>
                        </View>

                    </View>

                    <View className='px-2'> 

                        <Text className='text-md font-semibold m-4'>Description : </Text>

                        <TextInput
                            value={updatedProduct?.description.en?? ""}
                            onChangeText={(e) => setUpdatedProduct({
                                ...updatedProduct, 
                                description: {
                                    ...updatedProduct.description,
                                    en: e
                                }
                            })}
                            placeholder="Type your description..."
                            multiline 
                            numberOfLines={10}
                            textAlignVertical="top" 
                            className='h-[200px] border-[1px] rounded-lg p-1 text-md'
                            style={{
                                // height: 200,
                                borderColor: colors.light[300],
                                // borderWidth: 1,
                                // borderRadius: 8,
                                // padding: 10,
                                // fontSize: 16,
                                backgroundColor: colors.light[100]
                            }}
                        />
                    </View>

                    {product?.specifications && <HandleSpecifications
                        updatedProduct={updatedProduct}
                        setUpdatedProduct={setUpdatedProduct}
                    />}

                    {product?.collections && <HandleCollections
                        updatedProduct={updatedProduct}
                        setUpdatedProduct={setUpdatedProduct}
                        // collections={allCollections}
                        // product={product}
                    />}

                    {updatedProduct && <HandleImages
                        updatedProduct={updatedProduct}
                        setUpdatedProduct={setUpdatedProduct}                    
                    />}

                    {/* {product && <ProductStatistics/>} */}

                    <View className='h-10'></View>
                    

                </ScrollView>


        </SafeAreaView>

    )
}

export default ProductSection
