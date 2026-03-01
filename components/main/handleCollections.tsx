import { CollectionType, ProductToEditType, ProductType } from '@/types'
import React, { useEffect, useState } from 'react'
import { View,Text, ScrollView, TouchableOpacity } from 'react-native'
import { CustomView } from '../sub/customView'
import axios from 'axios'
import { backEndUrl } from '@/api'

type Props = {
    updatedProduct: ProductToEditType
    setUpdatedProduct: (value: ProductToEditType) => void
    // collections: CollectionType[]
    // product: ProductType
}

const HandleCollections = ({
    updatedProduct,
    setUpdatedProduct

    // collections,
    // product
}: Props) => {

    // const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
    const [collections, setCollections] = useState<CollectionType[] | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);



    useEffect(() => {
        // setSelectedCollections(updatedProduct.collections)
        // setUpdatedProduct({
        //     ...updatedProduct,
        //     collections: updatedProduct.collections
        // })
    }, [])

    useEffect(() => {
        const fetchData = async () => {

            await axios.get( backEndUrl + "/getAllCollections")
            .then(({ data }) => {
                setCollections(data.allCollections);
                console.log(data.allCollections.lenght)
            })
            .catch(err => console.log('err : ' + err))
        }

        setLoading(true);
        fetchData();
        setLoading(false);
    }, [])

    return (
        <View className='w-full'>

            {/* <Text className='text-md font-semibold m-5'>Collections : </Text> */}
            <View className="mb-4">
                <Text className='text-xl font-black text-black uppercase tracking-tighter'>
                    Collections
                </Text>
                <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>
                    Categorization & Visibility
                </Text>
            </View>

            <ScrollView 
                className='w-full max-h-[250px]'
            >
                <View className='w-full flex flex-row flex-wrap '>
                    {collections?.map((collection, index) => (
                        <TouchableOpacity
                            onPress={() => collection._id ?
                                updatedProduct.collections.includes(collection._id) ?
                                    setUpdatedProduct({
                                        ...updatedProduct,
                                        collections: updatedProduct.collections.filter((col) => col != collection._id)
                                    })
                                :
                                    setUpdatedProduct({
                                        ...updatedProduct,
                                        collections: [...updatedProduct.collections, collection._id]
                                    })
                                : null
                                }
                            className={`
                                w-fit h-fit m-2  p-3 rounded-full 
                                ${collection._id && updatedProduct.collections.includes(collection._id) ? "bg-black" : "bg-gray-100"}
                            `}
                            key={index}
                        >
                            <Text
                                className={`
                                    w-fit text-sm text-gray-900- h-fit bg-blue-500-
                                    ${collection._id && updatedProduct.collections.includes(collection._id) ? "text-gray-100" : "text-gray-900"}
                                `}
                            >{collection.name.en}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>

        </View>
  )
}

export default HandleCollections
