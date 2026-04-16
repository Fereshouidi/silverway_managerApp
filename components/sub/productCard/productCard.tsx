import { colors } from '@/constants'
import { ProductType } from '@/types'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View, Platform } from 'react-native'
import { handleLongText } from '@/lib'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import SkeletonLoading from '../SkeletonLoading'

type productCardType = {
    product: ProductType
    className?: string
    productsSelected: string[]
    setProductsSelected: (value: string[]) => void
}

const ProductCard = ({
    product,
    className,
    productsSelected,
    setProductsSelected
}: productCardType) => {

    const router = useRouter();
    const productId = product._id || '';
    const isSelected = productsSelected.includes(productId);
    const isHidden = product.status === "archived";

    if (!product._id) return null;

    const toggleSelect = () => {
        if (isSelected) {
            setProductsSelected(productsSelected.filter(id => id !== productId));
        } else {
            setProductsSelected([...productsSelected, productId]);
        }
    };

    const handlePress = () => {
        // إذا كان هناك منتجات مختارة بالفعل، استمر في وضع "التحديد"
        if (productsSelected.length > 0) {
            toggleSelect();
        } else {
            // إذا لم يكن هناك تحديد، اذهب للتفاصيل
            router.push({ pathname: '/screens/productDetails/[id]', params: { id: productId } });
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            onLongPress={toggleSelect} // الضغط المطول يبدأ عملية التحديد
            className={`flex flex-col items-center p-2 mb-2 ${className}`}
            style={{
                borderRadius: 10,
                backgroundColor: isSelected ? colors.dark[100] : colors.light[100],
                opacity: isHidden && !isSelected ? 0.5 : 1, // تحسين رؤية المخفي
                ...Platform.select({
                    ios: {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    },
                    android: { elevation: 3 },
                }),
            }}
        >
            {/* الصورة والحالة */}
            <View className='w-full h-[170px] rounded-xl overflow-hidden relative bg-gray-100'>
                {product.thumbNail ? (
                    <Image
                        source={{ uri: product.thumbNail }}
                        className='w-full h-full'
                        resizeMode="cover"
                    />
                ) : (
                    <SkeletonLoading />
                )}

                {/* مؤشر الاختيار (Checkmark) */}
                {isSelected && (
                    <View className="absolute inset-0 bg-black/20 items-center justify-center">
                        <MaterialCommunityIcons name="check-circle" size={40} color={colors.light[100]} />
                    </View>
                )}

                {/* علامة المنتج المخفي */}
                {isHidden && (
                    <View
                        className="absolute top-2 right-2 px-2 py-1 rounded-xl"
                        style={{ backgroundColor: colors.light[100] }}
                    >
                        <Text style={{ color: colors.dark[100], fontSize: 10, fontWeight: 'bold' }}>HIDDEN</Text>
                    </View>
                )}
            </View>

            {/* تفاصيل المنتج */}
            <View className="w-full mt-3 px-1">
                <Text
                    className='text-sm font-medium text-center'
                    numberOfLines={1}
                    style={{ color: isSelected ? colors.light[100] : colors.dark[100] }}
                >
                    {product.name.en ? handleLongText(product.name.en, 25) : "No Name"}
                </Text>

                <Text
                    className='text-lg font-bold text-center mt-1'
                    style={{ color: isSelected ? colors.light[100] : colors.dark[100] }}
                >
                    {product.price != null ? `${product.price} D.T` : "---"}
                </Text>
            </View>
        </TouchableOpacity>
    )
}

export default ProductCard;