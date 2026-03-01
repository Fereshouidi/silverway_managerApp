import { backEndUrl } from '@/api'
import Header from '@/components/main/header'
import ProductListForCollectionPicker from '@/components/main/PorductsList/productListForCollectionPicker'
import SkeletonLoading from '@/components/sub/SkeletonLoading'
import { colors, icons } from '@/constants'
import { newCollection } from '@/constants/data'
import { useAdmin } from '@/contexts/admin'
import { useLoadingScreen } from '@/contexts/loadingScreen'
import { useStatusBanner } from '@/contexts/StatusBanner'
import { pickImage } from '@/lib'
import { CollectionType, ProductType } from '@/types/index'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import axios from 'axios'
import * as ImageManipulator from 'expo-image-manipulator'
import { Stack, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const MakeNewCollection = () => {
    const { setLoadingScreen } = useLoadingScreen();

    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [collection, setCollection] = useState<CollectionType>(newCollection);
    const [productsSelected, setProductsSelected] = useState<string[]>([]);
    const [products, setProducts] = useState<ProductType[]>([]);
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();
    const router = useRouter();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(backEndUrl + "/getProducts");
                setProducts(data.products);
            } catch (err) {
                console.log('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleConfirm = async () => {
        if (!admin?.accesses?.includes("Manage Collections")) {
            setStatusBanner(true, "You don't have permission to create collections", "error");
            return;
        }
        if (!collection?.name.fr) {
            setStatusBanner(true, "The name of the collection is required !", "warning");
            return;
        }

        setLoadingScreen(true, "Creating collection...");

        try {
            const formData = new FormData();

            // معالجة الصورة
            const isNewImage = collection.thumbNail &&
                (collection.thumbNail.startsWith('file://') ||
                    collection.thumbNail.startsWith('content://'));

            if (isNewImage) {
                formData.append("thumbnail", {
                    uri: collection.thumbNail,
                    type: "image/jpeg",
                    name: "thumbnail.jpg",
                } as any);
            }

            formData.append("nameFr", collection.name.fr || "");
            formData.append("type", collection.type);
            formData.append("display", String(collection.display));
            formData.append("products", JSON.stringify(productsSelected));

            const response = await axios.post(backEndUrl + "/addCollection", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.status === 201 || response.status === 200) {
                setStatusBanner(true, "Collection created successfully! ✅", "success");
                router.back();
            }

        } catch (err: any) {
            console.error('Creation Error:', err?.response?.data || err.message);
            setStatusBanner(true, "Something went wrong! ❌", "error");
        } finally {
            setLoadingScreen(false);
        }
    };

    if (loading) return <SkeletonLoading />;

    return (
        <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[100] }}>
            <Stack.Screen options={{ headerShown: false }} />

            <Header
                title='New Collection'
                onBackButtonPress={() => router.back()}
                items={
                    <TouchableOpacity
                        onPress={handleConfirm}
                        activeOpacity={0.7}
                        className='h-10 w-10 flex justify-center items-center rounded-full'
                        style={{ backgroundColor: colors.dark[200] }}
                    >
                        <MaterialCommunityIcons
                            name="check"
                            size={24}
                            color={colors.light[100]}
                        />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                className='flex-1'
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Image Picker Section */}
                <View className='items-center py-8'>
                    <TouchableOpacity
                        className='relative'
                        onPress={async () => {
                            const selected = await pickImage((msg) => setStatusBanner(true, msg, "error"));
                            if (selected) {
                                const compressed = await ImageManipulator.manipulateAsync(
                                    selected, [{ resize: { width: 800 } }],
                                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                                );
                                setCollection({ ...collection, thumbNail: compressed.uri });
                            }
                        }}
                    >
                        <View className='w-52 h-52 rounded-2xl overflow-hidden border-4 border-white shadow-md' style={{ backgroundColor: colors.light[300] }}>
                            {collection.thumbNail ? (
                                <Image source={{ uri: collection.thumbNail }} className='w-full h-full' />
                            ) : (
                                <View className='flex-1 items-center justify-center'>
                                    <Image source={icons.plus} className='w-10 h-10 opacity-20' />
                                </View>
                            )}
                        </View>
                        <View className='absolute -bottom-2 -right-2 p-3 rounded-full border-4 border-white shadow-sm' style={{ backgroundColor: colors.dark[100] }}>
                            <Image source={icons.editText} className='w-4 h-4' style={{ tintColor: colors.light[100] }} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View className='px-5 gap-y-6'>
                    {/* Name Input Card */}
                    <View className='bg-white p-5 rounded-3xl shadow-sm border border-gray-50'>
                        <Text className='font-bold text-sm mb-3' style={{ color: colors.dark[100] }}>Collection Name</Text>
                        <TextInput
                            placeholder='Enter collection name...'
                            value={collection?.name.fr ?? ""}
                            className='w-full h-14 px-5 rounded-2xl font-medium'
                            style={{ backgroundColor: colors.light[200], color: colors.dark[100] }}
                            onChangeText={(e) => setCollection({
                                ...collection,
                                name: { ...collection.name, fr: e }
                            })}
                        />
                    </View>

                    {/* Visibility Settings Card */}
                    <View className='bg-white p-5 rounded-3xl shadow-sm border border-gray-50'>
                        <Text className='font-bold text-sm mb-4' style={{ color: colors.dark[100] }}>Visibility Status</Text>
                        <View className='flex-row p-1.5 rounded-2xl' style={{ backgroundColor: colors.light[200] }}>
                            {['public', 'private'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setCollection({ ...collection, type: type as any })}
                                    className='flex-1 py-3.5 rounded-xl items-center'
                                    style={{ backgroundColor: collection.type === type ? colors.dark[100] : 'transparent' }}
                                >
                                    <Text className='font-bold capitalize' style={{ color: collection.type === type ? colors.light[100] : colors.dark[100] }}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Display Style Card */}
                    <View className='bg-white p-5 rounded-3xl shadow-sm border border-gray-50'>
                        <Text className='font-bold text-sm mb-4' style={{ color: colors.dark[100] }}>Home Display Style</Text>
                        <View className='flex-row p-1.5 rounded-2xl' style={{ backgroundColor: colors.light[200] }}>
                            {[
                                { label: 'Grid (Normal)', value: 'vertical' },
                                { label: 'Slider', value: 'horizontal' }
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => setCollection({ ...collection, display: option.value as any })}
                                    className='flex-1 py-3.5 rounded-xl items-center'
                                    style={{ backgroundColor: collection.display === option.value ? colors.dark[100] : 'transparent' }}
                                >
                                    <Text className='font-bold' style={{ color: collection.display === option.value ? colors.light[100] : colors.dark[100] }}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Products Management Card */}
                    <View className='bg-white p-6 rounded-3xl shadow-sm border border-gray-50 mb-10'>
                        <View className='flex-row items-center justify-between'>
                            <View>
                                <Text className='font-bold text-lg' style={{ color: colors.dark[100] }}>Products</Text>
                                <Text className='text-xs opacity-50' style={{ color: colors.dark[100] }}>{productsSelected.length} products selected</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(true)}
                                className='px-6 py-3 rounded-2xl'
                                style={{ backgroundColor: colors.dark[100] }}
                            >
                                <Text style={{ color: colors.light[100] }} className='font-bold'>Manage List</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Full Screen Products Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[100] }}>
                    <View className='px-5 py-4 flex-row items-center justify-between border-b border-gray-100'>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(false)}
                            className='w-10 h-10 items-center justify-center rounded-full'
                            style={{ backgroundColor: colors.light[200] }}
                        >
                            <Text className='font-bold'>X</Text>
                        </TouchableOpacity>
                        <Text className='font-bold text-lg' style={{ color: colors.dark[100] }}>Select Products</Text>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(false)}
                            className='h-10 w-10 flex justify-center items-center rounded-full mr-2'
                        // style={{ backgroundColor: colors.dark[100] }}
                        >
                            <Image
                                source={require('@/app/assets/icons/tick.png')}
                                className='w-5 h-5'
                                style={{ tintColor: colors.dark[100] }}
                            />
                        </TouchableOpacity>
                    </View>

                    <View className='flex-1'>
                        <ProductListForCollectionPicker
                            products={products}
                            setProducts={setProducts}
                            productsSelected={productsSelected}
                            setProductsSelected={setProductsSelected}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

export default MakeNewCollection;