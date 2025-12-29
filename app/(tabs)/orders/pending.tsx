import { colors } from '@/constants'
import OrderCart from '@/components/sub/orderCart'
import { OrderType } from '@/types'
import React, { useEffect } from 'react'
import { View, Text, ScrollView, Image } from 'react-native'

type props = {
    orders: OrderType[]
}

const Pending = ({
    orders
}: props) => {

    useEffect(() => {
        // console.log(JSON.stringify(orders, null, 2));
        
    }, [orders])

  return (
    <View
        style={{
            backgroundColor: colors.light[100],
        }}
    >
        <ScrollView
          contentContainerStyle={{
              padding: 10,
              paddingBottom: 100,
              flexDirection: "column",
              // justifyContent: "center",
              gap: 5,
          }}
        >
            {orders.map((order, index) => (
                <OrderCart 
                    key={order._id}
                    order={order}
                />
            ))}

        </ScrollView>
    </View>
  )
}

export default Pending
