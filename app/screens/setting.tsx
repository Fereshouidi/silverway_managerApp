import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView, Platform,
    RefreshControl,
    ScrollView,
    Text, TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from '@/components/main/header';
import SidebarCollectionsEditor from '@/components/sub/ownerInfoEdit/collectionsInSideBar';
import HomeCollectionsEditor from '@/components/sub/ownerInfoEdit/homeCollections';
import LogoEditor from '@/components/sub/ownerInfoEdit/logo';
import TopCollectionsEditor from '@/components/sub/ownerInfoEdit/topCollections';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import PubsSection from '@/components/sub/ownerInfoEdit/pubsSection';
import SocialMediaSection from '@/components/sub/ownerInfoEdit/socialMedia';

import { useAdmin } from '@/contexts/admin';
import { useOwner } from '@/contexts/owner';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { PubType } from '@/types';

const Setting = () => {
    const { ownerInfo, setOwnerInfo } = useOwner();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const router = useRouter();
    const [pubsData, setPubsData] = useState<PubType | null>(null);
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();

    const fetchData = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else if (!ownerInfo) setLoading(true);

        try {
            const [ownerRes, pubRes] = await Promise.all([
                axios.get(`${backEndUrl}/getOwnerInfo`),
                axios.get(`${backEndUrl}/getPub`)
            ]);

            if (ownerRes.data.ownerInfo) {
                const info = ownerRes.data.ownerInfo;
                setOwnerInfo({
                    ...info,
                    shippingCost: info.shippingCost || 0,
                    contact: {
                        email: info.contact?.email || '',
                        mailPassword: info.contact?.mailPassword || '',
                        phone: info.contact?.phone ? String(info.contact.phone) : ''
                    },
                    logo: info.logo || { dark: '', light: '' },
                    homeCollections: info.homeCollections || [],
                    topCollections: info.topCollections || [],
                    collectionsInSideBar: info.collectionsInSideBar || [],
                    freeShippingThreshold: info.freeShippingThreshold || 0,
                    aiPrompt: info.aiPrompt || ''
                });
            }

            if (pubRes.data.pub) {
                setPubsData(pubRes.data.pub);
            }
        } catch (err) {
            setStatusBanner(true, "Could not fetch data", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async () => {
        if (!pubsData || !ownerInfo) return;

        if (!admin?.accesses?.includes('Control Settings')) {
            setStatusBanner(true, "You don't have permission to save settings", "error");
            return;
        }

        setSaveLoading(true);
        try {
            const pubFormData = new FormData();
            const ownerFormData = new FormData();

            const appendImageField = (formData: FormData, fieldName: string, uri: any) => {
                if (!uri || typeof uri !== 'string') return;
                if (uri.startsWith('file') || uri.startsWith('content')) {
                    formData.append(fieldName, {
                        uri: uri,
                        name: `${fieldName}.jpg`,
                        type: 'image/jpeg',
                    } as any);
                } else if (uri.startsWith('http')) {
                    formData.append(fieldName, uri);
                }
            };

            // --- Pub Data ---
            pubFormData.append('topBar', pubsData.topBar?.fr || "");
            appendImageField(pubFormData, 'heroBanner_sm', pubsData.heroBanner?.sm);
            appendImageField(pubFormData, 'heroBanner_md', pubsData.heroBanner?.md);
            appendImageField(pubFormData, 'bottomBanner_sm', pubsData.bottomBanner?.sm);
            appendImageField(pubFormData, 'bottomBanner_md', pubsData.bottomBanner?.md);

            // --- Owner Data ---
            ownerFormData.append('name', ownerInfo.name || "");
            ownerFormData.append('shippingCost', String(ownerInfo.shippingCost || 0));
            ownerFormData.append('freeShippingThreshold', String(ownerInfo.freeShippingThreshold || 0));

            // إرسال كائن Contact بشكل صحيح
            ownerFormData.append('contact', JSON.stringify({
                email: ownerInfo.contact?.email || "",
                mailPassword: ownerInfo.contact?.mailPassword || "",
                phone: ownerInfo.contact?.phone || ""
            }));

            ownerFormData.append('socialMedia', JSON.stringify(ownerInfo.socialMedia || []));
            ownerFormData.append('homeCollections', JSON.stringify(ownerInfo.homeCollections || []));
            ownerFormData.append('topCollections', JSON.stringify(ownerInfo.topCollections || []));
            ownerFormData.append('collectionsInSideBar', JSON.stringify(ownerInfo.collectionsInSideBar || []));
            ownerFormData.append('aiPrompt', ownerInfo.aiPrompt || "");

            appendImageField(ownerFormData, 'logoDark', ownerInfo.logo?.dark);
            appendImageField(ownerFormData, 'logoLight', ownerInfo.logo?.light);

            // إرسال الطلبات
            await Promise.all([
                axios.put(`${backEndUrl}/updatePub`, pubFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }),
                axios.put(`${backEndUrl}/updateOwnerInfo`, ownerFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            ]);

            setStatusBanner(true, "All settings updated successfully! ✅", "success");
            fetchData(true);

        } catch (err: any) {
            console.error("Save Error Details:", err.response?.data || err.message);
            setStatusBanner(true, "Failed to save changes.", "error");
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.light[100] }}>
                <ActivityIndicator size="large" color={colors.dark[100]} />
            </View>
        );
    }

    if (!ownerInfo) return null;

    return (
        <SafeAreaView className='flex-1' style={{ backgroundColor: colors.light[100] }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <Header
                    title='setting'
                    className=''
                    onBackButtonPress={() => router.back()}
                    items={
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saveLoading}
                            activeOpacity={0.7}
                            className='h-10 w-10 flex justify-center items-center rounded-full'
                            style={{ backgroundColor: colors.dark[200] }}
                        >
                            {saveLoading ? (
                                <ActivityIndicator size="small" color={colors.light[100]} />
                            ) : (
                                <MaterialCommunityIcons name="check" size={24} color={colors.light[100]} />
                            )}
                        </TouchableOpacity>
                    }
                />

                <ScrollView
                    className='flex-1'
                    contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 10 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchData(true)}
                            tintColor={colors.dark[100]}
                        />
                    }
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View>
                            <LogoEditor
                                logo={ownerInfo.logo}
                                setLogo={(v) => setOwnerInfo({ ...ownerInfo, logo: v })}
                            />

                            <View className="w-full px-6 py-8 rounded-xl mt-6 shadow-sm" style={{ backgroundColor: colors.light[200] }}>
                                {/* Header Section */}
                                <View className="flex-row items-center mb-6">
                                    {/* <MaterialCommunityIcons name="store-cog-outline" size={24} color={colors.dark[100]} /> */}
                                    <Text className="text-lg font-bold ml-3-" style={{ color: colors.dark[100] }}>General Info</Text>
                                </View>

                                <View className="gap-y-5">
                                    {/* Store Name Input */}
                                    <View>
                                        <Text className="text-[10px] opacity-40 font-bold ml-1 mb-2 uppercase tracking-widest">Store Name</Text>
                                        <View className="flex-row items-center rounded-xl px-4" style={{ backgroundColor: colors.light[100] }}>
                                            <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.dark[100]} style={{ opacity: 0.5 }} />
                                            <TextInput
                                                value={ownerInfo.name || ""}
                                                onChangeText={(v) => setOwnerInfo({ ...ownerInfo, name: v })}
                                                className="flex-1 p-4 text-sm font-semibold"
                                                style={{ color: colors.dark[100] }}
                                                placeholder="Enter store name"
                                                placeholderTextColor={`${colors.dark[100]}40`}
                                            />
                                        </View>
                                    </View>

                                    {/* Shipping Cost Input */}
                                    <View>
                                        <Text className="text-[10px] opacity-40 font-bold ml-1 mb-2 uppercase tracking-widest">Default Shipping Cost</Text>
                                        <View className="flex-row items-center rounded-xl px-4" style={{ backgroundColor: colors.light[100] }}>
                                            <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={colors.dark[100]} style={{ opacity: 0.5 }} />
                                            <TextInput
                                                value={String(ownerInfo.shippingCost ?? 0)}
                                                onChangeText={(v) => setOwnerInfo({ ...ownerInfo, shippingCost: Number(v) || 0 })}
                                                keyboardType="numeric"
                                                className="flex-1 p-4 text-sm font-semibold"
                                                style={{ color: colors.dark[100] }}
                                                placeholder="0.00"
                                                placeholderTextColor={`${colors.dark[100]}40`}
                                            />
                                            <Text className="font-bold text-xs opacity-40" style={{ color: colors.dark[100] }}>D.T</Text>
                                        </View>
                                    </View>

                                    {/* Free Shipping Threshold Input */}
                                    <View>
                                        <Text className="text-[10px] opacity-40 font-bold ml-1 mb-2 uppercase tracking-widest">Free Shipping Threshold</Text>
                                        <View className="flex-row items-center rounded-xl px-4" style={{ backgroundColor: colors.light[100] }}>
                                            <MaterialCommunityIcons name="gift-outline" size={20} color={colors.dark[100]} style={{ opacity: 0.5 }} />
                                            <TextInput
                                                value={String(ownerInfo.freeShippingThreshold ?? 0)}
                                                onChangeText={(v) => setOwnerInfo({ ...ownerInfo, freeShippingThreshold: Number(v) || 0 })}
                                                keyboardType="numeric"
                                                className="flex-1 p-4 text-sm font-semibold"
                                                style={{ color: colors.dark[100] }}
                                                placeholder="0.00"
                                                placeholderTextColor={`${colors.dark[100]}40`}
                                            />
                                            <Text className="font-bold text-xs opacity-40" style={{ color: colors.dark[100] }}>D.T</Text>
                                        </View>
                                        <Text className="text-[9px] text-gray-400 mt-2 ml-1 italic">Order amount to trigger free shipping</Text>
                                    </View>

                                    {/* AI Prompt Input */}
                                    <View>
                                        <Text className="text-[10px] opacity-40 font-bold ml-1 mb-2 uppercase tracking-widest">AI Instructions (Manager Rules)</Text>
                                        <View className="flex-row items-top rounded-xl px-4 py-2" style={{ backgroundColor: colors.light[100] }}>
                                            <MaterialCommunityIcons name="robot-outline" size={20} color={colors.dark[100]} style={{ opacity: 0.5, marginTop: 12 }} />
                                            <TextInput
                                                value={ownerInfo.aiPrompt || ""}
                                                onChangeText={(v) => setOwnerInfo({ ...ownerInfo, aiPrompt: v })}
                                                className="flex-1 p-4 text-sm font-semibold"
                                                style={{ color: colors.dark[100], minHeight: 120 }}
                                                placeholder="Enter rules for the AI assistant..."
                                                placeholderTextColor={`${colors.dark[100]}40`}
                                                multiline
                                                textAlignVertical="top"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* هذا المكون سيعرض النص بالفرنسية ويقوم بتحديث pubsData.topBar.fr */}
                            <PubsSection
                                pubData={pubsData}
                                setPubData={setPubsData}
                            />

                            <HomeCollectionsEditor />
                            <TopCollectionsEditor />
                            <SidebarCollectionsEditor />

                            <SocialMediaSection />
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Setting; 