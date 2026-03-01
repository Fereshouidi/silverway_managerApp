import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    Image, 
    TouchableOpacity, 
    RefreshControl, 
    ActivityIndicator,
    Vibration,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { ProductType } from '@/types';
import { ShoppingBag, CheckCircle2, Layers, ChevronRight } from 'lucide-react-native';

type Props = {
    products: ProductType[], 
    setProducts: (value: ProductType[]) => void
    className?: string
    productsSelected: string[]
    setProductsSelected: (value: string[]) => void
}

const { width } = Dimensions.get('window');

const Products = ({
    products, 
    setProducts,
    className,
    productsSelected,
    setProductsSelected
}: Props) => {
    const router = useRouter();
    const [skip, setSkip] = useState<number>(0);
    const [limit] = useState<number>(10);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [productsCount, setProductsCount] = useState<number>(0);
    const [refreshing, setRefreshing] = useState(false);

    // 1. دالة جلب البيانات من السيرفر
    const fetchData = useCallback(async (newSkip: number, append: boolean = false) => {
        try {
            const { data } = await axios.get(`${backEndUrl}/getAllProducts`, { 
                params: {
                    skip: newSkip,
                    limit,
                    status: JSON.stringify(["active", "archived"])
                }
            });
            
            if (append) {
                setProducts([...products, ...data.products]);
            } else {
                setProducts(data.products);
            }
            setProductsCount(data.productsCount);
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    }, [products, limit]);

    // التحميل الأول عند فتح الصفحة
    useEffect(() => {
        setIsLoading(true);
        fetchData(0).finally(() => setIsLoading(false));
    }, []);

    // 2. منطق التحديث (Pull to Refresh)
    const onRefresh = async () => {
        setRefreshing(true);
        setSkip(0);
        await fetchData(0, false);
        setRefreshing(false);
    };

    // 3. منطق تحميل المزيد عند الوصول للنهاية
    const handleLoadMore = async () => {
        if (!loadingMore && products.length < productsCount) {
            setLoadingMore(true);
            const nextSkip = skip + limit;
            await fetchData(nextSkip, true);
            setSkip(nextSkip);
            setLoadingMore(false);
        }
    };

    // 4. منطق التحديد والضغط المطول
    const onLongPressProduct = (id: string) => {
        Vibration.vibrate(50); 
        if (productsSelected.includes(id)) {
            setProductsSelected(productsSelected.filter(item => item !== id));
        } else {
            setProductsSelected([...productsSelected, id]);
        }
    };

    const onPressProduct = (id: string) => {
        if (productsSelected.length > 0) {
            onLongPressProduct(id);
        } else {
            router.push({ 
                pathname: '/screens/productDetails/[id]', 
                params: { id: id } 
            });
        }
    };

    // 5. مكونات واجهة المستخدم الصغيرة
    const renderProduct = ({ item }: { item: any }) => {
        const isSelected = productsSelected.includes(item._id);
        const productName = item.name?.en || item.name?.fr || "Unnamed Product";
        const totalQuantity = item.specifications?.reduce((acc: number, spec: any) => acc + (spec.quantity || 0), 0) || 0;

        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => onPressProduct(item._id)}
                onLongPress={() => onLongPressProduct(item._id)}
                delayLongPress={500}
                className="mx-5 mb-4 rounded-[28px] flex-row items-center p-3"
                style={{ 
                    backgroundColor: isSelected ? colors.dark[100] : colors.light[200],
                    borderWidth: 1,
                    borderColor: isSelected ? colors.dark[100] : '#f2f2f2',
                }}
            >
                <View className="w-24 h-24 rounded-[20px] overflow-hidden bg-white">
                    {item.thumbNail ? (
                        <Image source={{ uri: item.thumbNail }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="flex-1 items-center justify-center bg-gray-50">
                            <ShoppingBag size={20} color="#ccc" />
                        </View>
                    )}
                    {isSelected && (
                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                            <CheckCircle2 size={28} color="white" />
                        </View>
                    )}
                </View>

                <View className="flex-1 ml-4 py-1">
                    <View className="flex-row items-center mb-1">
                        <Layers size={10} color={isSelected ? colors.light[100] : colors.dark[100]} opacity={0.5} />
                        <Text 
                            className="text-[9px] font-bold uppercase ml-1 tracking-widest"
                            style={{ color: isSelected ? colors.light[100] : colors.dark[100], opacity: 0.5 }}
                        >
                            {item.status}
                        </Text>
                    </View>

                    <Text 
                        className="text-[16px] font-black mb-1"
                        style={{ color: isSelected ? colors.light[100] : colors.dark[100] }}
                        numberOfLines={1}
                    >
                        {productName}
                    </Text>

                    <View className="flex-row items-center">
                        <Text 
                            className="text-[14px] font-bold"
                            style={{ color: isSelected ? colors.light[400] : colors.dark[100] }}
                        >
                            {item.price?.toLocaleString()} DT
                        </Text>
                        <View className="mx-2 w-1 h-1 rounded-full bg-gray-400 opacity-30" />
                        <Text 
                            className="text-[11px] font-medium"
                            style={{ color: isSelected ? colors.light[400] : colors.dark[100], opacity: 0.6 }}
                        >
                            {totalQuantity} Units
                        </Text>
                    </View>
                </View>

                <ChevronRight 
                    size={20} 
                    color={isSelected ? colors.light[100] : colors.dark[100]} 
                    style={{ opacity: 0.3 }} 
                />
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return <View className="h-20" />;
        return (
            <View className="py-10 items-center justify-center flex-row">
                <ActivityIndicator color={colors.dark[100]} size="small" />
                <Text className="ml-3 text-[10px] font-bold opacity-40 uppercase tracking-[2px]">
                    Loading More...
                </Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white" style={{ minHeight: '100%' }}>
                <ActivityIndicator size="large" color={colors.dark[100]} />
            </View>
        );
    }

    return (
        <View className={`flex-1 ${className}`} style={{ backgroundColor: colors.light[100] }}>
            <FlatList
                data={products}
                keyExtractor={(_, index) => index}
                renderItem={renderProduct}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.dark[100]} />
                }
                ListHeaderComponent={() => (
                    <View className="px-6 mb-6 flex-row justify-between items-end">
                        <View>
                            <Text className="text-[10px] font-bold opacity-30 uppercase tracking-[3px]">Stock Overview</Text>
                            <Text className="text-3xl font-black text-black">Inventory</Text>
                        </View>
                        {productsSelected.length > 0 && (
                            <View className="bg-red-50 px-4 py-1.5 rounded-full border border-red-100 shadow-sm">
                                <Text className="text-red-600 text-[11px] font-black uppercase">
                                    {productsSelected.length} Selected
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View className="flex-1 items-center justify-center mt-20">
                        <ShoppingBag size={40} color={colors.dark[100]} opacity={0.1} />
                        <Text className="opacity-30 mt-4 font-bold uppercase text-xs">No Items Available</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default Products;