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
import { useRouter } from 'expo-router'; // استيراد الموجّه
import axios from 'axios';
import { colors, icons } from '@/constants';
import { backEndUrl } from '@/api';

const ClientsList = () => {
  const router = useRouter(); // تعريف الموجّه
  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  const fetchClients = async (newSkip: number, isRefreshing: boolean = false) => {
    try {
      const response = await axios.get(`${backEndUrl}/getClients`, {
        params: { limit: LIMIT, skip: newSkip }
      });

      const fetchedClients = response.data.data;
      const fetchedTotal = response.data.total;

      if (isRefreshing) {
        setClients(fetchedClients);
      } else {
        setClients(prev => [...prev, ...fetchedClients]);
      }

      setTotal(fetchedTotal);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchClients(0, true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSkip(0);
    await fetchClients(0, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && clients.length < total && !loading) {
      setLoadingMore(true);
      const nextSkip = skip + LIMIT;
      setSkip(nextSkip);
      fetchClients(nextSkip);
    }
  };

  const renderClientItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      // إضافة التوجيه لصفحة التفاصيل عند الضغط
      onPress={() => router.push({
        pathname: "/screens/clientDetails/[id]",
        params: { id: item._id }
      })}
      className="flex-row items-center p-4 mx-4 my-2 rounded-2xl shadow-sm"
      style={{ backgroundColor: colors.light[200] }}
    >
      <View 
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: colors.light[400] }}
      >
        <Image 
          source={icons.userWhite} 
          style={{ width: 22, height: 22 }}
          tintColor={colors.light[100]}
        />
      </View>

      <View className="flex-1 ml-4">
        <Text className="text-base font-bold" style={{ color: colors.dark[100] }}>
          {item.fullName || "Unknown Client"}
        </Text>
        <Text className="text-xs opacity-50 font-medium" style={{ color: colors.dark[100] }}>
          {item.phone ? `+${item.phone}` : 'No phone number'}
        </Text>
      </View>

      {item.isVerified && (
        <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: colors.dark[100] + '15' }}>
          <Text className="text-[9px] font-bold" style={{ color: colors.dark[100] }}>VERIFIED</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View className="py-8 flex-row items-center justify-center">
          <ActivityIndicator color={colors.dark[100]} size="small" />
          <Text className="ml-3 text-[10px] font-bold opacity-40 uppercase tracking-widest">
            Loading more...
          </Text>
        </View>
      );
    }
    return <View className="h-20" />;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white" style={{ minHeight: '100%' }}>
        <ActivityIndicator size="large" color={colors.dark[100]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ minHeight: '100%' }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-end">
        <View>
            <Text className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Directory</Text>
            <Text className="text-2xl font-bold" style={{ color: colors.dark[100] }}>Clients</Text>
        </View>
        <View className="flex-row items-center bg-gray-50 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold" style={{ color: colors.dark[100] }}>{clients.length}</Text>
            <Text className="text-xs opacity-40"> / {total}</Text>
        </View>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderClientItem}
        contentContainerStyle={{ paddingBottom: 70 }}
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
        removeClippedSubviews={true}
        initialNumToRender={10}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-20 px-10">
            <Text className="opacity-30 text-center font-medium">No clients found.</Text>
          </View>
        )}
      />
    </View>
  );
};

export default ClientsList;