import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { isValidEmail, isValidPhone } from '@/lib';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DeliveryWorkerProps {
  workerData?: any;
  onRefresh?: () => Promise<void>;
}

const DeliveryWorker = ({ workerData: initialData, onRefresh }: DeliveryWorkerProps) => {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { setStatusBanner } = useStatusBanner();

  // Form state for editing
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchWorkerData = async () => {
    try {
      const response = await axios.get(`${backEndUrl}/getDeliveryWorker`);
      const worker = response.data.deliveryWorker;

      if (worker) {
        setData(worker);
        setFormData({
          fullName: worker.fullName || '',
          phone: worker.phone ? String(worker.phone) : '',
          email: worker.email || '',
          address: worker.address || '',
        });
      }
    } catch (error) {
      console.error("Error fetching worker:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    await fetchWorkerData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchWorkerData();
  }, [initialData]);

  const handleUpdate = async () => {
    if (!data?._id) return;

    // Validation
    if (formData.email && !isValidEmail(formData.email)) {
      setStatusBanner(true, "Please provide a valid email address.", "warning");
      return;
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      setStatusBanner(true, "Phone number must be exactly 8 digits.", "warning");
      return;
    }

    try {
      setUpdating(true);
      await axios.put(`${backEndUrl}/updateDeliveryWorker/${data._id}`, formData);

      setIsEditing(false);
      setStatusBanner(true, "Profile updated successfully.", "success");
      await fetchWorkerData();
    } catch (error: any) {
      setStatusBanner(true, error.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white" style={{ minHeight: '100%' }}>
      <ActivityIndicator size="large" color={colors.dark[100]} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 bg-white"
        style={{ minHeight: '100%' }}
        contentContainerStyle={{ paddingBottom: 0 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.dark[100]}
          />
        }
      >
        <View className="p-6">
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-xs opacity-40 uppercase tracking-widest font-bold" style={{ color: colors.dark[100] }}>
                Management
              </Text>
              <Text className="text-3xl font-bold" style={{ color: colors.dark[100] }}>
                Worker Profile
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              className="px-5 py-2 rounded-full border"
              style={{ borderColor: colors.dark[100] }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.dark[100] }}>
                {isEditing ? "CANCEL" : "EDIT"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            className="w-full p-8 rounded-[40px]"
            style={{ backgroundColor: colors.light[200] }}
          >
            <View className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.light[400] }}
              >
                <Text className="text-3xl font-bold" style={{ color: colors.dark[100] }}>
                  {data?.fullName ? data.fullName[0].toUpperCase() : 'D'}
                </Text>
              </View>

              {isEditing ? (
                <TextInput
                  value={formData.fullName}
                  onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  className="text-xl font-bold text-center w-full p-2 rounded-xl bg-white/40"
                  style={{ color: colors.dark[100] }}
                />
              ) : (
                <Text className="text-2xl font-bold text-center" style={{ color: colors.dark[100] }}>
                  {data?.fullName || "Not Set"}
                </Text>
              )}
            </View>

            <View className="space-y-2">
              <EditableRow
                label="PHONE NUMBER"
                value={isEditing ? formData.phone : data?.phone}
                isEditing={isEditing}
                onChange={(t: string) => {
                  const clean = t.replace(/\D/g, '').slice(0, 8);
                  setFormData({ ...formData, phone: clean });
                }}
                keyboardType="phone-pad"
                maxLength={8}
                isInvalid={formData.phone && !isValidPhone(formData.phone)}
              />
              <EditableRow
                label="EMAIL ADDRESS"
                value={isEditing ? formData.email : data?.email}
                isEditing={isEditing}
                onChange={(t: string) => setFormData({ ...formData, email: t })}
                isInvalid={formData.email && !isValidEmail(formData.email)}
              />
              <EditableRow
                label="ADDRESS"
                value={isEditing ? formData.address : data?.address}
                isEditing={isEditing}
                onChange={(t: string) => setFormData({ ...formData, address: t })}
              />
            </View>
          </View>

          {isEditing ? (
            <TouchableOpacity
              disabled={updating}
              onPress={handleUpdate}
              className="mt-8 w-full py-5 rounded-[25px] items-center"
              style={{ backgroundColor: colors.dark[100] }}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-white text-base tracking-widest">SAVE CHANGES</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View className="mt-10 items-center opacity-20">
              <Text className="text-[9px] font-bold tracking-[2px]" style={{ color: colors.dark[100] }}>
                SILVERWAY • DELIVERY WORKER
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const EditableRow = ({ label, value, isEditing, onChange, keyboardType = "default", isLast, maxLength, isInvalid }: any) => (
  <View className={`py-4 ${!isLast ? 'border-b border-black/5' : ''}`}>
    <Text className={`text-[9px] font-bold opacity-30 mb-1 ${isInvalid ? 'text-red-500 opacity-100' : ''}`} style={!isInvalid ? { color: colors.dark[100] } : {}}>
      {label} {isInvalid && "(INVALID)"}
    </Text>
    {isEditing ? (
      <TextInput
        value={String(value || '')}
        onChangeText={onChange}
        keyboardType={keyboardType}
        maxLength={maxLength}
        className={`font-bold text-sm p-0 m-0 ${isInvalid ? 'text-red-500' : ''}`}
        style={!isInvalid ? { color: colors.dark[100] } : {}}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    ) : (
      <Text className="font-bold text-sm" style={{ color: colors.dark[100] }}>
        {value ? String(value) : '---'}
      </Text>
    )}
  </View>
);

export default DeliveryWorker;