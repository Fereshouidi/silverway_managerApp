import { colors } from '@/constants';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useRef } from 'react'
import React from 'react';
import { Pressable, View, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
// import "@/src/assets/icons/LoadingDotsBlack.json"


type MoreBottonProps = {
    skip: number,
    setSkip: (value: number) => void,
    limit: number
    isLoading: boolean
    className?: string
    onClick: () => void
}

const MoreBotton = ({
    skip,
    setSkip,
    limit,
    isLoading,
    className,
    onClick
}: MoreBottonProps) => {
    
    const ref = useRef(null);
    
    return (
        <TouchableOpacity 
            className={`w-44 h-12 border cursor-pointer m-5 text-sm sm:text-[17px] flex justify-center items-center overflow-hidden ${className}`}
            style={{
                borderColor: colors.dark[600],
                // color: colors.dark[100],
                backgroundColor: colors.light[100]
            }}
            onPress={() => {
                !isLoading && setSkip(skip + limit);
                onClick()
            }}
            ref={ref}
            
        >
            {
                isLoading ? (
                    <LottieView
                    source={require("@/app/assets/icons/LoadingDotsBlack.json")}
                    autoPlay
                    loop
                    style={{ width: '100%', height: '100%', transform: [{ scale: 2 }] }}
                    />
                ) : (
                    <Text 
                        className='font-[300]'
                        style={{
                            color: colors.dark[100]
                        }}
                    >Get More</Text>
            )
            }
        </TouchableOpacity>
    )
}

export default MoreBotton
