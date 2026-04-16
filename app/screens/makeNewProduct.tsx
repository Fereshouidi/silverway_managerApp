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
import { pickImage, removeBackground } from '@/lib';
import { ProductToEditType } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MakeNewProduct = () => {
    const { setLoadingScreen } = useLoadingScreen();
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();

    const [updatedProduct, setUpdatedProduct] = useState<ProductToEditType>({
        //@ts-ignore
        name: { fr: "" },
        //@ts-ignore
        description: { fr: "" },
        price: "",
        oldPrice: "",
        thumbNail: "",
        images: [],
        specifications: [],
        collections: [] // ستبدأ كمصفوفة فارغة وتُملأ بـ IDs نصوص
    });
    const [removingThumbBg, setRemovingThumbBg] = useState(false);

    const handleConfirm = async () => {
        if (!admin?.accesses?.includes("Manage Products")) {
            setStatusBanner(true, "You don't have permission to create products", "error");
            return;
        }
        // التحقق من الحقول الأساسية
        if (!updatedProduct.name.fr || !updatedProduct.price || !updatedProduct.thumbNail) {
            setStatusBanner(true, "Please fill in required fields: Name, Price, and Thumbnail.", "warning");
            return;
        }

        Keyboard.dismiss();
        setLoadingScreen(true, "Creating Product...");

        try {
            const formData = new FormData();
            const newImagesSpecsData: any[] = [];

            // 1. معالجة الـ Thumbnail
            formData.append("thumbnail", {
                uri: updatedProduct.thumbNail,
                type: "image/jpeg",
                name: "thumbnail.jpg",
            } as any);

            // 2. معالجة الصور الإضافية والربط بالمواصفات
            updatedProduct.images.forEach((img, index) => {
                //@ts-ignore
                const uri = typeof img === 'string' ? img : img.uri;

                // استخراج الـ ID المرتبط بالصورة حالياً
                const currentImgSpecId = typeof img === 'object' ? (img as any).specification : null;

                // البحث عن المواصفة في المصفوفة لاستخراج لونها وحجمها ليربطها السيرفر
                const linkedSpec = updatedProduct.specifications.find(s =>
                    s._id?.toString() === (typeof currentImgSpecId === 'object' ? currentImgSpecId?._id : currentImgSpecId)?.toString()
                );

                const specProps = linkedSpec ? {
                    color: linkedSpec.color?.trim(),
                    size: linkedSpec.size?.trim()
                } : null;

                newImagesSpecsData.push(specProps);

                formData.append("images", {
                    uri: uri,
                    type: "image/jpeg",
                    name: `image_${Date.now()}_${index}.jpg`,
                } as any);
            });

            // 3. إرسال خريطة الربط والبيانات النصية
            formData.append("newImagesSpecsData", JSON.stringify(newImagesSpecsData));
            formData.append("nameFr", updatedProduct.name.fr);
            formData.append("price", (updatedProduct.price || "0").toString().replace(',', '.').replace(/[^0-9.]/g, ''));
            formData.append("oldPrice", (updatedProduct.oldPrice || "0").toString().replace(',', '.').replace(/[^0-9.]/g, ''));
            formData.append("descriptionFr", updatedProduct.description?.fr || "");

            // 4. تنظيف المواصفات (إرسال الخصائص فقط بدون IDs مؤقتة)
            const cleanedSpecs = (updatedProduct.specifications || []).map((spec) => {
                const { _id, ...rest } = spec as any;
                return {
                    ...rest,
                    price: parseFloat(rest.price?.toString() || "0"),
                    quantity: parseInt(rest.quantity?.toString() || "0")
                };
            });
            formData.append("specifications", JSON.stringify(cleanedSpecs));

            // 5. المجموعات - التأكد من إرسال الـ IDs فقط (الحل الجوهري)
            const collectionIds = (updatedProduct.collections || []).map((col: any) =>
                typeof col === 'string' ? col : col._id
            ).filter(Boolean);

            formData.append("collections", JSON.stringify(collectionIds));

            // 6. الطلب للسيرفر
            const response = await axios.post(`${backEndUrl}/addProduct`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.status === 201 || response.status === 200) {
                setStatusBanner(true, "Product added successfully! ✅", "success");
                router.back();
            }
        } catch (err: any) {
            console.error("Submission Error:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || "Error adding product";
            setStatusBanner(true, `${errorMsg} ❌`, "error");
        } finally {
            setLoadingScreen(false);
        }
    };

    return (
        <SafeAreaView className='flex-1 h-full' style={{ backgroundColor: colors.light[150] }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <Header
                title='Create Product'
                style={{ backgroundColor: colors.light[150] }}
                onBackButtonPress={() => router.back()}
                items={
                    <TouchableOpacity
                        onPress={handleConfirm}
                        activeOpacity={0.7}
                        className='h-10 w-10 justify-center items-center rounded-full'
                        style={{ backgroundColor: colors.dark[200] }}
                    >
                        <MaterialCommunityIcons
                            name="check"
                            size={24}
                            color={colors.light[150]}
                        />
                    </TouchableOpacity>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    className='flex-1 h-full bg-red-500-'
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{
                        padding: 20,
                        paddingBottom: 0,
                        flexGrow: 1
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Thumbnail & Basics */}
                    <View className='flex flex-row justify-between items-start mb-8'>
                        <TouchableOpacity
                            className='w-[130px] h-[130px] rounded-xl overflow-hidden border-4 border-white shadow-xl shadow-black/10 justify-center items-center'
                            style={{ backgroundColor: colors.light[200] }}
                            onPress={async () => {
                                const result: any = await pickImage((msg) => setStatusBanner(true, msg, "error"));
                                if (!result) return;
                                const uri = typeof result === 'string' ? result : result?.uri;
                                const comp = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
                                setUpdatedProduct(prev => ({ ...prev, thumbNail: comp.uri }));
                            }}
                        >
                            {updatedProduct.thumbNail ? (
                                <Image source={{ uri: updatedProduct.thumbNail }} className='w-full h-full' />
                            ) : (
                                <Image source={icons.editText} className='w-8 h-8 opacity-20' />
                            )}
                            {/* Remove BG — top left */}
                            {updatedProduct.thumbNail ? (
                                <TouchableOpacity
                                    onPress={async () => {
                                        if (removingThumbBg) return;
                                        setRemovingThumbBg(true);
                                        try {
                                            const result = await removeBackground(updatedProduct.thumbNail);
                                            if (result) {
                                                setUpdatedProduct(prev => ({ ...prev, thumbNail: result }));
                                            } else {
                                                setStatusBanner(true, 'Background removal failed', 'error');
                                            }
                                        } catch (e) {
                                            setStatusBanner(true, 'Background removal failed', 'error');
                                        } finally {
                                            setRemovingThumbBg(false);
                                        }
                                    }}
                                    className='absolute top-2 left-2 bg-purple-600 h-7 px-3 rounded-full items-center justify-center shadow-sm flex-row'
                                    disabled={removingThumbBg}
                                >
                                    {removingThumbBg ? (
                                        <ActivityIndicator size={12} color='white' />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="auto-fix" size={12} color="white" />
                                            <Text className='text-white text-[8px] font-black uppercase ml-1.5'>bg-remove</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ) : null}
                            {/* Edit icon — bottom right */}
                            <View className='absolute bottom-0 right-0 p-2 bg-black/60 rounded-tl-2xl'>
                                <Image source={icons.editText} className='w-3 h-3' style={{ tintColor: 'white' }} />
                            </View>
                        </TouchableOpacity>

                        <View className='flex-1 ml-5 gap-y-4'>
                            <View>
                                <Text className='text-gray-400 text-[10px] mb-2 font-black uppercase tracking-widest ml-1'>Name (FR)</Text>
                                <TextInput
                                    //@ts-ignore
                                    value={updatedProduct.name.fr}
                                    placeholder="e.g. Luxury Watch"
                                    placeholderTextColor="#A3A3A3"
                                    onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, name: { ...updatedProduct.name, fr: text } })}
                                    className='bg-white rounded-xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                />
                            </View>
                            <View className='flex-row gap-x-2'>
                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[10px] mb-2 font-black uppercase tracking-widest ml-1'>Price (DT)</Text>
                                    <TextInput
                                        //@ts-ignore
                                        value={updatedProduct.price}
                                        placeholder="0.00"
                                        placeholderTextColor="#A3A3A3"
                                        onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, price: text })}
                                        className='bg-white rounded-xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[10px] mb-2 font-black uppercase tracking-widest ml-1'>Old Price</Text>
                                    <TextInput
                                        //@ts-ignore
                                        value={updatedProduct.oldPrice}
                                        placeholder="0.00"
                                        placeholderTextColor="#A3A3A3"
                                        onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, oldPrice: text })}
                                        className='bg-white rounded-xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View className='mb-8'>
                        <View className='mb-5'>
                            <Text className='text-xl font-black text-black uppercase tracking-tighter'>Description</Text>
                            <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Product Details & Story</Text>
                        </View>
                        <TextInput
                            value={updatedProduct?.description.fr || ""}
                            placeholder="Tell more about your product..."
                            placeholderTextColor="#A3A3A3"
                            onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, description: { ...updatedProduct.description, fr: text } })}
                            className='bg-white rounded-xl p-5 text-sm min-h-[140px] shadow-sm border border-gray-50'
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Sub-components */}
                    <HandleSpecifications updatedProduct={updatedProduct} setUpdatedProduct={setUpdatedProduct} />
                    <View className='h-6' />
                    <HandleCollections updatedProduct={updatedProduct} setUpdatedProduct={setUpdatedProduct} />
                    <View className='h-6' />
                    <HandleImages updatedProduct={updatedProduct} setUpdatedProduct={setUpdatedProduct} />

                    <View className='h-10' />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default MakeNewProduct;