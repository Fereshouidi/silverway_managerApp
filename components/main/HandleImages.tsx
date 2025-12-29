import { ProductToEditType, ProductType } from '@/types'
import React, { useState } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native'
import { CustomView } from '../sub/customView'
import { pickImage, pickManyImages } from '@/lib'
import { colors, icons } from '@/constants'
import * as ImageManipulator from 'expo-image-manipulator';


type Props = {
    updatedProduct: ProductToEditType
    setUpdatedProduct: (value: ProductToEditType) => void
}

const HandleImages = ({
    updatedProduct,
    setUpdatedProduct
}: Props) => {

    const [imagesToHandle, setImagesToHandle] = useState<string>("");

  return (
    <View>

        <Text className='text-md font-semibold m-5'>Images : </Text>

        <ScrollView 
            className='w-full h-fit flex flex-row gap-5 bg-blue-500- px-10- pb-5'
            horizontal
        >
            {updatedProduct.images.map((image, index) => (
                <TouchableOpacity
                    key={index}
                    className='relative w-fit h-fit flex justify-center- mx-1'
                    onLongPress={() => {
                        setImagesToHandle(image)
                    }}
                >
                    <Image
                        source={{uri: image}}
                        className='w-[100px] h-[100px] rounded-full border-1 border-gray-500'
                    />
                        
                    {imagesToHandle == image && <TouchableOpacity
                        className='handleImage absolute w-full h-full flex flex-row gap-2 justify-center items-center bg-red-500 rounded-full right-0-'
                        style={{
                            // backgroundColor: colors.light[100]
                            
                        }}
                        onPress={() => setUpdatedProduct({
                            ...updatedProduct,
                            images: updatedProduct.images.filter((img) => img != image)
                        })}
                    >
                        <Image
                            source={icons.trashWhite}
                            className='w-5 h-5'
                        />
                        <Text
                            style={{
                                color: colors.light[100]
                            }}
                        >delete</Text>

                    </TouchableOpacity>}

                </TouchableOpacity>
            ))}

            <TouchableOpacity
                className='w-[100px] h-[100px] flex justify-center items-center bg-gray-100 border-[2px]- border-gray-100 rounded-full mx-1'
                style={{
                    border: "1px solid gray"
                }}
                onPress={ async () => {
                    try {
                        const selectedImages = await pickManyImages(); // مصفوفة URIs
                        const compressedImages = [];

                        for (const uri of selectedImages) {
                        const compressed = await ImageManipulator.manipulateAsync(
                            uri,
                            [{ resize: { width: 1000 } }],   // تصغير الأبعاد
                            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // تقليل الجودة
                        );
                        compressedImages.push(compressed.uri); // نأخذ URI الجديد
                        }

                        setUpdatedProduct({
                        ...updatedProduct,
                        images: [...updatedProduct.images, ...compressedImages],
                        });
                    } catch (err) {
                        console.error("خطأ أثناء اختيار أو ضغط الصور:", err);
                    }
                }}
                        
            >
                <Image
                    source={icons.plus}
                    className='w-7 h-7'
                />
            </TouchableOpacity>

        </ScrollView>

    </View>
  )
}

export default HandleImages
