import { colors, icons } from '@/constants'
import { useLoadingScreen } from '@/contexts/loadingScreen'
import { calcTotalPrice, timeAgo } from '@/lib'
import { OrderType } from '@/types'
import React from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'

type props = {
    order: OrderType
}

const OrderCart = ({
    order
}: props) => {

    const { setLoadingScreen } = useLoadingScreen();

  return (
        <TouchableOpacity
            activeOpacity={0.7}
            className='w-full min-h-[150px] flex flex-col justify-between gap-5 rounded-lg p-3'
            style={{
                backgroundColor: colors.light[100],
                boxShadow: `0 5px 15px ${colors.light[200]}`
            }}
        >
            <View className='top flex flex-row justify-between items-center bg-red-500-'>
                <View className='flex flex-row items-center justify-between- gap-5 w-fit h-10'>
                    <View
                        className='bg-red-500- w-20 h-full flex flex-row justify-center items-center rounded-lg'
                    >{order.purchases?.slice(0, 3).map((purchase, index) => (
                        <Image
                            key={purchase._id}
                            //@ts-ignore
                            source={{ uri: purchase.product?.thumbNail?? "" }}
                            className='w-10 h-10 rounded-full'
                            style={{marginLeft: index > 0 ? -20 : 0 }}
                        />
                    ))}</View>
                    <View className='flex flex-row gap-1 w-fit'>
                        <Text className='font-semibold w-fit'>Order Num :</Text>
                        <Text className='opacity-70 select-text w-fit'>{"#" + order.orderNumber}</Text>
                    </View>
                </View>
                <Text 
                    className={`text-sm`}
                >{timeAgo(order.createdAt?? "")}</Text>

            </View>

            <View className='middle flex flex-col gap-2 px-5'>

                <View className=' min-h-8 flex flex-row justify-between gap-2'>
                    <Text className='font-semibold'>Address : </Text>
                    <Text >{order.address}</Text>
                </View>

                {/* <View className="flex flex-row justify-between gap-2">
                    <Text className='font-semibold'>Products count: </Text>
                    <Text >
                        {order.purchases.reduce((total, p) => total + (p.quantity?? 0), 0)}
                    </Text>
                </View> */}

                <View className=' min-h-7 flex flex-row justify-between gap-2'>
                    <Text className='font-semibold'>Total price : </Text>
                    <Text >{calcTotalPrice(order) + " D.T"}</Text>
                </View>

                <View className=' min-h-7 flex flex-row justify-between gap-2'>
                    <Text className='font-semibold'>delivery worker Phone : </Text>
                    <View className='h-full bg-red-500- flex flex-row items-center gap-2'>
                        <TouchableOpacity
                            className='bg-green-900 px-3 py-1 h-full flex flex-row gap-1 justify-center items-center rounded-full'
                        >
                            <Image
                                source={icons.phoneWhite}
                                className='w-3 h-3'
                            />
                            {/* <Text 
                                className=' text-[12px]'
                                style={{
                                    color: colors.light[200]
                                }}
                            >Call</Text> */}
                        </TouchableOpacity>
                        <Text className='bg-red-500- text-center'>{ 
                            //@ts-ignore
                            "+216 " + order.purchases[0]?.client?.phone?? undefined
                        }</Text>
                    </View>
                </View>

                <View className=' min-h-7 flex flex-row justify-between gap-2'>
                    <Text className='font-semibold'>Client Phone : </Text>
                    <View className='h-full bg-red-500- flex flex-row items-center gap-2'>
                        <TouchableOpacity
                            className='bg-green-900 px-3 py-1 h-full flex flex-row gap-1 justify-center items-center rounded-full'
                        >
                            <Image
                                source={icons.phoneWhite}
                                className='w-3 h-3'
                            />
                            {/* <Text 
                                className=' text-[12px]'
                                style={{
                                    color: colors.light[200]
                                }}
                            >Call</Text> */}
                        </TouchableOpacity>
                        <Text className='bg-red-500- text-center'>{ 
                            //@ts-ignore
                            "+216 " + order.purchases[0]?.client?.phone?? undefined
                        }</Text>
                    </View>
                </View>
                
            </View>

            <View 
                className='bottom w-full flex flex-row justify-between gap-2 bg-red-500- p-2 rounded-lg'
            >
                    <TouchableOpacity
                        className='bg-red-500 p-3 flex flex-row gap-1 flex-1 justify-center items-center rounded-full'
                    >
                        <Image
                            source={icons.closeWhite}
                            className='w-3 h-3'
                        />
                        <Text 
                            className=''
                            style={{
                                color: colors.light[200]
                            }}
                        >Failed</Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity
                        className='bg-blue-500 p-2 flex flex-row gap-1 flex-1 justify-center items-center rounded-full'
                    >
                        <Image
                            source={icons.phoneWhite}
                            className='w-4 h-4'
                        />
                        <Text 
                            className=''
                            style={{
                                color: colors.light[200]
                            }}
                        >Call</Text>
                    </TouchableOpacity> */}
                
                    <TouchableOpacity
                        className='bg-green-500 p-3 flex flex-1 flex-row gap-1 justify-center items-center rounded-full'
                    >
                        <Text 
                            className=''
                            style={{
                                color: colors.light[200]
                            }}
                        >Delivered</Text>
                        <Image
                            source={icons.checkWhite}
                            className='w-4 h-4'
                        />
                    </TouchableOpacity>
            </View>

        </TouchableOpacity>
  )
}

export default OrderCart
