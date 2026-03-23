import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { colors, icons } from '@/constants';
import { backEndUrl } from '@/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';

const AdminsList = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  const fetchAdmins = async (newSkip: number, isRefreshing: boolean = false) => {
    try {
      const response = await axios.get(`${backEndUrl}/getAdmins`, {
        params: { limit: LIMIT, skip: newSkip }
      });

      const fetchedAdmins = response.data.data;
      const fetchedTotal = response.data.total;

      if (isRefreshing) {
        setAdmins(fetchedAdmins);
      } else {
        setAdmins(prev => [...prev, ...fetchedAdmins]);
      }

      setTotal(fetchedTotal);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAdmins(0, true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSkip(0);
    await fetchAdmins(0, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && admins.length < total && !loading) {
      setLoadingMore(true);
      const nextSkip = skip + LIMIT;
      setSkip(nextSkip);
      fetchAdmins(nextSkip);
    }
  };

  const handleDeleteAdmin = async (adminId: string, fullName: string) => {
    Alert.alert(
      "Delete Admin",
      `Are you sure you want to delete ${fullName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${backEndUrl}/deleteAdmin`, {
                params: { id: adminId }
              });
              setAdmins(prev => prev.filter(admin => admin._id !== adminId));
              setTotal(prev => prev - 1);
            } catch (error) {
              console.error("Error deleting admin:", error);
              Alert.alert("Error", "Failed to delete admin. Please try again.");
            }
          }
        }
      ]
    );
  };

  const renderAdminItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({
        pathname: "/screens/adminDetails/[id]",
        params: { id: item._id }
      })}
      className="flex-row items-center p-4 mx-4 my-2 rounded-2xl shadow-sm"
      style={{ backgroundColor: colors.light[100] }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: colors.light[400] }}
      >
        <Image
          source={icons.realEstateAgent}
          style={{ width: 22, height: 22 }}
          tintColor={colors.light[100]}
        />
      </View>

      <View className="flex-1 ml-4">
        <Text className="text-base font-bold" style={{ color: colors.dark[100] }}>
          {item.fullName}
        </Text>
        <Text className="text-xs opacity-50 font-medium" style={{ color: colors.dark[100] }}>
          {item.email || 'No email provided'}
        </Text>
      </View>

      <View className='flex-row items-center gap-2'>
        {/* Verification Badge */}
        <View
          className="flex-row items-center px-3 py-1 rounded-full gap-1"
          style={{
            backgroundColor: item.isVerified ? '#ecfdf5' : '#fff7ed'
          }}
        >
          <MaterialCommunityIcons
            name={item.isVerified ? "check-decagram" : "alert-circle-outline"}
            size={12}
            color={item.isVerified ? "#059669" : "#d97706"}
          />
          <Text
            className="text-[9px] font-bold tracking-tighter"
            style={{ color: item.isVerified ? "#059669" : "#d97706" }}
          >
            {item.isVerified ? 'VERIFIED' : 'NOT VERIFIED'}
          </Text>
        </View>

        {/* Delete Button */}
        {/* {item.type !== 'bigBoss' && (
          <TouchableOpacity
            onPress={() => handleDeleteAdmin(item._id, item.fullName)}
            className="w-8 h-8 items-center justify-center rounded-full bg-red-50"
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        )} */}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View className="py-8 flex-row items-center justify-center">
          <ActivityIndicator color={colors.dark[100]} size="small" />
          <Text className="ml-3 text-[10px] font-bold opacity-40 uppercase tracking-widest">
            Fetching more admins...
          </Text>
        </View>
      );
    }
    return <View className="h-24" />;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.light[100] }}>
        <ActivityIndicator size="large" color={colors.dark[100]} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.light[100] }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-end">
        <View>
          <Text className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Team</Text>
          <Text className="text-2xl font-bold" style={{ color: colors.dark[100] }}>Administrators</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push("/screens/addAdmin")}
            className="w-10 h-10 items-center justify-center rounded-full border"
            style={{ backgroundColor: colors.light[200], borderColor: colors.light[300] }}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.dark[100]} />
          </TouchableOpacity>

          <View className="flex-row items-center px-3 py-2 rounded-full border" style={{ backgroundColor: colors.light[200], borderColor: colors.light[300] }}>
            <Text className="text-xs font-bold" style={{ color: colors.dark[100] }}>{admins.length}</Text>
            <Text className="text-xs opacity-40" style={{ color: colors.dark[100] }}> / {total}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={admins}
        keyExtractor={(item) => item._id}
        renderItem={renderAdminItem}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.dark[100]}
          />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="opacity-30 font-bold uppercase tracking-widest" style={{ color: colors.dark[100] }}>No Admins found</Text>
          </View>
        )}
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/screens/addAdmin")}
        className="absolute right-6 flex-row items-center px-6 py-4 rounded-full shadow-xl"
        style={{
          backgroundColor: colors.dark[100],
          elevation: 5,
          bottom: 110 + insets.bottom
        }}
      >
        <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.light[100]} />
        <Text className="ml-2 font-black text-[10px] uppercase tracking-widest" style={{ color: colors.light[100] }}>
          New Admin
        </Text>
      </TouchableOpacity>
    </View >
  );
};

export default AdminsList;