"use client";
import { backEndUrl } from '@/api';
import HandleCollections from '@/components/main/handleCollections';
import HandleImages from '@/components/main/HandleImages';
import HandleSpecifications from '@/components/main/handleSpecifications';
import Header from '@/components/main/header';
import { colors, icons } from '@/constants';
import { useAdmin } from '@/contexts/admin';
import { useLoadingScreen } from '@/contexts/loadingScreen';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { useBanner } from '@/contexts/yesNoBanner';
import { pickImage } from '@/lib';
import { ProductToEditType } from '@/types';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProductSection = () => {
    const { id } = useLocalSearchParams();
    const { setLoadingScreen } = useLoadingScreen();
    const { showBanner } = useBanner();
    const [updatedProduct, setUpdatedProduct] = useState<ProductToEditType | null>(null);
    const [fetching, setFetching] = useState(true); // لودر جلب البيانات
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${backEndUrl}/getProductById`, {
                    params: { productId: id, status: JSON.stringify(["active", "archived"]) }
                });
                setUpdatedProduct({
                    ...data.product,
                    price: data.product.price?.toString() ?? '',
                    specifications: [...data.product.specifications].reverse()
                });
            } catch (err) {
                console.log(err);
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [id]);

    const handleDelete = async () => {
        if (!admin?.accesses?.includes('Manage Products')) {
            setStatusBanner(true, "You don't have permission to delete products", "error");
            return;
        }
        if (!updatedProduct) return;
        showBanner({
            message: "Permanently delete this product? This action cannot be undone.",
            onConfirm: async () => {
                setLoadingScreen(true, "Deleting...");
                try {
                    await axios.put(`${backEndUrl}/deleteProducts`, { ids: [updatedProduct._id] });
                    router.back();
                } catch (err) { setStatusBanner(true, "Delete failed.", "error"); }
                finally { setLoadingScreen(false); }
            }
        });
    };

    const handleConfirm = async () => {
        if (!admin?.accesses?.includes("Manage Products")) {
            setStatusBanner(true, "You don't have permission to edit products", "error");
            return;
        }
        if (!updatedProduct) return;
        Keyboard.dismiss();
        setLoadingScreen(true, "Synchronizing...");

        try {
            const formData = new FormData();
            const newImagesSpecsData: any[] = [];
            const existingImages: any[] = [];

            const specsToSend = updatedProduct.specifications.map(s => ({
                ...s,
                price: parseFloat(s.price?.toString() || "0") || 0,
                quantity: parseInt(s.quantity?.toString() || "0") || 0
            }));

            updatedProduct.images.forEach((img, index) => {
                const isNew = !img?.uri.startsWith('http');
                const currentImgSpecId = typeof img?.specification === 'object'
                    ? (img?.specification as any)?._id
                    : img?.specification;

                const linkedSpec = updatedProduct.specifications.find(s =>
                    s._id?.toString() === currentImgSpecId?.toString()
                );

                const specProps = linkedSpec ? {
                    color: linkedSpec.color?.trim(),
                    size: linkedSpec.size?.trim()
                } : null;

                if (isNew) {
                    newImagesSpecsData.push(specProps);
                    formData.append("images", {
                        uri: img?.uri,
                        type: "image/jpeg",
                        name: `img_${Date.now()}_${index}.jpg`
                    } as any);
                } else {
                    existingImages.push({
                        uri: img?.uri,
                        specification: currentImgSpecId,
                        specProps: specProps
                    });
                }
            });

            formData.append("_id", updatedProduct._id);
            formData.append("nameFr", updatedProduct.name.fr);
            formData.append("price", updatedProduct.price.toString().replace(/[^0-9.]/g, ''));
            formData.append("descriptionFr", updatedProduct.description.fr || "");
            formData.append("specifications", JSON.stringify(specsToSend));
            formData.append("existingImages", JSON.stringify(existingImages));
            formData.append("newImagesSpecsData", JSON.stringify(newImagesSpecsData));
            formData.append("collections", JSON.stringify(updatedProduct.collections || []));

            if (updatedProduct?.thumbNail?.startsWith('http')) {
                formData.append("thumbNail", updatedProduct?.thumbNail);
            } else {
                formData.append("thumbNail", { uri: updatedProduct?.thumbNail, type: "image/jpeg", name: "thumb.jpg" } as any);
            }

            await axios.put(`${backEndUrl}/updateProduct`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            router.back();
        } catch (err: any) {
            console.error("Sync Error:", err.response?.data || err.message);
            setStatusBanner(true, "Failed to sync. Please try again.", "error");
        } finally { setLoadingScreen(false); }
    };

    // 1. Loading UI الجديد (شاشة كاملة نظيفة)
    if (fetching) {
        return (
            <View className='flex-1 justify-center items-center' style={{ backgroundColor: colors.light[100], minHeight: '100%' }}>
                <ActivityIndicator size="large" color={colors.dark[100]} />
                <Text className='mt-4 font-black text-[10px] uppercase tracking-[3px] opacity-20'>Fetching Details</Text>
            </View>
        );
    }

    if (!updatedProduct) return null;

    return (
        <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[100] }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <Header
                title='Edit Product'
                onBackButtonPress={() => router.back()}
                items={
                    <View className='flex-row items-center'>
                        {/* 2. زر الحذف الجديد (تم نقله للهيدر للتسهيل) */}
                        <TouchableOpacity onPress={handleDelete} className='h-14 w-12 justify-center items-center mr-1'>
                            <Feather name="trash-2" size={20} color="#ef4444" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleConfirm} className='h-14 w-14 justify-center items-center'>
                            <Image source={require('@/app/assets/icons/tick.png')} className='w-6 h-6' />
                        </TouchableOpacity>
                    </View>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    className='flex-1'
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{ padding: 22, paddingBottom: 60, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* التصميم الأصلي كما هو */}
                    <View className='flex flex-row justify-between items-start mb-8'>
                        <TouchableOpacity
                            className='w-[130px] h-[130px] rounded-[35px] overflow-hidden border-4 border-white shadow-xl shadow-black/10'
                            onPress={async () => {
                                const result = await pickImage();
                                if (!result) return;
                                const uri = typeof result === 'string' ? result : result.uri;
                                const comp = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
                                setUpdatedProduct(prev => prev ? ({ ...prev, thumbNail: comp.uri }) : null);
                            }}
                        >
                            <Image source={{ uri: updatedProduct.thumbNail }} className='w-full h-full' />
                            <View className='absolute bottom-0 right-0 p-2 bg-black/60 rounded-tl-2xl'>
                                <Image source={icons.editText} className='w-3 h-3' style={{ tintColor: 'white' }} />
                            </View>
                        </TouchableOpacity>

                        <View className='flex-1 ml-5 gap-y-4'>
                            <View>
                                <Text className='text-gray-400 text-[10px] mb-2 font-black uppercase tracking-widest ml-1'>Name (FR)</Text>
                                <TextInput
                                    value={updatedProduct.name.fr}
                                    onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, name: { ...updatedProduct.name, fr: text } })}
                                    className='bg-white rounded-2xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                />
                            </View>
                            <View>
                                <Text className='text-gray-400 text-[10px] mb-2 font-black uppercase tracking-widest ml-1'>Base Price</Text>
                                <TextInput
                                    value={updatedProduct.price}
                                    onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, price: text })}
                                    className='bg-white rounded-2xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                    </View>

                    <View className='mb-8'>
                        <View className='mb-5'>
                            <Text className='text-xl font-black text-black uppercase tracking-tighter'>Description</Text>
                            <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Product Details & Story</Text>
                        </View>
                        <TextInput
                            value={updatedProduct.description.fr}
                            onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, description: { ...updatedProduct.description, fr: text } })}
                            className='bg-white rounded-[30px] p-5 text-sm min-h-[140px] shadow-sm border border-gray-50'
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <HandleSpecifications updatedProduct={updatedProduct} setUpdatedProduct={setUpdatedProduct} />
                    <View className='h-8' />
                    <HandleCollections updatedProduct={updatedProduct} setUpdatedProduct={setUpdatedProduct} />
                    <View className='h-8' />
                    <HandleImages updatedProduct={updatedProduct} setUpdatedProduct={setUpdatedProduct} />

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

export default ProductSection;