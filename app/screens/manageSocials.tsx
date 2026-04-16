import Header from '@/components/main/header';
import { colors } from '@/constants';
import { useOwner } from '@/contexts/owner';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { isValidEmail, isValidPhone } from '@/lib';
import { OwnerInfoType } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const ManageSocials = () => {
    const router = useRouter();
    const { platform } = useLocalSearchParams();
    const { ownerInfo, setOwnerInfo } = useOwner();
    const { setStatusBanner } = useStatusBanner();
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // مرجع للتحكم في التمرير برمجياً
    const scrollRef = useRef<KeyboardAwareScrollView>(null);

    // مراقبة ارتفاع الكيبورد لتعديل المساحة السفلية ديناميكياً
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const getSocialLink = (name: string) => {
        const found = ownerInfo?.socialMedia?.find((s: any) => s.platform === name);
        return found ? found.link : '';
    };

    const [socials, setSocials] = useState({
        Facebook: getSocialLink('Facebook'),
        Instagram: getSocialLink('Instagram'),
        WhatsApp: getSocialLink('WhatsApp'),
        TikTok: getSocialLink('TikTok'),
        Phone: ownerInfo?.contact?.phone?.toString() || '',
        Email: ownerInfo?.contact?.email || '',
        MailPassword: ownerInfo?.contact?.mailPassword || ''
    });

    const socialConfig = [
        { name: 'Facebook', key: 'Facebook', icon: 'facebook', placeholder: 'https://facebook.com/username' },
        { name: 'Instagram', key: 'Instagram', icon: 'instagram', placeholder: 'https://instagram.com/username' },
        { name: 'WhatsApp', key: 'WhatsApp', icon: 'whatsapp', placeholder: 'https://wa.me/number' },
        { name: 'TikTok', key: 'TikTok', icon: 'music-note', placeholder: 'https://tiktok.com/@username' },
    ];

    const handleSave = async () => {
        if (!ownerInfo) return;

        // Validation
        if (socials.Email && !isValidEmail(socials.Email)) {
            setStatusBanner(true, "Please provide a valid business email.", "warning");
            return;
        }

        if (socials.Phone && !isValidPhone(socials.Phone)) {
            setStatusBanner(true, "Official phone must be exactly 8 digits.", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const updatedSocialMedia = socialConfig.map(config => ({
                platform: config.name,
                icon: `/icons/${config.name.toLowerCase()}.png`,
                link: socials[config.key as keyof typeof socials]
            }));

            const updatedData = {
                ...ownerInfo,
                socialMedia: updatedSocialMedia,
                contact: {
                    ...ownerInfo.contact,
                    phone: socials.Phone,
                    email: socials.Email,
                    mailPassword: socials.MailPassword
                }
            } as unknown as OwnerInfoType;

            await setOwnerInfo(updatedData);
            Keyboard.dismiss();
            router.back();
        } catch (err) {
            setStatusBanner(true, "Failed to save changes.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const isInvalidEmail = socials.Email && !isValidEmail(socials.Email);
    const isInvalidPhone = socials.Phone && !isValidPhone(socials.Phone);

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.light[100] }}>
            <Header
                title="Manage Presence"
                onBackButtonPress={() => router.back()}
                items={
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isLoading}
                        className="h-10 w-10 justify-center items-center rounded-full"
                        style={{ backgroundColor: colors.light[200] }}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={colors.dark[100]} />
                        ) : (
                            <MaterialCommunityIcons name="check" size={22} color={colors.dark[100]} />
                        )}
                    </TouchableOpacity>
                }
            />

            <KeyboardAwareScrollView
                ref={scrollRef}
                className="flex-1"
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraHeight={200}
                extraScrollHeight={80}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    padding: 24,
                    // التباعد السفلي يتغير فقط عند ظهور الكيبورد
                    paddingBottom: keyboardHeight > 0 ? keyboardHeight : 40
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-8">
                    <Text className="text-2xl font-bold" style={{ color: colors.dark[100] }}>
                        {ownerInfo?.name || 'Contact & Social'}
                    </Text>
                    <Text className="text-xs opacity-40 font-bold mt-2 uppercase tracking-widest">
                        Manage how customers reach you
                    </Text>
                </View>

                <View className="gap-y-6">
                    {/* Official Phone */}
                    <View className="gap-y-2">
                        <Text className={`ml-1 font-bold text-[10px] uppercase ${isInvalidPhone ? 'text-red-500' : 'opacity-40'}`} style={!isInvalidPhone ? { color: colors.dark[100] } : {}}>
                            Official Phone {isInvalidPhone && "(Must be 8 digits)"}
                        </Text>
                        <View className={`flex-row items-center px-4 h-16 rounded-xl border ${isInvalidPhone ? 'border-red-500' : 'border-transparent'}`} style={{ backgroundColor: colors.light[200] }}>
                            <MaterialCommunityIcons name="phone-outline" size={20} color={isInvalidPhone ? "#ef4444" : colors.dark[100]} style={{ opacity: isInvalidPhone ? 1 : 0.5 }} />
                            <TextInput
                                className="flex-1 ml-3 font-semibold text-sm h-full"
                                style={{ color: colors.dark[100] }}
                                keyboardType="phone-pad"
                                value={socials.Phone}
                                maxLength={8}
                                onChangeText={(text) => {
                                    const clean = text.replace(/\D/g, '').slice(0, 8);
                                    setSocials({ ...socials, Phone: clean });
                                }}
                            />
                        </View>
                    </View>

                    {/* Business Email */}
                    <View className="gap-y-2">
                        <Text className={`ml-1 font-bold text-[10px] uppercase ${isInvalidEmail ? 'text-red-500' : 'opacity-40'}`} style={!isInvalidEmail ? { color: colors.dark[100] } : {}}>
                            Business Email {isInvalidEmail && "(Invalid format)"}
                        </Text>
                        <View className={`flex-row items-center px-4 h-16 rounded-xl border ${isInvalidEmail ? 'border-red-500' : 'border-transparent'}`} style={{ backgroundColor: colors.light[200] }}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={isInvalidEmail ? "#ef4444" : colors.dark[100]} style={{ opacity: isInvalidEmail ? 1 : 0.5 }} />
                            <TextInput
                                className="flex-1 ml-3 font-semibold text-sm h-full"
                                style={{ color: colors.dark[100] }}
                                placeholder="store@gmail.com"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={socials.Email}
                                onChangeText={(text) => setSocials({ ...socials, Email: text })}
                            />
                        </View>
                    </View>


                    {/* Mail App Password */}
                    <View className="gap-y-2">
                        <Text className="ml-1 font-bold text-[10px] uppercase opacity-40" style={{ color: colors.dark[100] }}>Mail App Password</Text>
                        <View className="flex-row items-center px-4 h-16 rounded-xl" style={{ backgroundColor: colors.light[200] }}>
                            <MaterialCommunityIcons name="key-outline" size={20} color={colors.dark[100]} style={{ opacity: 0.5 }} />
                            <TextInput
                                className="flex-1 ml-3 font-semibold text-sm h-full"
                                style={{ color: colors.dark[100] }}
                                placeholder="Enter app password"
                                secureTextEntry={!isPasswordVisible}
                                autoCapitalize="none"
                                value={socials.MailPassword}
                                onChangeText={(text) => setSocials({ ...socials, MailPassword: text })}
                            />
                            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} className="p-2">
                                <MaterialCommunityIcons
                                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={colors.dark[100]}
                                    style={{ opacity: 0.5 }}
                                />
                            </TouchableOpacity>
                        </View>

                        <View className="mt-2 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                            <View className="flex-row items-center mb-1">
                                <MaterialCommunityIcons name="lock-check-outline" size={14} color="#3b82f6" />
                                <Text className="ml-1 text-[11px] font-bold text-blue-500 uppercase">What is this?</Text>
                            </View>
                            <Text className="text-[11px] leading-4 opacity-70" style={{ color: colors.dark[100] }}>
                                For your safety, we <Text className="font-bold">don't</Text> use your personal password. Use an <Text className="font-bold">App Password</Text> so your store can automatically send order confirmations to your customers.
                            </Text>
                        </View>
                    </View>

                    <View className="h-[1px] w-full bg-black/5 my-2" />

                    {/* Social Media Links */}
                    {socialConfig.map((item, index) => {
                        const isLastItem = index === socialConfig.length - 1;
                        return (
                            <View key={item.name} className="gap-y-2">
                                <Text className="ml-1 font-bold text-[10px] uppercase opacity-40" style={{ color: colors.dark[100] }}>{item.name} Profile Link</Text>
                                <View
                                    className="flex-row items-center px-4 h-16 rounded-xl border-2"
                                    style={{
                                        backgroundColor: colors.light[200],
                                        borderColor: platform === item.name ? colors.dark[100] : 'transparent'
                                    }}
                                >
                                    <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.dark[100]} />
                                    <TextInput
                                        className="flex-1 ml-3 font-semibold text-sm h-full"
                                        style={{ color: colors.dark[100] }}
                                        placeholder={item.placeholder}
                                        placeholderTextColor={colors.dark[100] + '40'}
                                        value={socials[item.key as keyof typeof socials]}
                                        onChangeText={(text) => setSocials({ ...socials, [item.key]: text })}
                                        autoFocus={platform === item.name}
                                        onFocus={() => {
                                            if (isLastItem) {
                                                // دفع الصفحة للأعلى عند التركيز على تيك توك
                                                setTimeout(() => {
                                                    scrollRef.current?.scrollToEnd(true);
                                                }, 150);
                                            }
                                        }}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default ManageSocials;