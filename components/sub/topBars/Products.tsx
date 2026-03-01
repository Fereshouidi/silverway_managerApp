import { backEndUrl } from '@/api';
import { icons } from '@/constants';
import { useAdmin } from '@/contexts/admin';
import { useLoadingScreen } from '@/contexts/loadingScreen';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { useBanner } from '@/contexts/yesNoBanner';
import { ProductType } from '@/types';
import axios from 'axios';
import { router } from 'expo-router';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';

type props = {
  searchBarActive: boolean,
  setSearchBarActive: (value: boolean) => void
  productsSelected: string[],
  setProductsSelected: (value: string[]) => void
  productsList: ProductType[],
  setProductsList: (value: ProductType[]) => void
}

const TopBarForProductsPage = ({
  searchBarActive,
  setSearchBarActive,
  productsSelected,
  setProductsSelected,
  productsList,
  setProductsList
}: props) => {

  const { setLoadingScreen } = useLoadingScreen();
  const { showBanner } = useBanner();
  const { admin } = useAdmin();
  const { setStatusBanner } = useStatusBanner();

  const handleDelete = async (status: string = "deleted") => {

    if (!admin?.accesses?.includes("Manage Products")) {
      setStatusBanner(true, "You don't have permission to delete products", "error");
      return;
    }

    // 1. التحقق من وجود منتجات مختارة
    if (productsSelected.length === 0) return;

    // 2. إظهار بنر التأكيد
    showBanner({
      message: `Are you sure you want to delete ${productsSelected.length} product(s)?`,
      onConfirm: async () => {
        setLoadingScreen(true, "Just wait a little bit...");

        try {
          const { data } = await axios.put(`${backEndUrl}/deleteProducts`, {
            ids: productsSelected,
            status: status // تمرير الحالة الجديدة للسيرفر
          });

          // التحديث المحلي (Optimistic Update)
          // @ts-ignore
          setProductsList((prevList: ProductType[]) =>
            prevList.filter(product => !productsSelected.includes(product._id!)) as unknown as ProductType[]
          );

          // إعادة ضبط القائمة المختارة
          setProductsSelected([]);

          setStatusBanner(true, `${data?.details?.modifiedCount || productsSelected.length} products have been deleted successfully ✅`, "success");

        } catch (err: any) {
          console.log("Error deleting products:", err);
          setStatusBanner(true, "An error occurred while trying to delete.", "error");
        } finally {
          setLoadingScreen(false);
        }
      }
    });
  };

  const handleHide = async (status: string = "archived") => {

    if (!admin?.accesses?.includes("Manage Products")) {
      setStatusBanner(true, "You don't have permission to hide products", "error");
      return;
    }

    // 1. التحقق من وجود منتجات مختارة
    if (productsSelected.length === 0) return;

    // 2. إظهار بنر التأكيد
    showBanner({
      message: `Are you sure you want to ${status === "active" ? "show" : "hide"} ${productsSelected.length} product(s)?`,
      onConfirm: async () => {
        setLoadingScreen(true, "Just wait a little bit...");

        try {
          const { data } = await axios.put(`${backEndUrl}/hideProducts`, {
            ids: productsSelected,
            status: status // تمرير الحالة الجديدة للسيرفر
          });

          // تحديث القائمة محلياً لتغيير حالة المنتج (اختياري، حسب رغبتك في إبقاء المنتجات في القائمة أو إزالتها)
          // @ts-ignore
          setProductsList((prevList) =>
            prevList.map((product: any) =>
              productsSelected.includes(product._id!)
                ? { ...product, status: status }
                : product
            )
          );

          setProductsSelected([]);

          setStatusBanner(true, `${data?.details?.modifiedCount || productsSelected.length} products have been updated successfully ✅`, "success");

        } catch (err: any) {
          console.log("Error updating products status:", err);
          setStatusBanner(true, "An error occurred while trying to update visibility.", "error");
        } finally {
          setLoadingScreen(false);
        }
      }
    });
  };

  const handleAdd = () => {
    if (!admin?.accesses?.includes("Manage Products")) {
      setStatusBanner(true, "You don't have permission to add products", "error");
      return;
    }
    router.push("/screens/makeNewProduct");
  }

  return (
    <View className='bg-red-500- flex flex-row justify-between items-center h-[60px]'>

      <View className='w-[27.5%] h-full  flex flex-row justify-center items-center gap-5-'>

        <View className='w-[40%] h-full  flex flex-row justify-center gap-5'>

          <TouchableOpacity
            className='w-full h-full flex justify-center items-center'
            onPress={() => handleDelete("deleted")}
          >
            <Image
              source={icons.trash}
              className='w-6 h-6'
            />
          </TouchableOpacity>
        </View>

        <View className='w-[40%] h-full flex flex-row justify-center gap-5'>
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


      <View className='w-[27.5%] h-full flex flex-row justify-center items-center bg-red-500- gap-2'>

        <View className='w-[40%] bg-blue-300- h-full flex flex-row justify-center gap-5-'>
          <TouchableOpacity
            className='w-full h-full flex justify-center items-center'
            onPress={() => setSearchBarActive(!searchBarActive)}
          >
            <Image
              source={icons.searchBlack}
              className='w-6 h-6'
            />
          </TouchableOpacity>

        </View>

        {/* <TouchableOpacity 
            onPress={() => handleHide("archived")}
            className="flex-row items-center p-1 rounded"
          >
            <MaterialCommunityIcons 
                name="eye-off-outline" 
                size={24} 
                color={colors.light[950]} 
              />
          </TouchableOpacity> */}
      </View>

    </View>
  )
}

export default TopBarForProductsPage
