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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
    View,
    Modal,
    FlatList
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
    const [analytics, setAnalytics] = useState<any>(null);
    const [notFound, setNotFound] = useState(false);
    const [analyticsModal, setAnalyticsModal] = useState<{
        visible: boolean;
        title: string;
        data: any[];
        type: 'revenue' | 'cart' | 'buyers' | 'favorites';
    }>({
        visible: false,
        title: '',
        data: [],
        type: 'revenue',
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await axios.get(`${backEndUrl}/getProductAnalytics`, {
                    params: { productId: id }
                });
                if (data.success) {
                    setAnalytics(data.analytics);
                }
            } catch (err) {
                console.log("Analytics Error:", err);
            }
        };
        if (id) fetchAnalytics();
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${backEndUrl}/getProductById`, {
                    params: { productId: id, status: JSON.stringify(["active", "archived"]) }
                });
                setUpdatedProduct({
                    ...data.product,
                    price: data.product.price?.toString() ?? '',
                    oldPrice: (data.product.oldPrice && data.product.oldPrice !== 0) ? data.product.oldPrice.toString() : '',
                    specifications: [...data.product.specifications].reverse(),
                    status: data.product.status || 'active'
                });
            } catch (err) {
                console.log(err);
                setNotFound(true);
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
                const isNew = !img?.uri?.startsWith('http');
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

            formData.append("status", updatedProduct.status || "active");

            formData.append("_id", updatedProduct._id);
            formData.append("nameFr", updatedProduct.name.fr);
            formData.append("price", (updatedProduct.price || "0").toString().replace(',', '.').replace(/[^0-9.]/g, ''));
            formData.append("oldPrice", (updatedProduct.oldPrice || "0").toString().replace(',', '.').replace(/[^0-9.]/g, ''));
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

    const renderAnalyticsModal = () => (
        <Modal
            visible={analyticsModal.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAnalyticsModal({ ...analyticsModal, visible: false })}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '70%', padding: 25 }}>
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-black uppercase tracking-tighter">{analyticsModal.title}</Text>
                        <TouchableOpacity
                            onPress={() => setAnalyticsModal({ ...analyticsModal, visible: false })}
                            className="bg-gray-100 p-2 rounded-full"
                        >
                            <Feather name="x" size={20} color="black" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={analyticsModal.data}
                        keyExtractor={(_, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View className="flex-1 justify-center items-center py-20">
                                <MaterialCommunityIcons name="database-off-outline" size={48} color={colors.light[400]} />
                                <Text className="mt-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest">No data available</Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (!item.clientId) return;
                                    setAnalyticsModal({ ...analyticsModal, visible: false });
                                    router.push({
                                        pathname: '/screens/clientDetails/[id]',
                                        params: { id: item.clientId }
                                    });
                                }}
                                className="flex-row items-center justify-between py-4 border-b border-gray-50"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-3">
                                        <MaterialCommunityIcons
                                            name={
                                                analyticsModal.type === 'revenue' ? "currency-usd" :
                                                    analyticsModal.type === 'cart' ? "cart-outline" :
                                                        analyticsModal.type === 'buyers' ? "package-variant-closed" : "heart-outline"
                                            }
                                            size={20}
                                            color={colors.dark[100]}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-bold text-black">{item.clientName || 'Someone'}</Text>
                                        <Text className="text-[10px] text-gray-400 font-bold uppercase">
                                            {item.date ? new Date(item.date).toLocaleDateString() : 'Real-time'}
                                        </Text>
                                    </View>
                                </View>
                                {analyticsModal.type === 'revenue' && (
                                    <Text className="text-sm font-black text-emerald-600">${item.amount?.toFixed(2)}</Text>
                                )}
                                {(analyticsModal.type === 'cart' || analyticsModal.type === 'buyers') && (
                                    <Text className="text-sm font-black text-blue-600">x{item.quantity || 1}</Text>
                                )}
                                <Feather name="chevron-right" size={14} color="#D1D5DB" className="ml-2" />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    const handleToggleVisibility = async () => {
        // if (!admin?.accesses?.includes('Manage Products')) {
        //     setStatusBanner(true, "You don't have permission to modify products", "error");
        //     return;
        // }
        if (!updatedProduct) return;

        const newStatus = updatedProduct.status === 'archived' ? 'active' : 'archived';

        // We update locally first
        setUpdatedProduct({ ...updatedProduct, status: newStatus });
        // setStatusBanner(true, `Product is now ${newStatus === 'active' ? 'visible' : 'invisible'}. Don't forget to save!`, "success");
    };

    // 1. Loading UI الجديد (شاشة كاملة نظيفة)
    if (fetching) {
        return (
            <View className='flex-1 justify-center items-center' style={{ backgroundColor: colors.light[150], minHeight: '100%' }}>
                <ActivityIndicator size="large" color={colors.dark[100]} />
                <Text className='mt-4 font-black text-[10px] uppercase tracking-[3px] opacity-20'>Fetching Details</Text>
            </View>
        );
    }

    if (notFound) {
        return (
            <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[150] }} edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <Header title='Product Missing' onBackButtonPress={() => router.back()} />
                <View className='flex-1 justify-center items-center p-10'>
                    <MaterialCommunityIcons name="package-variant-remove" size={100} color={colors.dark[100]} />
                    <Text className='mt-8 text-3xl font-black text-center uppercase tracking-tighter'>Unavailable</Text>
                    <Text className='mt-4 text-gray-400 text-center font-bold uppercase text-[10px] tracking-[4px] leading-5' style={{ width: '80%' }}>
                        This product has been permanently deleted or is no longer accessible in the store database.
                    </Text>
                    
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => router.back()}
                        className='mt-12 px-10 py-5 rounded-[30px] shadow-xl shadow-black/10'
                        style={{ backgroundColor: colors.dark[100] }}
                    >
                        <Text className='text-white font-black uppercase text-[10px] tracking-[3px]'>Return to Products</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!updatedProduct) return null;

    return (
        <SafeAreaView className='flex-1 h-full' style={{ backgroundColor: colors.light[150] }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <Header
                title='Edit Product'
                style={{ backgroundColor: colors.light[150] }}
                onBackButtonPress={() => router.back()}
                items={
                    <View className='flex-row items-center gap-3'>
                        {/* 2. زر الحذف الجديد (تم نقله للهيدر للتسهيل) */}
                        {/* <TouchableOpacity onPress={handleDelete} className='h-14 w-12 justify-center items-center mr-1'>
                            <Feather name="trash-2" size={20} color="#ef4444" />
                        </TouchableOpacity> */}

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
                    contentContainerStyle={{ padding: 20, paddingBottom: 0, flexGrow: 1 }}
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
                                    placeholder="e.g. Luxury Watch"
                                    placeholderTextColor="#A3A3A3"
                                    onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, name: { ...updatedProduct.name, fr: text } })}
                                    className='bg-white rounded-2xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                />
                            </View>
                            <View className='flex-row gap-x-2'>
                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[10px] mb-2 font-black uppercase tracking-widest ml-1'>Price</Text>
                                    <TextInput
                                        value={updatedProduct.price}
                                        placeholder="0.00"
                                        placeholderTextColor="#A3A3A3"
                                        onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, price: text })}
                                        className='bg-white rounded-2xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[10px] mb-2 font-black uppercase tracking-widest ml-1'>Old Price</Text>
                                    <TextInput
                                        value={updatedProduct.oldPrice}
                                        placeholder="0.00"
                                        placeholderTextColor="#A3A3A3"
                                        onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, oldPrice: text })}
                                        className='bg-white rounded-2xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                        keyboardType="decimal-pad"
                                    />
                                </View>
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
                            placeholder="Tell more about your product..."
                            placeholderTextColor="#A3A3A3"
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

                    <View className='h-8' />

                    {/* Analytics Section */}
                    <View className='mb-10 p-6 bg-white rounded-[40px] shadow-sm border border-gray-50'>
                        <View className='mb-6 flex-row items-center justify-between'>
                            <View>
                                <Text className='text-xl font-black text-black uppercase tracking-tighter'>Performance</Text>
                                <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Market Insight & Traction</Text>
                            </View>
                            <View className='bg-gray-50 px-3 py-1 rounded-full'>
                                <Text className='text-[8px] font-black text-gray-400 uppercase tracking-widest'>Live Data</Text>
                            </View>
                        </View>

                        <View className='flex-row flex-wrap justify-between gap-y-4'>
                            {/* Revenue Card */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'Revenue Details', data: analytics?.revenueDetails || [], type: 'revenue' })}
                                className='w-[48%] bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50'
                            >
                                <View className='w-9 h-9 bg-emerald-500 rounded-2xl items-center justify-center mb-3 shadow-sm shadow-emerald-200'>
                                    <MaterialCommunityIcons name="currency-usd" size={18} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-emerald-800/40 uppercase mb-0.5'>Revenue</Text>
                                <Text className='text-lg font-black text-emerald-950'>${analytics?.totalRevenue?.toFixed(2) || '0.00'}</Text>
                            </TouchableOpacity>

                            {/* In Cart Card */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'In Cart Details', data: analytics?.inCartDetails || [], type: 'cart' })}
                                className='w-[48%] bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50'
                            >
                                <View className='w-9 h-9 bg-blue-500 rounded-2xl items-center justify-center mb-3 shadow-sm shadow-blue-200'>
                                    <MaterialCommunityIcons name="shopping" size={18} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-blue-800/40 uppercase mb-0.5'>In Cart</Text>
                                <Text className='text-lg font-black text-blue-950'>{analytics?.inCartCount || 0}</Text>
                            </TouchableOpacity>

                            {/* Total Sold Card */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'Sales Details', data: analytics?.revenueDetails || [], type: 'buyers' })}
                                className='w-[48%] bg-purple-50/50 p-4 rounded-3xl border border-purple-100/50'
                            >
                                <View className='w-9 h-9 bg-purple-500 rounded-2xl items-center justify-center mb-3 shadow-sm shadow-purple-200'>
                                    <MaterialCommunityIcons name="package-variant-closed" size={18} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-purple-800/40 uppercase mb-0.5'>Total Sold</Text>
                                <Text className='text-lg font-black text-purple-950'>{analytics?.totalQuantity || 0}</Text>
                            </TouchableOpacity>

                            {/* Favorites Card */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'Favorites Details', data: analytics?.favoriteDetails || [], type: 'favorites' })}
                                className='w-[48%] bg-rose-50/50 p-4 rounded-3xl border border-rose-100/50'
                            >
                                <View className='w-9 h-9 bg-rose-500 rounded-2xl items-center justify-center mb-3 shadow-sm shadow-rose-200'>
                                    <MaterialCommunityIcons name="heart" size={18} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-rose-800/40 uppercase mb-0.5'>Favorites</Text>
                                <Text className='text-lg font-black text-rose-950'>{analytics?.favoriteCount || 0}</Text>
                            </TouchableOpacity>
                        </View>

                        <View className='mt-6 pt-4 border-t border-gray-50 flex-row justify-between items-center'>
                            <Text className='text-[8px] font-bold text-gray-300 uppercase'>Data updated just now</Text>
                            <View className='flex-row items-center'>
                                <View className='w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse' />
                                <Text className='text-[8px] font-bold text-emerald-500 uppercase'>System Active</Text>
                            </View>
                        </View>
                    </View>

                    {/* Product Management Section */}
                    <View className='mb-20'>
                        <View className='mb-4'>
                            <Text className='text-xl font-black text-black uppercase tracking-tighter'>Management</Text>
                            <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Product Status & Visibility</Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleToggleVisibility}
                            activeOpacity={0.8}
                            className='bg-white border border-gray-100 p-6 rounded-[35px] flex-row items-center justify-between shadow-sm mb-3'
                        >
                            <View className='flex-row items-center'>
                                <View className={`w-12 h-12 ${updatedProduct.status === 'archived' ? 'bg-amber-100' : 'bg-emerald-100'} rounded-2xl items-center justify-center mr-4`}>
                                    <MaterialCommunityIcons
                                        name={updatedProduct.status === 'archived' ? "eye-off-outline" : "eye-outline"}
                                        size={24}
                                        color={updatedProduct.status === 'archived' ? "#d97706" : "#059669"}
                                    />
                                </View>
                                <View>
                                    <Text className='text-base font-black text-black'>
                                        {updatedProduct.status === 'archived' ? 'Make Visible' : 'Make Invisible'}
                                    </Text>
                                    <Text className='text-[10px] text-gray-400 font-bold uppercase'>
                                        {updatedProduct.status === 'archived' ? 'Currently hidden from customers' : 'Currently public in the store'}
                                    </Text>
                                </View>
                            </View>
                            <View className={`px-3 py-1 rounded-full ${updatedProduct.status === 'archived' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                                <Text className={`text-[8px] font-black uppercase tracking-widest ${updatedProduct.status === 'archived' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {updatedProduct.status || 'active'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleDelete}
                            activeOpacity={0.8}
                            className='bg-white border border-gray-100 p-6 rounded-[35px] flex-row items-center justify-between shadow-sm'
                        >
                            <View className='flex-row items-center'>
                                <View className='w-12 h-12 bg-red-100 rounded-2xl items-center justify-center mr-4'>
                                    <MaterialCommunityIcons name="delete-outline" size={24} color="#ef4444" />
                                </View>
                                <View>
                                    <Text className='text-base font-black text-black'>Remove Product</Text>
                                    <Text className='text-[10px] text-gray-400 font-bold uppercase'>Permanently delete from store</Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {renderAnalyticsModal()}
        </SafeAreaView>
    );
}

export default ProductSection;