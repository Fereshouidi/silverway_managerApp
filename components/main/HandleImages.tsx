"use client";
import { ProductToEditType } from '@/types'
import React from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native'
import { pickManyImages, pickImage } from '@/lib' 
import { colors, icons } from '@/constants'
import * as ImageManipulator from 'expo-image-manipulator';

type Props = {
    updatedProduct: ProductToEditType
    setUpdatedProduct: React.Dispatch<React.SetStateAction<any>>
}

const HandleImages = ({ updatedProduct, setUpdatedProduct }: Props) => {

    const handleLinkSpec = (imageUri: string, specId: string | null) => {
        setUpdatedProduct((prev: ProductToEditType) => ({
            ...prev,
            //@ts-ignore
            images: prev.images.map(img => img.uri === imageUri ? { ...img, specification: specId } : img)
        }));
    };

    const deleteImage = (uri: string) => {
        setUpdatedProduct((prev: any) => ({
            ...prev,
            images: prev.images.filter((img: any) => img.uri !== uri)
        }));
    };

    const editImage = async (index: number) => {
        const result = await pickImage();
        if (!result) return;
        //@ts-ignore
        const uri = typeof result === 'string' ? result : result.uri;
        const comp = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
        setUpdatedProduct((prev: any) => {
            const newImages = [...prev.images];
            newImages[index] = { ...newImages[index], uri: comp.uri };
            return { ...prev, images: newImages };
        });
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        const newImages = [...updatedProduct.images];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newImages.length) return;
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
        setUpdatedProduct((prev: any) => ({ ...prev, images: newImages }));
    };

    return (
        <View className='my-6'>
            <View className='px-5 flex flex-row justify-between items-end mb-4'>
                <View>
                    <Text className='text-xl font-black text-black uppercase tracking-tighter'>Gallery</Text>
                    <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Display Order & Linking</Text>
                </View>
                <View className='bg-black px-3 py-1 rounded-full'>
                    <Text className='text-white font-black text-[10px]'>
                        {updatedProduct.images.length} UNITS
                    </Text>
                </View>
            </View>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                className='py-2'
            >
                {updatedProduct.images.map((imageObj, index) => {
                    //@ts-ignore
                    const currentSpecId = typeof imageObj.specification === 'object' 
                    //@ts-ignore
                        ? (imageObj.specification as any)?._id 
                        //@ts-ignore
                        : imageObj.specification;

                    return (
                        //@ts-ignore
                        <View key={`${imageObj.uri}-${index}`} className='w-[150px]'>
                            <View className='bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm'>
                                <View className='relative w-full h-[180px] bg-gray-50'>
                                    <Image 
                                        //@ts-ignore
                                        source={{ uri: imageObj.uri }} 
                                        className='w-full h-full' 
                                        resizeMode="cover" />
                                    
                                    {/* Delete Button */}
                                    <TouchableOpacity 
                                        //@ts-ignore
                                        onPress={() => deleteImage(imageObj.uri)}
                                        className='absolute top-3 right-3 bg-white/90 w-7 h-7 rounded-full items-center justify-center shadow-sm'
                                    >
                                        <Text className='text-black font-black text-[10px]'>✕</Text>
                                    </TouchableOpacity>

                                    {/* Navigation Controls */}
                                    <View className='absolute bottom-3 left-3 flex flex-row bg-black/90 rounded-2xl overflow-hidden shadow-lg'>
                                        <TouchableOpacity 
                                            onPress={() => moveImage(index, 'left')}
                                            className={`p-2.5 border-r border-white/10 ${index === 0 ? 'opacity-20' : ''}`}
                                            disabled={index === 0}
                                        >
                                            <Text className='text-white text-[10px]'>◀</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => moveImage(index, 'right')}
                                            className={`p-2.5 ${index === updatedProduct.images.length - 1 ? 'opacity-20' : ''}`}
                                            disabled={index === updatedProduct.images.length - 1}
                                        >
                                            <Text className='text-white text-[10px]'>▶</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Edit Icon Overlay */}
                                    <TouchableOpacity 
                                        onPress={() => editImage(index)}
                                        className='absolute bottom-3 right-3 bg-white w-9 h-9 rounded-2xl items-center justify-center shadow-sm'
                                    >
                                        <Image source={icons.editText} className='w-4 h-4' style={{ tintColor: '#000' }} />
                                    </TouchableOpacity>
                                </View>

                                {/* Specifications Linking Bar */}
                                <View className='p-3 bg-white border-t border-gray-50'>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
                                        <View className='flex flex-row items-center gap-3'>
                                            {/* NO-LINK OPTION */}
                                            <TouchableOpacity 
                                                //@ts-ignore
                                                onPress={() => handleLinkSpec(imageObj.uri, null)}
                                                className={`w-7 h-7 rounded-full border-2 items-center justify-center ${!currentSpecId ? 'border-black bg-black' : 'border-gray-200 bg-transparent'}`}
                                            >
                                                <Text className={`text-[10px] font-bold ${!currentSpecId ? 'text-white' : 'text-gray-300'}`}>✕</Text>
                                            </TouchableOpacity>

                                            {/* SPEC COLORS */}
                                            {updatedProduct.specifications.map((spec: any) => {
                                                const isLinked = currentSpecId === spec._id;
                                                return (
                                                    <TouchableOpacity
                                                        key={spec._id}
                                                        //@ts-ignore
                                                        onPress={() => handleLinkSpec(imageObj.uri, spec._id)}
                                                        className={`w-7 h-7 rounded-full border-2 ${isLinked ? 'border-black scale-110 shadow-md' : 'border-gray-100'}`}
                                                        style={{ backgroundColor: spec.colorHex || '#F3F4F6' }}
                                                    />
                                                );
                                            })}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                            {currentSpecId && <Text className='text-[8px] text-center text-black font-black mt-2 uppercase tracking-widest'>Selected</Text>}
                        </View>
                    );
                })}
                
                {/* Minimalist Add Button */}
                <TouchableOpacity
                    onPress={async () => {
                        const selectedImages = await pickManyImages();
                        if(!selectedImages) return;
                        const newObjs = [] as any;
                        for (const uri of selectedImages) {
                            const comp = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
                            newObjs.push({ uri: comp.uri, specification: null });
                        }
                        setUpdatedProduct((prev: any) => ({ ...prev, images: [...prev.images, ...newObjs] }));
                    }}
                    className='w-[150px] h-[225px] justify-center items-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200'
                >
                    <View className='bg-black p-4 rounded-full mb-3 shadow-lg'>
                        <Image source={icons.plus} className='w-6 h-6' style={{ tintColor: '#FFF' }} />
                    </View>
                    <Text className='text-[10px] text-black font-black uppercase tracking-widest'>Add Media</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default HandleImages;