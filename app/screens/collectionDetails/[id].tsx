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
import axios from 'axios'
import * as ImageManipulator from 'expo-image-manipulator'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = {
    visibility: boolean
    setVisibility: (value: boolean) => void
    product: ProductType
    containerClassName?: string
    containerStyle?: string
    className?: string
    style?: string
}

const CollectionSection = ({ className }: Props) => {
    const { id } = useLocalSearchParams();
    const { setLoadingScreen } = useLoadingScreen();

    const [loading, setLoading] = useState<boolean>(true);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [updatedCollection, setUpdatedCollection] = useState<CollectionType>(newCollection);
    const [productsSelected, setProductsSelected] = useState<string[]>([]);
    const [products, setProducts] = useState<ProductType[]>([]);
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(backEndUrl + "/getCollectionById", {
                    params: { collectionId: id }
                });
                setUpdatedCollection(data.collection);
                setProductsSelected(data.products)
                if (data.collection.products) setProductsSelected(data.collection.products);

                const productsRes = await axios.get(backEndUrl + "/getProducts");
                setProducts(productsRes.data.products);
            } catch (err) {
                console.log('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleConfirm = async () => {
        if (!admin?.accesses?.includes("Manage Collections")) {
            setStatusBanner(true, "You don't have permission to edit collections", "error");
            return;
        }
        // 1. Validation for Required Name
        if (!updatedCollection?.name.fr) {
            setStatusBanner(true, "The name of the collection is required !", "warning");
            return;
        }

        setLoadingScreen(true, "Saving changes...");

        try {
            const formData = new FormData();

            // 2. Image Handling Logic
            const isNewImage = updatedCollection.thumbNail &&
                (updatedCollection.thumbNail.startsWith('file://') ||
                    updatedCollection.thumbNail.startsWith('content://'));

            if (isNewImage) {
                formData.append("thumbnail", {
                    uri: updatedCollection.thumbNail,
                    type: "image/jpeg",
                    name: "thumbnail.jpg",
                } as any);
            }

            // 3. Appending Basic Collection Info
            formData.append("_id", updatedCollection._id || "");
            formData.append("nameFr", updatedCollection.name.fr || "");
            formData.append("type", updatedCollection.type);
            formData.append("display", String(updatedCollection.display));

            // 4. Sending Selected Products IDs
            // We send the array as a JSON string so the backend can parse it back to an array
            formData.append("products", JSON.stringify(productsSelected));

            // 5. API Call
            const response = await axios.put(backEndUrl + "/updateCollection", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    // Add any Auth headers here if needed
                },
            });

            if (response.status === 200) {
                setStatusBanner(true, "Collection updated successfully! ✅", "success");
                router.back();
            }

        } catch (err: any) {
            console.error('Update Error:', err?.response?.data || err.message);
            alert("Something went wrong! ❌");
        } finally {
            setLoadingScreen(false);
        }
    };

    if (loading) return <SkeletonLoading />;

    return (
        <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[100] }}>
            <Stack.Screen options={{ headerShown: false }} />

            <Header
                title='Edit Collection'
                onBackButtonPress={() => router.back()}
                items={
                    <TouchableOpacity
                        onPress={handleConfirm}
                        className='h-10 w-10 flex justify-center items-center rounded-full mr-4 shadow-sm-'
                    // style={{ backgroundColor: colors.dark[100] }}
                    >
                        <Image
                            source={require('@/app/assets/icons/tick.png')}
                            className='w-5 h-5'
                            style={{ tintColor: colors.dark[100] }}
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
                            const selected = await pickImage();
                            if (selected) {
                                const compressed = await ImageManipulator.manipulateAsync(
                                    selected, [{ resize: { width: 800 } }],
                                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                                );
                                setUpdatedCollection({ ...updatedCollection, thumbNail: compressed.uri });
                            }
                        }}
                    >
                        <View className='w-52 h-52 rounded-2xl overflow-hidden border-4 border-white shadow-md' style={{ backgroundColor: colors.light[300] }}>
                            {updatedCollection.thumbNail ? (
                                <Image source={{ uri: updatedCollection.thumbNail }} className='w-full h-full' />
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
                            defaultValue={updatedCollection?.name.fr ?? ""}
                            className='w-full h-14 px-5 rounded-2xl font-medium'
                            style={{ backgroundColor: colors.light[200], color: colors.dark[100] }}
                            onChangeText={(e) => setUpdatedCollection({
                                ...updatedCollection,
                                name: { ...updatedCollection.name, fr: e }
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
                                    onPress={() => setUpdatedCollection({ ...updatedCollection, type: type as any })}
                                    className='flex-1 py-3.5 rounded-xl items-center'
                                    style={{ backgroundColor: updatedCollection.type === type ? colors.dark[100] : 'transparent' }}
                                >
                                    <Text className='font-bold capitalize' style={{ color: updatedCollection.type === type ? colors.light[100] : colors.dark[100] }}>
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
                                    onPress={() => setUpdatedCollection({ ...updatedCollection, display: option.value as any })}
                                    className='flex-1 py-3.5 rounded-xl items-center'
                                    style={{ backgroundColor: updatedCollection.display === option.value ? colors.dark[100] : 'transparent' }}
                                >
                                    <Text className='font-bold' style={{ color: updatedCollection.display === option.value ? colors.light[100] : colors.dark[100] }}>
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
                                <Text className='text-xs opacity-50' style={{ color: colors.dark[100] }}>{productsSelected.length} products linked</Text>
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
                    {/* Custom Modal Header */}
                    <View className='px-5 py-4 flex-row items-center justify-between border-b border-gray-100'>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(false)}
                            className='w-10 h-10 items-center justify-center rounded-full'
                            style={{ backgroundColor: colors.light[200] }}
                        >
                            <Text className='font-bold text-red-500-'>X</Text>
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

                    {/* Full Height Products List */}
                    <View className='flex-1'>
                        <ProductListForCollectionPicker
                            products={products}
                            setProducts={setProducts}
                            productsSelected={productsSelected}
                            setProductsSelected={setProductsSelected}
                            collectionId={id}
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

export default CollectionSection;