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
import { pickImage, removeBackground } from '@/lib';
import { ProductToEditType } from '@/types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
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
    const [fetching, setFetching] = useState(true);
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();
    const [analytics, setAnalytics] = useState<any>(null);
    const [notFound, setNotFound] = useState(false);
    const [removingThumbBg, setRemovingThumbBg] = useState(false);

    const [analyticsModal, setAnalyticsModal] = useState<{
        visible: boolean;
        title: string;
        data: any[];
        type: 'revenue' | 'cart' | 'buyers' | 'favorites' | 'evaluations';
    }>({
        visible: false,
        title: '',
        data: [],
        type: 'revenue',
    });

    const [isEditingEval, setIsEditingEval] = useState<any>(null);

    const fetchAnalytics = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        if (id) fetchAnalytics();
    }, [id, fetchAnalytics]);

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
            formData.append("nameFr", updatedProduct.name.fr ?? '');
            formData.append("price", (updatedProduct.price || "0").toString().replace(',', '.').replace(/[^0-9.]/g, ''));
            formData.append("oldPrice", (updatedProduct.oldPrice || "0").toString().replace(',', '.').replace(/[^0-9.]/g, ''));
            formData.append("descriptionFr", updatedProduct.description.fr ?? "");
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

    const handleDeleteEvaluation = useCallback(async (evaluationId: string) => {
        showBanner({
            message: "Remove this client evaluation?",
            onConfirm: async () => {
                try {
                    await axios.delete(`${backEndUrl}/deleteEvaluationById`, { params: { id: evaluationId } });
                    setStatusBanner(true, "Evaluation removed", "success");
                    fetchAnalytics();
                    setAnalyticsModal(prev => ({ ...prev, visible: false }));
                } catch (err) {
                    setStatusBanner(true, "Failed to remove", "error");
                }
            }
        });
    }, [showBanner, fetchAnalytics, setStatusBanner]);

    const handleEditEvaluation = useCallback((item: any) => {
        setIsEditingEval(item);
    }, []);

    const handleSaveEvaluation = useCallback(async (evaluationId: string, note: string, rating: number) => {
        try {
            await axios.put(`${backEndUrl}/updateEvaluationById`, {
                updatedData: {
                    _id: evaluationId,
                    note: note,
                    number: rating
                }
            });
            setStatusBanner(true, "Evaluation updated", "success");
            setIsEditingEval(null);
            fetchAnalytics();
            setAnalyticsModal(prev => ({ ...prev, visible: false }));
        } catch (err) {
            setStatusBanner(true, "Update failed", "error");
        }
    }, [fetchAnalytics, setStatusBanner]);

    const handleToggleVisibility = async () => {
        if (!updatedProduct) return;
        const newStatus = updatedProduct.status === 'archived' ? 'active' : 'archived';
        setUpdatedProduct({ ...updatedProduct, status: newStatus });
    };

    if (fetching) {
        return (
            <View className='flex-1 justify-center items-center' style={{ backgroundColor: colors.light[150], minHeight: '100%' }}>
                <ActivityIndicator size="large" color={colors.dark[100]} />
                <Text className='mt-4 font-black text-[10px] uppercase tracking-[3px] opacity-20'>Fetching Details</Text>
            </View>
        );
    }

    if (notFound || !updatedProduct) {
        return (
            <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[150] }} edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <Header title='Product Unavailable' onBackButtonPress={() => router.back()} />
                <View className='flex-1 justify-center items-center p-10'>
                    <MaterialCommunityIcons name="package-variant-remove" size={100} color={colors.dark[100]} />
                    <Text className='mt-8 text-3xl font-black text-center uppercase tracking-tighter'>Unavailable</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.back()}
                        className='mt-12 px-10 py-5 rounded-xl shadow-xl shadow-black/10'
                        style={{ backgroundColor: colors.dark[100] }}
                    >
                        <Text className='text-white font-black uppercase text-[10px] tracking-[3px]'>Return to Products</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className='flex-1 h-full' style={{ backgroundColor: colors.light[150] }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <Header
                title='Edit Product'
                style={{ backgroundColor: colors.light[150] }}
                onBackButtonPress={() => router.back()}
                items={
                    <View className='flex-row items-center gap-3'>
                        <TouchableOpacity
                            onPress={handleConfirm}
                            activeOpacity={0.7}
                            className='h-10 w-10 justify-center items-center rounded-full'
                            style={{ backgroundColor: colors.dark[200] }}
                        >
                            <MaterialCommunityIcons name="check" size={24} color={colors.light[150]} />
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
                    contentContainerStyle={{ padding: 20, paddingBottom: 0 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Image and Basic Info */}
                    <View className='flex flex-row justify-between items-start mb-8'>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            className='w-[130px] h-[130px] rounded-xl overflow-hidden border-4 border-white shadow-2xl shadow-black/20'
                            onPress={async () => {
                                const result = await pickImage();
                                if (!result) return;
                                const uri = typeof result === 'string' ? result : result.uri;
                                const comp = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
                                setUpdatedProduct(prev => prev ? ({ ...prev, thumbNail: comp.uri }) : null);
                            }}
                        >
                            <Image source={{ uri: updatedProduct.thumbNail ?? '' }} className='w-full h-full' />
                            <View className='absolute inset-0 bg-black/10 items-center justify-center'>
                                <View className='p-2 bg-white/80 rounded-full shadow-lg'>
                                    <Feather name="camera" size={16} color="black" />
                                </View>
                            </View>
                            {/* Remove BG — top left */}
                            <TouchableOpacity
                                onPress={async (e) => {
                                    e.stopPropagation();
                                    if (removingThumbBg || !updatedProduct.thumbNail) return;
                                    setRemovingThumbBg(true);
                                    try {
                                        const result = await removeBackground(updatedProduct.thumbNail);
                                        if (result) {
                                            setUpdatedProduct(prev => prev ? ({ ...prev, thumbNail: result }) : null);
                                        } else {
                                            setStatusBanner(true, 'Background removal failed', 'error');
                                        }
                                    } catch (err) {
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
                        </TouchableOpacity>

                        <View className='flex-1 ml-6 gap-y-4'>
                            <View>
                                <Text className='text-gray-400 text-[9px] mb-2 font-black uppercase tracking-widest ml-1'>Name (FR)</Text>
                                <TextInput
                                    value={updatedProduct.name.fr ?? ''}
                                    placeholder="e.g. Luxury Watch"
                                    placeholderTextColor="#A3A3A3"
                                    onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, name: { ...updatedProduct.name, fr: text } })}
                                    className='bg-white rounded-xl p-4 text-sm font-bold shadow-sm border border-gray-50'
                                />
                            </View>
                            <View className='flex-row gap-x-3'>
                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[9px] mb-2 font-black uppercase tracking-widest ml-1'>Price</Text>
                                    <TextInput
                                        value={updatedProduct.price ?? ''}
                                        placeholder="0.00"
                                        placeholderTextColor="#A3A3A3"
                                        onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, price: text })}
                                        className='bg-white rounded-xl p-4 text-sm font-black shadow-sm border border-gray-50'
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[9px] mb-2 font-black uppercase tracking-widest ml-1'>Old Price</Text>
                                    <TextInput
                                        value={updatedProduct.oldPrice ?? ''}
                                        placeholder="0.00"
                                        placeholderTextColor="#A3A3A3"
                                        onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, oldPrice: text })}
                                        className='bg-white rounded-xl p-4 text-sm font-black shadow-sm border border-gray-50 text-gray-400'
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
                            value={updatedProduct.description.fr ?? ''}
                            placeholder="Tell more about your product..."
                            placeholderTextColor="#A3A3A3"
                            onChangeText={(text) => setUpdatedProduct({ ...updatedProduct, description: { ...updatedProduct.description, fr: text } })}
                            className='bg-white rounded-xl p-6 text-sm min-h-[160px] shadow-sm border border-gray-50 leading-6'
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
                    <View className='mb-10 p-7 bg-white rounded-xl shadow-sm border border-gray-100'>
                        <View className='mb-8 flex-row items-center justify-between'>
                            <View>
                                <Text className='text-xl font-black text-black uppercase tracking-tighter'>Performance</Text>
                                <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Market Insight & Traction</Text>
                            </View>
                            <View className='bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100'>
                                <View className='flex-row items-center gap-x-1.5'>
                                    <View className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                                    <Text className='text-[8px] font-black text-emerald-700 uppercase tracking-widest'>Live Tracking</Text>
                                </View>
                            </View>
                        </View>

                        <View className='flex-row flex-wrap justify-between gap-y-4'>
                            {/* Revenue Card */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'Revenue Details', data: analytics?.revenueDetails || [], type: 'revenue' })}
                                className='w-[48%] bg-emerald-50/40 p-5 rounded-xl border border-emerald-100/40'
                            >
                                <View className='w-10 h-10 bg-emerald-500 rounded-xl items-center justify-center mb-4 shadow-lg shadow-emerald-200'>
                                    <MaterialCommunityIcons name="currency-usd" size={20} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-emerald-800/50 uppercase mb-1'>Revenue</Text>
                                <Text className='text-lg font-black text-emerald-950'>{analytics?.totalRevenue?.toFixed(2) || '0.00'} DT</Text>
                            </TouchableOpacity>

                            {/* In Cart Card */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'In Cart Details', data: analytics?.inCartDetails || [], type: 'cart' })}
                                className='w-[48%] bg-blue-50/40 p-5 rounded-xl border border-blue-100/40'
                            >
                                <View className='w-10 h-10 bg-blue-500 rounded-xl items-center justify-center mb-4 shadow-lg shadow-blue-200'>
                                    <MaterialCommunityIcons name="shopping" size={20} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-blue-800/50 uppercase mb-1'>In Cart</Text>
                                <Text className='text-lg font-black text-blue-950'>{analytics?.inCartCount || 0}</Text>
                            </TouchableOpacity>

                            {/* Total Sold Card */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'Sales Details', data: analytics?.revenueDetails || [], type: 'buyers' })}
                                className='w-[48%] bg-purple-50/40 p-5 rounded-xl border border-purple-100/40'
                            >
                                <View className='w-10 h-10 bg-purple-500 rounded-xl items-center justify-center mb-4 shadow-lg shadow-purple-200'>
                                    <MaterialCommunityIcons name="package-variant-closed" size={20} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-purple-800/50 uppercase mb-1'>Total Sold</Text>
                                <Text className='text-lg font-black text-purple-950'>{analytics?.totalQuantity || 0}</Text>
                            </TouchableOpacity>

                            {/* Favorites Card */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'Favorites Details', data: analytics?.favoriteDetails || [], type: 'favorites' })}
                                className='w-[48%] bg-rose-50/40 p-5 rounded-xl border border-rose-100/40'
                            >
                                <View className='w-10 h-10 bg-rose-500 rounded-xl items-center justify-center mb-4 shadow-lg shadow-rose-200'>
                                    <MaterialCommunityIcons name="heart" size={20} color="white" />
                                </View>
                                <Text className='text-[9px] font-black text-rose-800/50 uppercase mb-1'>Favorites</Text>
                                <Text className='text-lg font-black text-rose-950'>{analytics?.favoriteCount || 0}</Text>
                            </TouchableOpacity>

                            {/* Evaluations Card */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setAnalyticsModal({ visible: true, title: 'Evaluations', data: analytics?.evaluationDetails || [], type: 'evaluations' })}
                                className='w-full bg-amber-50/40 p-5 rounded-xl border border-amber-100/40 flex-row items-center justify-between'
                            >
                                <View className='flex-row items-center'>
                                    <View className='w-11 h-11 bg-amber-500 rounded-xl items-center justify-center mr-4 shadow-lg shadow-amber-200'>
                                        <MaterialCommunityIcons name="star-outline" size={22} color="white" />
                                    </View>
                                    <View>
                                        <Text className='text-[9px] font-black text-amber-800/50 uppercase mb-1'>Average Reviews</Text>
                                        <Text className='text-lg font-black text-amber-950'>{analytics?.evaluationCount || 0} Feedbacks</Text>
                                    </View>
                                </View>
                                <Feather name="chevron-right" size={20} color="#d97706" />
                            </TouchableOpacity>
                        </View>
                    </View>


                    {/* Management Section */}
                    <View className='mb-24'>
                        <View className='mb-6'>
                            <Text className='text-xl font-black text-black uppercase tracking-tighter'>Management</Text>
                            <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Availability & Visibility</Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleToggleVisibility}
                            activeOpacity={0.8}
                            className='bg-white border border-gray-100 p-7 rounded-xl flex-row items-center justify-between shadow-sm mb-4'
                        >
                            <View className='flex-row items-center'>
                                <View className={`w-12 h-12 ${updatedProduct.status === 'archived' ? 'bg-amber-50' : 'bg-emerald-50'} rounded-xl items-center justify-center mr-5`}>
                                    <MaterialCommunityIcons
                                        name={updatedProduct.status === 'archived' ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={updatedProduct.status === 'archived' ? "#d97706" : "#059669"}
                                    />
                                </View>
                                <View>
                                    <Text className='text-[16px] font-black text-black leading-6'>
                                        {updatedProduct.status === 'archived' ? 'Set as Visible' : 'Set as Hidden'}
                                    </Text>
                                    <Text className='text-[10px] text-gray-400 font-bold uppercase mt-1'>
                                        {updatedProduct.status === 'archived' ? 'Hidden from storefront' : 'Visible to customers'}
                                    </Text>
                                </View>
                            </View>
                            <View className={`px-4 py-1.5 rounded-full ${updatedProduct.status === 'archived' ? 'bg-amber-100/50' : 'bg-emerald-100/50'}`}>
                                <Text className={`text-[9px] font-black uppercase tracking-widest ${updatedProduct.status === 'archived' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {updatedProduct.status}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleDelete}
                            activeOpacity={0.8}
                            className='bg-white border border-gray-100 p-7 rounded-xl flex-row items-center justify-between shadow-sm'
                        >
                            <View className='flex-row items-center'>
                                <View className='w-12 h-12 bg-red-50 rounded-xl items-center justify-center mr-5'>
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                                </View>
                                <View>
                                    <Text className='text-[16px] font-black text-black leading-6'>Delete product</Text>
                                    <Text className='text-[10px] text-gray-400 font-bold uppercase mt-1'>Permanent database removal</Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={22} color="#D1D5DB" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <AnalyticsModal
                config={analyticsModal}
                onClose={() => setAnalyticsModal(prev => ({ ...prev, visible: false }))}
                onEditEval={handleEditEvaluation}
                onDeleteEval={handleDeleteEvaluation}
            />
            <EvaluationEditModal
                item={isEditingEval}
                onClose={() => setIsEditingEval(null)}
                onSave={handleSaveEvaluation}
            />
        </SafeAreaView>
    );
};

// --- Sub-components to optimize performance ---

const AnalyticsModal = React.memo(({ config, onClose, onEditEval, onDeleteEval }: any) => {
    return (
        <Modal
            visible={config.visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 15, borderTopRightRadius: 15, height: '78%', padding: 30 }}>
                    <View className="flex-row justify-between items-center mb-8">
                        <View>
                            <Text className="text-2xl font-black uppercase tracking-tighter">{config.title}</Text>
                            <Text className='text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1'>Database Records</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="bg-gray-100 p-3 rounded-full">
                            <Feather name="x" size={22} color="black" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={config.data}
                        keyExtractor={(_, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={12}
                        removeClippedSubviews={true}
                        contentContainerStyle={{ paddingBottom: 50 }}
                        ListEmptyComponent={() => (
                            <View className="flex-1 justify-center items-center py-20">
                                <MaterialCommunityIcons name="database-off-outline" size={56} color={colors.light[400]} />
                                <Text className="mt-5 text-gray-400 font-bold uppercase text-[11px] tracking-[4px]">No records found</Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (!item.clientId) return;
                                    onClose();
                                    router.push({ pathname: '/screens/clientDetails/[id]', params: { id: item.clientId } });
                                }}
                                className="flex-row items-center justify-between py-5 border-b border-gray-50"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center mr-4">
                                        <MaterialCommunityIcons
                                            name={
                                                config.type === 'revenue' ? "currency-usd" :
                                                    config.type === 'cart' ? "cart-outline" :
                                                        config.type === 'buyers' ? "package-variant-closed" :
                                                            config.type === 'favorites' ? "heart-outline" : "star-outline"
                                            }
                                            size={22}
                                            color="black"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-black">{item.clientName || 'Someone'}</Text>
                                        <Text className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">
                                            {item.date ? new Date(item.date).toLocaleDateString() : 'Active Interaction'}
                                        </Text>
                                        {config.type === 'evaluations' && item.note && (
                                            <View className='mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100'>
                                                <Text className="text-[12px] text-gray-600 italic leading-5">"{item.note}"</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {config.type === 'evaluations' && (
                                    <View className="flex-row items-center gap-x-2 ml-4">
                                        <View className="bg-amber-50 px-3 py-1.5 rounded-xl flex-row items-center border border-amber-100">
                                            <MaterialCommunityIcons name="star" size={12} color="#d97706" />
                                            <Text className="text-[11px] font-black text-amber-700 ml-1.5">{item.rating}</Text>
                                        </View>
                                        <View className='flex-row items-center gap-x-2'>
                                            <TouchableOpacity onPress={() => onEditEval(item)} className="p-2.5 bg-gray-100 rounded-xl">
                                                <MaterialCommunityIcons name="pencil-outline" size={16} color="black" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => onDeleteEval(item._id)} className="p-2.5 bg-red-50 rounded-xl">
                                                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {config.type === 'revenue' && <Text className="text-base font-black text-emerald-600">{item.amount?.toFixed(2)} DT</Text>}
                                {(config.type === 'cart' || config.type === 'buyers') && <Text className="text-base font-black text-blue-600">x{item.quantity || 1}</Text>}
                                {config.type !== 'evaluations' && <Feather name="chevron-right" size={16} color="#D1D5DB" className="ml-3" />}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
});

const EvaluationEditModal = React.memo(({ item, onClose, onSave }: any) => {
    const [note, setNote] = useState('');

    useEffect(() => {
        if (item) setNote(item.note || '');
    }, [item]);

    if (!item) return null;

    return (
        <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 }}>
                <View className="bg-white rounded-xl p-10 shadow-2xl">
                    <View className='mb-8'>
                        <Text className="text-2xl font-black uppercase tracking-tighter mb-2">Refine Critique</Text>
                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Update the recorded client feedback</Text>
                    </View>

                    <TextInput
                        value={note}
                        onChangeText={setNote}
                        multiline
                        className="bg-gray-50 rounded-xl p-7 text-sm font-medium border border-gray-100 min-h-[160px] leading-6"
                        textAlignVertical="top"
                        autoFocus
                    />

                    <View className="flex-row gap-x-4 mt-10">
                        <TouchableOpacity onPress={onClose} className="flex-1 py-5 rounded-xl bg-gray-100 items-center justify-center">
                            <Text className="font-black uppercase text-[11px] tracking-widest text-gray-500">Dismiss</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onSave(item._id, note, item.rating)} className="flex-[1.5] py-5 px-10 rounded-xl bg-black items-center justify-center">
                            <Text className="font-black uppercase text-[11px] tracking-widest text-white">Commit Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View> 
        </Modal>
    );
});

export default ProductSection;