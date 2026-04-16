import { colors } from '@/constants';
import { useProductSection } from '@/contexts/productTab';
import { handleLongText } from '@/lib';
import { ProductType } from '@/types';
import { useRouter } from 'expo-router';
import React, { CSSProperties } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import SkeletonLoading from '../SkeletonLoading';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type productCardType = {
    product: ProductType
    className?: string
    style?: CSSProperties
    productsSelected: string[]
    setProductsSelected: (value: string[]) => void
    AllCount: number
    setAllCount: (value: number) => void
    selectedCount: number
    setSelectedCount: (value: number) => void
}

const ProductCardForCollectionPicker = ({
    product,
    className,
    productsSelected,
    setProductsSelected,
    AllCount,
    setAllCount,
    selectedCount,
    setSelectedCount
}: productCardType) => {
    const router = useRouter();
    const isSelected = productsSelected.includes(product._id || '');
    const isArchived = product.status === "archived";

    if (!product._id) return null;

    const handleToggleSelection = () => {
        if (isSelected) {
            setProductsSelected(productsSelected.filter(id => id !== product._id));
            setAllCount(AllCount + 1);
            setSelectedCount(selectedCount - 1);
        } else {
            setProductsSelected([...productsSelected, product._id as string]);
            setAllCount(AllCount - 1);
            setSelectedCount(selectedCount + 1);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onLongPress={() => router.push({ pathname: '/screens/productDetails/[id]', params: { id: product._id ?? "" } })}
            onPress={handleToggleSelection}
            className={`rounded-xl border-2 overflow-hidden ${className}`}
            style={{
                backgroundColor: colors.light[100],
                borderColor: isSelected ? colors.dark[100] : 'transparent',
                opacity: isArchived ? 0.6 : 1,
                ...Platform.select({
                    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, shadowOpacity: 0.05 },
                    android: { elevation: 3 },
                }),
            }}
        >
            {/* Image Section */}
            <View className="relative w-full h-[160px] bg-white">
                {product.thumbNail ? (
                    <Image source={{ uri: product.thumbNail }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <SkeletonLoading />
                )}

                {/* Selection Indicator (Checkmark) */}
                <View className="absolute top-2 right-2">
                    <MaterialCommunityIcons
                        name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                        size={24}
                        color={isSelected ? colors.dark[100] : "rgba(0,0,0,0.1)"}
                    />
                </View>

                {/* Archived Badge */}
                {isArchived && (
                    <View className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60">
                        <Text className="text-[8px] font-bold text-white uppercase tracking-tighter">Archived</Text>
                    </View>
                )}
            </View>

            {/* Info Section */}
            <View className="p-3 items-center">
                <Text
                    className="text-[12px] font-semibold text-center mb-1"
                    style={{ color: colors.dark[200] }}
                    numberOfLines={1}
                >
                    {product.name?.en ? handleLongText(product.name.en, 25) : "No Name"}
                </Text>

                <View className="flex-row items-baseline gap-x-1">
                    <Text className="text-sm font-black" style={{ color: colors.dark[100] }}>
                        {product.price ?? "0"}
                    </Text>
                    <Text className="text-[10px] font-bold opacity-40" style={{ color: colors.dark[100] }}>
                        TND
                    </Text>
                </View>
            </View>

            {/* Selected Overlay Label */}
            {isSelected && (
                <View
                    className="absolute inset-x-0 bottom-0 h-1 items-center justify-center"
                    style={{ backgroundColor: colors.dark[100] }}
                />
            )}
        </TouchableOpacity>
    );
}

export default ProductCardForCollectionPicker;