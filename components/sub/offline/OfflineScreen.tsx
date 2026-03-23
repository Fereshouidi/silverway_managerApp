import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiText, MotiView } from 'moti';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OfflineScreenProps {
    onRetry: () => void;
}

const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => {
    return (
        <SafeAreaView className="flex-1 bg-black items-center justify-center p-8">
            <MotiView
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-32 h-32 bg-white/5 rounded-full items-center justify-center mb-8"
            >
                <MotiView
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        loop: true,
                        duration: 2000,
                    }}
                    style={{
                        position: 'absolute',
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                />
                <MaterialCommunityIcons name="wifi-off" size={60} color="white" />
            </MotiView>

            <MotiText
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200 }}
                className="text-white text-3xl font-black uppercase tracking-tighter text-center"
            >
                You're Offline
            </MotiText>

            <MotiText
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400 }}
                className="text-white/40 text-center mt-4 mb-12 font-medium"
            >
                It seems you're not connected to the internet. Please check your connection and try again.
            </MotiText>

            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 600 }}
                className="w-full"
            >
                <TouchableOpacity
                    onPress={onRetry}
                    activeOpacity={0.8}
                    className="bg-white w-full h-16 rounded-2xl items-center justify-center shadow-xl shadow-white/10"
                >
                    <Text className="text-black font-black uppercase tracking-widest">Retry Connection</Text>
                </TouchableOpacity>
            </MotiView>

            <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1000 }}
                className="absolute bottom-12"
            >
                <Text className="text-white/20 text-[10px] font-bold uppercase tracking-[4px]">
                    Silverway Management System
                </Text>
            </MotiView>
        </SafeAreaView>
    );
};

export default OfflineScreen;
