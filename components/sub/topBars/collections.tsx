import { backEndUrl } from '@/api'
import { icons } from '@/constants'
import { useAdmin } from '@/contexts/admin'
import { useLoadingScreen } from '@/contexts/loadingScreen'
import { useStatusBanner } from '@/contexts/StatusBanner'
import { useBanner } from '@/contexts/yesNoBanner'
import { CollectionType } from '@/types'
import axios from 'axios'
import { router } from 'expo-router'
import React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

type Props = {
    collectionsSelected: string[];
    setCollectionsSelected: (value: string[]) => void;
    collections: CollectionType[];
    setCollections: (value: CollectionType[]) => void;
}

const TopBarForCollectionsPage = ({
    collectionsSelected,
    setCollectionsSelected,
    collections,
    setCollections
}: Props) => {

    const { setLoadingScreen } = useLoadingScreen();
    const { showBanner } = useBanner();
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();

    const handleDelete = async () => {

        console.log(collectionsSelected)
        if (!admin?.accesses?.includes("Manage Collections")) {
            setStatusBanner(true, "You don't have permission to delete collections", "error");
            return;
        }

        if (collectionsSelected?.length === 0) return;

        showBanner({
            message: `Are you sure you want to delete ${collectionsSelected.length} collection(s)?`,
            onConfirm: async () => {
                setLoadingScreen(true, "Deleting...");

                try {
                    await axios.put(`${backEndUrl}/deleteCollections`, {
                        ids: collectionsSelected,
                        status: "deleted"
                    });

                    // التحديث المحلي للقائمة
                    setCollections(collections.filter(col => !collectionsSelected.includes(col._id!)));

                    // إفراغ الاختيارات بعد الحذف
                    setCollectionsSelected([]);

                    setStatusBanner(true, "Deleted successfully ✅", "success");
                } catch (err) {
                    console.log("Error deleting collections:", err);
                    setStatusBanner(true, "Something went wrong!", "error");
                } finally {
                    setLoadingScreen(false);
                }
            }
        });
    };

    const handleAdd = () => {
        if (!admin?.accesses?.includes("Manage Collections")) {
            setStatusBanner(true, "You don't have permission to add collections", "error");
            return;
        }
        router.push("/screens/makeNewCollection");
    }

    return (
        <View className='bg-red-500- flex flex-row justify-between items-center h-[60px]'>

            <View className='w-[27.5%] h-full flex flex-row justify-center gap-5'>
                <TouchableOpacity
                    className='w-full h-full flex justify-center items-center'
                    onPress={handleDelete}
                >
                    <Image
                        source={icons.trash}
                        className='w-6 h-6'
                    />
                </TouchableOpacity>
            </View>

            <View className='w-[27.5%] h-full flex flex-row justify-center bg-red-500- gap-5'>
                <TouchableOpacity
                    className='w-full h-full flex justify-center items-center'
                    onPress={handleAdd}
                >
                    <Image
                        source={icons.plus}
                        className='w-6 h-6'
                    />
                </TouchableOpacity>
            </View>

        </View>
    )
}

export default TopBarForCollectionsPage