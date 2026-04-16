"use client";
import { ProductToEditType } from '@/types'
import React, { useState } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { pickManyImages, pickImage, removeBackground } from '@/lib'
import { colors, icons } from '@/constants'
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
    updatedProduct: ProductToEditType
    setUpdatedProduct: React.Dispatch<React.SetStateAction<any>>
}

const HandleImages = ({ updatedProduct, setUpdatedProduct }: Props) => {
    const [removingIndices, setRemovingIndices] = useState<number[]>([]);

    const handleRemoveBg = async (index: number) => {
        const imageObj = updatedProduct.images[index] as any;
        const uri = typeof imageObj === 'string' ? imageObj : imageObj.uri;
        if (!uri) return;

        // Check if already processing
        if (removingIndices.includes(index)) return;

        // Add to processing list
        setRemovingIndices(prev => [...prev, index]);

        try {
            const result = await removeBackground(uri);
            if (result) {
                setUpdatedProduct((prev: any) => {
                    const newImages = [...prev.images];
                    newImages[index] = { ...newImages[index], uri: result };
                    return { ...prev, images: newImages };
                });
            }
        } catch (err) {
            console.error('BG removal failed:', err);
        } finally {
            // Remove from processing list
            setRemovingIndices(prev => prev.filter(i => i !== index));
        }
    };

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
                        <View key={`${imageObj.uri}-${index}`} className='w-[170px]'>
                            <View className='bg-white rounded-[10px] overflow-hidden border border-gray-100 shadow-sm'>
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

                                    {/* Remove BG Button */}
                                    <TouchableOpacity
                                        onPress={() => handleRemoveBg(index)}
                                        disabled={removingIndices.includes(index)}
                                        className='absolute top-3 left-3 bg-purple-600 h-7 px-3 rounded-full items-center justify-center shadow-sm flex-row'
                                        style={{ opacity: removingIndices.includes(index) ? 0.6 : 1 }}
                                    >
                                        {removingIndices.includes(index) ? (
                                            <ActivityIndicator size={12} color='white' />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="auto-fix" size={12} color="white" />
                                                <Text className='text-white text-[8px] font-black uppercase ml-1.5'>bg-remove</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    {/* Navigation Controls */}
                                    <View className='absolute bottom-3 left-3 flex flex-row bg-black/90 rounded-xl overflow-hidden shadow-lg'>
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

                                    {/* Edit Button */}
                                    <TouchableOpacity
                                        onPress={() => editImage(index)}
                                        className='absolute bottom-3 right-3 bg-white w-9 h-9 rounded-xl items-center justify-center shadow-sm'
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
                                                className={`px-3 py-2 rounded-xl border-2 flex-row items-center gap-x-2 ${!currentSpecId ? 'border-black bg-black' : 'border-gray-100 bg-gray-50'}`}
                                            >
                                                <View className='w-4 h-4 rounded-full border border-gray-100 shadow-sm bg-gray-200 items-center justify-center'>
                                                    <Text className={`text-[8px] font-black ${!currentSpecId ? 'text-black' : 'text-gray-400'}`}>✕</Text>
                                                </View>
                                                <View>
                                                    <Text className={`text-[9px] font-black uppercase tracking-tight ${!currentSpecId ? 'text-white' : 'text-black'}`}>Unlinked</Text>
                                                    <Text className={`text-[8px] font-bold ${!currentSpecId ? 'text-gray-300' : 'text-gray-400'}`}>General view</Text>
                                                </View>
                                            </TouchableOpacity>

                                            {/* SPEC DETAILS */}
                                            {updatedProduct.specifications.map((spec: any) => {
                                                const isLinked = currentSpecId?.toString() === spec._id?.toString();
                                                return (
                                                    <TouchableOpacity
                                                        key={spec._id}
                                                        //@ts-ignore
                                                        onPress={() => handleLinkSpec(imageObj.uri, spec._id)}
                                                        className={`px-3 py-2 rounded-xl border-2 flex-row items-center gap-x-2 ${isLinked ? 'border-black bg-black' : 'border-gray-100 bg-gray-50'}`}
                                                        activeOpacity={0.7}
                                                    >
                                                        {/* Mini Color Indicator */}
                                                        <View
                                                            className='w-4 h-4 rounded-full border border-gray-100 shadow-sm'
                                                            style={{ backgroundColor: spec.colorHex || '#F3F4F6' }}
                                                        />

                                                        <View>
                                                            <Text
                                                                numberOfLines={1}
                                                                className={`text-[9px] font-black uppercase tracking-tight ${isLinked ? 'text-white' : 'text-black'}`}
                                                            >
                                                                {spec.color || 'No Color'} • {spec.size || 'No Size'}
                                                            </Text>
                                                            <Text
                                                                numberOfLines={1}
                                                                className={`text-[8px] font-bold ${isLinked ? 'text-gray-300' : 'text-gray-400'}`}
                                                            >
                                                                {spec.price} DT | {spec.unlimited ? '∞' : spec.quantity} Qty
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
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
                        if (!selectedImages) return;
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