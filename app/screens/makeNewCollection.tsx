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
import { Eye, EyeOff, LayoutGrid, LayoutList, Package, Trash2, Plus } from 'lucide-react-native'

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
                        activeOpacity={0.8}
                        className='h-11 px-5 flex-row justify-center items-center rounded-2xl shadow-sm'
                        style={{ backgroundColor: colors.dark[100] }}
                    >
                        <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color={colors.light[100]}
                        />
                        <Text className='font-bold ml-2' style={{ color: colors.light[100] }}>Publish</Text>
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

                <View className='px-5 gap-y-5'>
                    {/* Name Input Card */}
                    <View className='bg-white p-6 rounded-[32px] shadow-sm border border-gray-100/50'>
                        <View className='flex-row items-center mb-4'>
                            <View className='w-8 h-8 rounded-full items-center justify-center mr-3' style={{ backgroundColor: colors.light[200] }}>
                                <MaterialCommunityIcons name="format-text" size={16} color={colors.dark[100]} />
                            </View>
                            <Text className='font-bold text-base' style={{ color: colors.dark[100] }}>Collection Name</Text>
                        </View>
                        <TextInput
                            placeholder='e.g. Summer Essentials 2024'
                            placeholderTextColor={colors.dark[100] + '40'}
                            value={collection?.name.fr ?? ""}
                            className='w-full h-14 px-5 rounded-2xl font-semibold border-2 border-transparent focus:border-black/5'
                            style={{ backgroundColor: colors.light[150], color: colors.dark[100] }}
                            onChangeText={(e) => setCollection({
                                ...collection,
                                name: { ...collection.name, fr: e }
                            })}
                        />
                    </View>

                    {/* Visibility Settings Card */}
                    <View className='bg-white p-6 rounded-[32px] shadow-sm border border-gray-100/50'>
                        <View className='flex-row items-center mb-5'>
                            <View className='w-8 h-8 rounded-full items-center justify-center mr-3' style={{ backgroundColor: colors.light[200] }}>
                                <Eye size={16} color={colors.dark[100]} />
                            </View>
                            <Text className='font-bold text-base' style={{ color: colors.dark[100] }}>Visibility Status</Text>
                        </View>
                        <View className='flex-row gap-x-3'>
                            {[
                                { id: 'public', label: 'Public', icon: Eye, desc: 'Visible to everyone' },
                                { id: 'private', label: 'Private', icon: EyeOff, desc: 'Only for admins' }
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    activeOpacity={0.9}
                                    onPress={() => setCollection({ ...collection, type: opt.id as any })}
                                    className='flex-1 p-4 rounded-2xl border-2'
                                    style={{
                                        backgroundColor: collection.type === opt.id ? colors.dark[100] : colors.light[150],
                                        borderColor: collection.type === opt.id ? colors.dark[100] : 'transparent'
                                    }}
                                >
                                    <opt.icon size={20} color={collection.type === opt.id ? colors.light[100] : colors.dark[100]} />
                                    <Text className='font-bold text-sm mt-2' style={{ color: collection.type === opt.id ? colors.light[100] : colors.dark[100] }}>{opt.label}</Text>
                                    <Text className='text-[10px] opacity-50 mt-0.5' style={{ color: collection.type === opt.id ? colors.light[100] : colors.dark[100] }}>{opt.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Display Style Card */}
                    <View className='bg-white p-6 rounded-[32px] shadow-sm border border-gray-100/50'>
                        <View className='flex-row items-center mb-5'>
                            <View className='w-8 h-8 rounded-full items-center justify-center mr-3' style={{ backgroundColor: colors.light[200] }}>
                                <LayoutGrid size={16} color={colors.dark[100]} />
                            </View>
                            <Text className='font-bold text-base' style={{ color: colors.dark[100] }}>Home Display Style</Text>
                        </View>
                        <View className='flex-row gap-x-3'>
                            {[
                                { id: 'vertical', label: 'Grid', icon: LayoutGrid, desc: 'Normal 2x2 layout' },
                                { id: 'horizontal', label: 'Slider', icon: LayoutList, desc: 'Horizontal scroll' }
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    activeOpacity={0.9}
                                    onPress={() => setCollection({ ...collection, display: opt.id as any })}
                                    className='flex-1 p-4 rounded-2xl border-2'
                                    style={{
                                        backgroundColor: collection.display === opt.id ? colors.dark[100] : colors.light[150],
                                        borderColor: collection.display === opt.id ? colors.dark[100] : 'transparent'
                                    }}
                                >
                                    <opt.icon size={20} color={collection.display === opt.id ? colors.light[100] : colors.dark[100]} />
                                    <Text className='font-bold text-sm mt-2' style={{ color: collection.display === opt.id ? colors.light[100] : colors.dark[100] }}>{opt.label}</Text>
                                    <Text className='text-[10px] opacity-50 mt-0.5' style={{ color: collection.display === opt.id ? colors.light[100] : colors.dark[100] }}>{opt.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Products Management Card */}
                    <View className='bg-white p-6 rounded-[32px] shadow-sm border border-gray-100/50 mb-10'>
                        <View className='flex-row items-center justify-between mb-5'>
                            <View className='flex-row items-center'>
                                <View className='w-8 h-8 rounded-full items-center justify-center mr-3' style={{ backgroundColor: colors.light[200] }}>
                                    <Package size={16} color={colors.dark[100]} />
                                </View>
                                <Text className='font-bold text-base' style={{ color: colors.dark[100] }}>Products</Text>
                            </View>
                            <Text className='text-xs font-black' style={{ color: colors.dark[100], opacity: 0.3 }}>{productsSelected.length} TOTAL</Text>
                        </View>

                        {productsSelected.length > 0 ? (
                            <View className='flex-row items-center mb-6 py-1'>
                                {products.filter(p => productsSelected.includes(p._id as string)).slice(0, 4).map((p, i) => (
                                    <View
                                        key={p._id}
                                        className='w-12 h-12 rounded-full border-2 border-white bg-gray-100'
                                        style={{ zIndex: 10 - i, marginLeft: i === 0 ? 0 : -20 }}
                                    >
                                        <Image source={{ uri: p.thumbNail || '' }} className='w-full h-full rounded-full' />
                                    </View>
                                ))}
                                {productsSelected.length > 4 && (
                                    <View className='w-12 h-12 rounded-full border-2 border-white bg-gray-200 items-center justify-center' style={{ zIndex: 0, marginLeft: -20 }}>
                                        <Text className='text-[10px] font-black'>+{productsSelected.length - 4}</Text>
                                    </View>
                                )}
                                <Text className='ml-4 text-xs font-bold text-gray-400'>Linked to collection</Text>
                            </View>
                        ) : (
                            <View className='items-center py-4 opacity-30'>
                                <Package size={32} color={colors.dark[100]} />
                                <Text className='text-[10px] font-bold uppercase tracking-[1px] mt-2'>No products selected</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => setIsModalVisible(true)}
                            activeOpacity={0.8}
                            className='w-full py-4 rounded-2xl items-center flex-row justify-center'
                            style={{ backgroundColor: colors.dark[100] }}
                        >
                            <Plus size={18} color={colors.light[100]} />
                            <Text style={{ color: colors.light[100] }} className='font-black ml-2 uppercase text-xs tracking-[1px]'>Manage Product List</Text>
                        </TouchableOpacity>
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
                            collectionId=''
                        />
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

export default MakeNewCollection;