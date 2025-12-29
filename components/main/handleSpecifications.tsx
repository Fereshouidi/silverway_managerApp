import { ProductSpecification, ProductToEditType } from '@/types'
import React from 'react'
import { ScrollView, View, Text, TextInput, Image, TouchableOpacity } from 'react-native'
import { CustomView } from '../sub/customView'
import { fakeSpecification } from '@/constants/data'
import { icons } from '@/constants'

type Props = {
    updatedProduct: ProductToEditType,
    setUpdatedProduct: (value: ProductToEditType) => void
}

const HandleSpecifications = ({
    updatedProduct,
    setUpdatedProduct
}: Props) => {
    
  return (
    <View className='w-full h-fit'>

        <Text className='text-md font-semibold m-5'>Specifications : </Text>

        <ScrollView 
            className='w-full h-[300px] gap-1'
            horizontal
        >
            
            {
                updatedProduct.specifications.map((specification, index) => (
                    <CustomView 
                        key={index}
                        className='min-w-[300px] flex flex-col justify-center items-center- gap-1 mx-1 rounded-lg p-4 h-full bg-red-500- border-[0.2px] border-gray-500'
                    >
                        <TouchableOpacity 
                            className='w-12 h-12 absolute top-0 right-0 p-4 bg-red-500- rounded-full'
                            onPress={() => setUpdatedProduct({
                                ...updatedProduct,
                                specifications: updatedProduct.specifications.filter( spe => spe._id != specification._id)
                            })}
                        >
                            <Image
                                source={icons.closeBlack}
                                className='w-full h-full'
                            />
                        </TouchableOpacity>

                        
                        <Text className='text-center font-semibold m-3'>{index + 1}</Text>
                        
                        <View className='w-full- flex flex-row items-center '>
                            <Text className='w-[70px]'>Color : </Text>
                            <TextInput
                                defaultValue={specification.color?? 'null'}
                                onChange={(e) => setUpdatedProduct({
                                    ...updatedProduct,
                                    specifications: updatedProduct.specifications.map( (spe, speIndex) => speIndex === index ? {
                                        ...spe,
                                        color: e.nativeEvent.text
                                    } : spe)
                                })}
                                className='border-[0.2px] border-gray-500 px-2 flex-1 rounded-lg'
                            />
                        </View>
                        <View className='w-full- flex flex-row items-center '>
                            <Text className='w-[70px]'>size : </Text>
                            <TextInput
                                defaultValue={specification.size?? 'null'}
                                className='border-[0.2px] border-gray-500 px-2 flex-1 rounded-lg'
                                onChange={(e) => setUpdatedProduct({
                                    ...updatedProduct,
                                    specifications: updatedProduct.specifications.map( (spe, speIndex) => speIndex === index ? {
                                        ...spe,
                                        size: e.nativeEvent.text
                                    } : spe)
                                })}
                            />
                        </View>
                        <View className='w-full- flex flex-row items-center '>
                            <Text className='w-[70px]'>type : </Text>
                            <TextInput
                                defaultValue={specification.type?? 'null'}
                                className='border-[0.2px] border-gray-500 px-2 flex-1 rounded-lg'
                                onChange={(e) => setUpdatedProduct({
                                    ...updatedProduct,
                                    specifications: updatedProduct.specifications.map( (spe, speIndex) => speIndex === index ? {
                                        ...spe,
                                        type: e.nativeEvent.text
                                    } : spe)
                                })}
                            />
                        </View>
                        <View className="w-full flex flex-row items-center">
                            <Text className="w-[70px]">Price :</Text>
                            <TextInput
                                value={specification.price?.toString() ?? ''}
                                placeholder="0.00"
                                keyboardType="numeric"
                                className="border-[0.2px] border-gray-500 px-2 flex-1 rounded-lg"
                                onChangeText={(value) => {
                                    // 1. Validate the string format (allows "", "10", "10.", "10.25")
                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                        setUpdatedProduct({
                                            ...updatedProduct,
                                            specifications: updatedProduct.specifications.map((spe, speIndex) =>
                                                speIndex === index 
                                                    ? { ...spe, price: value } // Keep as string to allow the decimal point
                                                    : spe
                                            ),
                                        });
                                    }
                                }}
                            />
                        </View>                      
                        <View className='w-full- flex flex-row items-center '>
                            <Text className='w-[70px]'>quantity : </Text>
                            <TextInput
                                className="border-[0.2px] border-gray-500 px-2 flex-1 rounded-lg"
                                keyboardType='numeric'
                                value={specification.quantity?.toString() ?? ''}
                                onChangeText={(value) => {
                                    const num = value === '' ? 0 : parseInt(value, 10) || 0;
                                    setUpdatedProduct({
                                        ...updatedProduct,
                                        specifications: updatedProduct.specifications.map( (spe, speIndex) => speIndex === index ? {
                                            ...spe,
                                            quantity: num
                                        } : spe)
                                    })
                                }}
                            />
                        </View>
                    </CustomView>
                ))
            }

            <TouchableOpacity 
                className='w-[95vw] h-full flex flex-col justify-center items-center gap-1 mx-1 rounded-lg p-4 bg-red-500- border-[0.2px] border-gray-500'
                onPress={() => setUpdatedProduct({
                    ...updatedProduct,
                    specifications: [
                        ...updatedProduct.specifications,
                        {
                            ...fakeSpecification,
                            _id: (
                                Number(
                                    updatedProduct.specifications[updatedProduct.specifications.length - 1]?._id ?? "0"
                                ) + 1
                            ).toString()
                        }
                    ]
                })}
            >
                <Image
                    source={icons.plus}
                    className='w-20 h-20 opacity-20'
                />
            </TouchableOpacity>

        </ScrollView>
    </View>
  )
}

export default HandleSpecifications
