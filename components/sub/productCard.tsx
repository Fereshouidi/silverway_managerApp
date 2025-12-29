
import { colors } from '@/constants'
import { useProductSection } from '@/contexts/productTab'
import { ProductType } from '@/types'
import { useRouter } from 'expo-router'
import React, { CSSProperties } from 'react'
import { Image, Pressable, Text, TouchableOpacity, View, Platform } from 'react-native'
import SkeletonLoading from './SkeletonLoading'
import { handleLongText } from '@/lib'

type productCardType = {
    product: ProductType
    className?: String
    style?: CSSProperties
    productsSelected: ProductType[]
    setProductsSelected: (value: ProductType[]) => void
}

const ProductCard = ({
    product,
    className,
    style,
    productsSelected, 
    setProductsSelected
}: productCardType) => {

    const {setOpenProduct, setProductSectionActive} = useProductSection();
    const router = useRouter();

  return (
    <TouchableOpacity 
        className={`flex flex-col min-h-[280px] items-center gap-3 p-2 bg-red-500- overflow-hidden cursor-pointer ${className}`}
        activeOpacity={0.8}
        onPress={() => {
            if (!product._id) return;
            router.push({ pathname: '/screens/productDetails/[id]', params: { id: product._id } })
        }}
        onLongPress={() => setProductsSelected([...productsSelected, product._id])}
        style={{
            borderRadius: 10,
            backgroundColor: colors.light[100],
            ...Platform.select({
                ios: {
                    shadowColor: "#0d0d0d",
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                },
                android: {
                    elevation: 4,
                },
            }),
        }}
    >
        
        <View 
            className='w-full h-[185px] overflow-hidden  rounded-lg'
            style={{
                backgroundColor: colors.light[300]
            }}
        >
            {
                product.thumbNail ? <Image 
                    src={product.thumbNail}
                    className='w-full h-full hover:scale-110 duration-300 rounded-lg'
                /> :
                product.thumbNail == null ?
                    <SkeletonLoading/> :
                null
                }
        </View>


        <Text 
            className='w-full min-h-5 text-sm text-center px-2'
            style={{
                color: colors.dark[200]
            }}
        >
            {
                product.name.en != null ?
                    handleLongText(product.name.en, 30)
                : <SkeletonLoading/>
            }
            
        </Text>

        <Text 
            className={` ${product.price != null ? '' : 'w-[50%]'} min-h-5 text-lg font-bold text-center`}
            style={{
                color: colors.dark[100]
            }}
        >
            {
                product.price != null ?
                    product.price + " D.T"
                : <SkeletonLoading/>
            }
        </Text>

    </TouchableOpacity>
  )
}

export default ProductCard
