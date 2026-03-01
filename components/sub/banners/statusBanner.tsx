import { BannerType, useStatusBanner } from '@/contexts/StatusBanner';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

const StatusBanner = () => {
    const { statusBannerExist, text, type, setStatusBanner } = useStatusBanner();
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (statusBannerExist) {
            Animated.spring(slideAnim, {
                toValue: 20,
                useNativeDriver: true,
                tension: 40,
                friction: 7,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -150,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [statusBannerExist]);

    if (!statusBannerExist) return null;

    const getConfig = (type: BannerType) => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check-circle',
                    color: '#22c55e',
                    bgColor: '#f0fdf4',
                    borderColor: '#bbf7d0'
                };
            case 'error':
                return {
                    icon: 'alert-circle',
                    color: '#ef4444',
                    bgColor: '#fef2f2',
                    borderColor: '#fecaca'
                };
            case 'warning':
                return {
                    icon: 'alert',
                    color: '#f59e0b',
                    bgColor: '#fffbeb',
                    borderColor: '#fef3c7'
                };
            case 'info':
            default:
                return {
                    icon: 'information',
                    color: '#3b82f6',
                    bgColor: '#eff6ff',
                    borderColor: '#bfdbfe'
                };
        }
    };

    const config = getConfig(type);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: config.bgColor,
                    borderColor: config.borderColor,
                },
            ]}
        >
            <View className="flex-row items-center gap-3">
                <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: config.color + '20' }}
                >
                    <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
                </View>
                <View className="flex-1">
                    <Text
                        className="text-[15px] font-semibold"
                        style={{ color: '#1a1a1a' }}
                        numberOfLines={2}
                    >
                        {text}
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color="#9ca3af"
                    onPress={() => setStatusBanner(false)}
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20,
        left: 20,
        right: 20,
        padding: 14,
        borderRadius: 20,
        borderWidth: 1,
        zIndex: 99999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
});

export default StatusBanner;
