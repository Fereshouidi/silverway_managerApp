import { colors } from '@/constants'
import { useRouter } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SocialMediaSection = () => {
    const router = useRouter();

    const socialPlatforms = [
        { id: '1', name: 'Facebook', icon: 'facebook', color: '#1877F2' },
        { id: '2', name: 'Instagram', icon: 'instagram', color: '#E4405F' },
        { id: '3', name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
        { id: '4', name: 'TikTok', icon: 'music-note', color: '#000000' },
    ];

    return (
        <View className="px-5 mt-6 rounded-xl p-5" style={{ backgroundColor: colors.light[200] }}>
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold" style={{ color: colors.dark[100] }}>
                    Social Media
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/screens/manageSocials')}
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: colors.light[200] }}
                >
                    <Text className="text-xs font-bold" style={{ color: colors.dark[100] }}>Edit All</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-3">
                {socialPlatforms.map((platform) => (
                    <TouchableOpacity
                        key={platform.id}
                        onPress={() => router.push({
                            pathname: '/screens/manageSocials',
                            params: { platform: platform.name }
                        })}
                        activeOpacity={0.7}
                        className="flex-row items-center p-4 rounded-xl"
                        style={{
                            width: '48%',
                            backgroundColor: colors.light[100]
                        }}
                    >
                        <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: colors.light[100] }}
                        >
                            <MaterialCommunityIcons name={platform.icon as any} size={22} color={colors.dark[100]} />
                        </View>
                        <Text className="font-bold text-sm" style={{ color: colors.dark[100] }}>
                            {platform.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

export default SocialMediaSection;