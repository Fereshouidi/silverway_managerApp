import { StatusBar } from 'expo-status-bar';
import { Text, View, Platform, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Swiper from "react-native-swiper";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import Button from '@/components/sub/Button';
import { getOnboardingData, OnboardingDataForBigBoss } from '@/constants/data';
import "@/global.css";
import { AdminAccess, WelcomeProps } from '@/types/index';
import { colors } from '@/constants';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/contexts/admin'; 

const Welcome = ({ navigation }: WelcomeProps) => {

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [isLastSlide, setIsLastSlide] = useState<boolean>(false);
    const swiperRef = useRef<Swiper>(null);
    const router = useRouter();
    const { admin } = useAdmin(); 
    const [activeOnboardingData, setActiveOnboardingData] = useState<any[]>([]);

    useEffect(() => {
        if (admin?.type == "bigBoss") {
            setActiveOnboardingData(OnboardingDataForBigBoss);
        } else {
            setActiveOnboardingData(getOnboardingData());
        }
    }, [admin])

    useEffect(() => {
        if (activeIndex == getOnboardingData().length - 1) {
            setIsLastSlide(true);
        } else {
            setIsLastSlide(false);
        }
    }, [activeIndex])

    // دالة التوجيه بناءً على أول صلاحية متاحة من مصفوفة accessesDispo
    const handleGetStarted = () => {
        // ترتيب الأولوية للصفحات التي يمكن فتحها
        const priorityRoutes = [
            { key: "Open Analytics page", path: "/(tabs)/analytics" },
            { key: "Open Orders page", path: "/(tabs)/orders" },
            { key: "Open Products page", path: "/(tabs)/products" },
            { key: "Open People page", path: "/(tabs)/people" },
            { key: "Open setting page", path: "/(tabs)/setting" },
        ];

        // البحث عن أول تطابق بين صلاحيات الأدمن والمسارات المتاحة
        const firstAvailable = priorityRoutes.find(route => 
            admin?.accesses?.includes(route.key as AdminAccess)
        );

        if (firstAvailable) {
            console.log({firstAvailable});
            
            router.replace(firstAvailable.path as any);
        } else {
            // إذا لم يملك أي صلاحية لفتح الصفحات، نرجعه لتسجيل الدخول أو صفحة فارغة
            console.error("No access to any tab found for this admin");
            router.replace("/(auth)/login" as any); 
        }
    };

    return (
        <SafeAreaView 
            className={` w-full h-full bg-whiteScale-100 dark:bg-blackScale-100`}
            style={{
                backgroundColor: colors.light[100]
            }}
        >
            
            <View
                className='w-full h-full'
                style={{zIndex: 100}} 
            >

                <Swiper 
                    ref={swiperRef}
                    loop={false}
                    dot={<View 
                        className="w-[10px] h-[10px] mx-1 bg-blackScale-100 dark:bg-whiteScale-100 rounded-full" 
                        style={{
                            backgroundColor: colors.light[300]
                        }}
                    />}
                    activeDot={<View 
                        className="w-[10px] h-[10px] mx-1 rounded-full" 
                        style={{
                            backgroundColor: colors.dark[100]
                        }}
                    />}
                    onIndexChanged={(index) => setActiveIndex(index)}
                    className='w-full py-10 '
                >
                    {activeOnboardingData.map((item, index) => {
                        return ( 
                            <View 
                                className="w-full h-full flex items-center" 
                                key={item.id}
                            >
                                <Image
                                    className='w-[100px] h-[100px] my-20'
                                    source={item.image}
                                />
                                <View className="flex flex-row items-center justify-center w-full mt-10">
                                    <Text className="text-blackScale-900 dark:text-whiteScale-900 text-2xl font-bold mx-10 text-center">{item.title}</Text>
                                </View>
                                <Text className="text-lg font-JakartaBold text-center text-blackScale-800 dark:text-whiteScale-800 mx-10 mt-10">{item.description}</Text>
                            </View>
                        )
                    })}
                </Swiper>

                <View className="flex flex-row items-center justify-center w-full px-5 my-5">

                    <Button 
                        tittle={isLastSlide ? "getStarted" : "next"}
                        onPress={() => isLastSlide ? 
                            handleGetStarted() 
                            : 
                            swiperRef.current?.scrollBy(1)
                        }
                        isWork={true}
                    />

                </View>
                
            </View>

        </SafeAreaView>
    );
}

export default Welcome;