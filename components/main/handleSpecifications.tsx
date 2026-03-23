"use client";

import { ProductSpecificationToEdit, ProductToEditType } from '@/types';
import React, { useState, useRef, useCallback } from 'react';
import { ScrollView, View, Text, TextInput, Image, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { icons, colors } from '@/constants';
import { fakeSpecification } from '@/constants/data';
import ColorPicker from 'react-native-wheel-color-picker';

type Props = {
    updatedProduct: ProductToEditType;
    setUpdatedProduct: (value: ProductToEditType) => void;
};

const HandleSpecifications = ({ updatedProduct, setUpdatedProduct }: Props) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [tempColor, setTempColor] = useState('#000000');

    const pickerColorRef = useRef('#000000');

    const updateSpec = useCallback((index: number, newData: Partial<ProductSpecificationToEdit>) => {
        const updatedSpecs = [...(updatedProduct.specifications || [])];
        updatedSpecs[index] = { ...updatedSpecs[index], ...newData };
        setUpdatedProduct({ ...updatedProduct, specifications: updatedSpecs });
    }, [updatedProduct, setUpdatedProduct]);

    const openColorPicker = (index: number, currentColor: string | null | undefined) => {
        const initialCol = currentColor || '#000000';
        setActiveIndex(index);
        setTempColor(initialCol);
        pickerColorRef.current = initialCol;
        setIsModalVisible(true);
    };

    const confirmColor = () => {
        if (activeIndex !== null) {
            updateSpec(activeIndex, { colorHex: tempColor }); // تم تعديلها لتأخذ tempColor المباشر
        }
        setIsModalVisible(false);
    };

    // عند إضافة مواصفة جديدة، نستخدم Timestamp كـ ID مؤقت
    const addNewSpecification = () => {
        const tempId = `temp_${Date.now()}`; // معرف مؤقت فريد
        const newSpec = {
            ...fakeSpecification,
            _id: tempId,
            colorHex: '#000000',
            quantity: 0,
            price: "0"
        };
        setUpdatedProduct({
            ...updatedProduct,
            specifications: [...(updatedProduct.specifications || []), newSpec]
        });
    };

    return (
        <View className='w-full min-h-[100px]- bg-red-500- mt-8'>
            {/* Header Section */}
            <View className='flex-row justify-between items-center px-6- mb-6'>
                <View>
                    <Text className='text-xl font-black text-black uppercase tracking-tighter'>Inventory</Text>
                    <Text className='text-gray-400 text-[10px] font-bold uppercase tracking-widest'>Styles & Stock Management</Text>
                </View>
                <TouchableOpacity
                    onPress={addNewSpecification}
                    className='bg-black px-4 py-2.5 rounded-2xl flex-row items-center shadow-lg'
                >
                    <Image source={icons.plus} className='w-3 h-3 mr-2' style={{ tintColor: 'white' }} />
                    <Text className='text-white font-black text-[10px] uppercase'>Add Variant</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0, gap: 10, paddingBottom: 25 }}
            >
                {updatedProduct.specifications?.map((specification, index) => (
                    <View
                        key={specification._id || index}
                        className={`w-[320px] bg-white rounded-[40px] p-6 border-2 shadow-2xl shadow-black/5 ${specification.unlimited ? 'border-green-100' : 'border-gray-50'}`}
                        style={{
                            backgroundColor: colors.light[100],
                            borderRadius: 20,
                            padding: 10,
                            borderWidth: 1,
                            borderColor: colors.light[200]
                        }}
                    >
                        {/* Card Header */}
                        <View className='flex-row justify-between items-center mb-6'>
                            <View className={`px-4 py-1.5 rounded-full ${specification.unlimited ? 'bg-green-500' : 'bg-black'}`}>
                                <Text className='font-black text-white text-[10px] uppercase tracking-widest'>
                                    {specification.unlimited ? '∞ UNLIMITED' : `VARIANT #${index + 1}`}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    const filtered = updatedProduct.specifications?.filter((_, i) => i !== index);
                                    setUpdatedProduct({ ...updatedProduct, specifications: filtered });
                                }}
                                className='bg-red-50 w-8 h-8 items-center justify-center rounded-full border border-red-100'
                            >
                                <Text className='text-red-500 font-bold'>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Zone 1: Aesthetic Attributes */}
                        <View className="mb-6 p-4 bg-gray-50/50 rounded-[30px] border border-gray-100">
                            <Text className='text-[10px] font-black text-gray-300 mb-4 uppercase tracking-widest'>1. Aesthetic Design</Text>

                            <View className="flex-row items-center mb-4">
                                <TouchableOpacity
                                    onPress={() => openColorPicker(index, specification.colorHex)}
                                    activeOpacity={0.9}
                                    style={{ backgroundColor: specification.colorHex || '#000' }}
                                    className="w-14 h-14 rounded-full border-4 border-white shadow-md items-center justify-center"
                                >
                                    <Image source={icons.editText} className='w-3 h-3' style={{ tintColor: 'white', opacity: 0.5 }} />
                                </TouchableOpacity>
                                <View className='ml-4 flex-1'>
                                    <Text className='text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1'>Color Name</Text>
                                    <TextInput
                                        value={specification.color || ''}
                                        placeholder="Red, Blue..."
                                        onChangeText={(text) => updateSpec(index, { color: text })}
                                        className='bg-white h-12 px-4 py-3 rounded-xl text-[11px] font-bold border border-gray-100'
                                        // style={{
                                        //     backgroundColor: colors.light[100],
                                        //     borderRadius: 10,
                                        //     padding: 10,
                                        //     borderWidth: 1,
                                        //     borderColor: colors.light[200]
                                        // }}
                                        placeholderTextColor="#D1D5DB"
                                    />
                                </View>
                            </View>

                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    <Text className='text-gray-400 text-[9px] font-black uppercase tracking-widest mb-2 ml-1'>Type</Text>
                                    <TextInput
                                        value={specification.type || ''}
                                        placeholder="Cotton, Silk"
                                        onChangeText={(text) => updateSpec(index, { type: text })}
                                        className='bg-white px-4 py-3 rounded-xl text-[11px] font-bold border border-gray-100'
                                        placeholderTextColor="#D1D5DB"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className='text-gray-400 text-[9px] font-black uppercase tracking-widest mb-2 ml-1'>Size</Text>
                                    <TextInput
                                        value={specification.size || ''}
                                        placeholder="XL, 42"
                                        onChangeText={(text) => updateSpec(index, { size: text })}
                                        className='bg-white px-4 py-3 rounded-xl text-[11px] font-bold border border-gray-100 text-center'
                                        placeholderTextColor="#D1D5DB"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Zone 2: Market & Inventory */}
                        <View className={`p-4 rounded-[30px] border ${specification.unlimited ? 'bg-green-50/20 border-green-100' : 'bg-gray-50/50 border-gray-100'}`}>
                            <Text className={`text-[10px] font-black mb-4 uppercase tracking-widest ${specification.unlimited ? 'text-green-300' : 'text-gray-300'}`}>2. Market & Stock</Text>

                            <View className="flex-row gap-3 mb-4">
                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[9px] font-black uppercase tracking-widest mb-2 ml-1'>Availability</Text>
                                    <View className="flex-row items-center bg-white rounded-xl p-1 h-[44px] border border-gray-100">
                                        <TouchableOpacity
                                            onPress={() => updateSpec(index, { unlimited: false })}
                                            className={`flex-1 h-full items-center justify-center rounded-lg ${!specification.unlimited ? 'bg-black' : ''}`}
                                        >
                                            <Text className={`text-[8px] font-bold ${!specification.unlimited ? 'text-white' : 'text-gray-400'}`}>LIMIT</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => updateSpec(index, { unlimited: true })}
                                            className={`flex-1 h-full items-center justify-center rounded-lg ${specification.unlimited ? 'bg-green-500' : ''}`}
                                        >
                                            <Text className={`text-[8px] font-bold ${specification.unlimited ? 'text-white' : 'text-gray-400'}`}>∞ INF</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className='flex-1'>
                                    <Text className='text-gray-400 text-[9px] font-black uppercase tracking-widest mb-2 ml-1'>Stock</Text>
                                    <View className="relative">
                                        <TextInput
                                            value={specification.unlimited ? '∞' : (specification.quantity?.toString() || '0')}
                                            keyboardType='number-pad'
                                            editable={!specification.unlimited}
                                            onChangeText={(v) => updateSpec(index, { quantity: parseInt(v) || 0 })}
                                            className={`h-[44px] rounded-xl text-xs text-center font-black border ${specification.unlimited ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-white text-black border-gray-100'}`}
                                        />
                                        {specification.unlimited && (
                                            <View className="absolute right-2 top-3 w-1.5 h-1.5 rounded-full bg-green-500" />
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View>
                                <Text className='text-gray-400 text-[9px] font-black uppercase tracking-widest mb-2 ml-1'>Selling Price</Text>
                                <View className="flex-row items-center bg-black rounded-2xl px-5 h-[56px] shadow-lg shadow-black/20">
                                    <TextInput
                                        value={specification.price?.toString() || ''}
                                        keyboardType='decimal-pad'
                                        onChangeText={(v) => updateSpec(index, { price: v })}
                                        className='flex-1 text-white font-black text-lg'
                                        placeholder="0.00"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                    />
                                    <Text className="text-white/40 font-black text-xs">TND</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Ghost Add Button */}
                <TouchableOpacity
                    onPress={addNewSpecification}
                    className='w-[140px] min-h-52 items-center justify-center rounded-[40px] border-2 border-dashed border-gray-200 bg-gray-50/50'
                >
                    <View className='bg-black p-4 rounded-full shadow-lg'>
                        <Image source={icons.plus} className='w-6 h-6' style={{ tintColor: 'white' }} />
                    </View>
                    <Text className='text-[10px] text-black font-black uppercase tracking-widest mt-4'>New Variant</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Premium Color Picker Modal */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade" // استخدام fade بدلاً من slide لشعور أنعم
            >
                <View className="flex-1 justify-center items-center bg-black/80 px-6">
                    {/* Background Closer */}
                    <TouchableOpacity
                        className="absolute inset-0"
                        activeOpacity={1}
                        onPress={() => setIsModalVisible(false)}
                    />

                    <View className="w-full bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden">
                        {/* Decorative Top Line */}
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className='text-black font-black uppercase tracking-tighter text-lg'>Color Palette</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Text className="text-gray-400 font-bold">CLOSE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* The Color Wheel Container */}
                        <View className="w-full h-64 items-center justify-center bg-gray-50 rounded-[30px] p-4 border border-gray-100">
                            <ColorPicker
                                //@ts-ignore
                                initialColor={tempColor}
                                onColorChangeComplete={(color) => setTempColor(color)}
                                thumbSize={24}
                                sliderSize={20}
                                noSnap={true}
                                swatches={false}
                            />
                        </View>

                        {/* Hex Display & Preview Row */}
                        <View className='flex-row items-center justify-between mt-8'>
                            <View className="flex-row items-center flex-1">
                                <View
                                    style={{ backgroundColor: tempColor }}
                                    className='w-14 h-14 rounded-2xl border-4 border-gray-100 shadow-sm'
                                />
                                <View className="ml-4">
                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Active Hex</Text>
                                    <Text className='font-black text-xl uppercase tracking-tighter text-black'>{tempColor}</Text>
                                </View>
                            </View>

                            {/* Black Confirm Button inside the card */}
                            <TouchableOpacity
                                onPress={confirmColor}
                                className="bg-black h-14 w-14 rounded-2xl items-center justify-center shadow-lg"
                            >
                                <Image source={icons.check} className='w-5 h-5 rotate-45-' style={{ tintColor: 'white' }} />
                                {/* استعملت أيقونة الـ plus مع تدويرها لتشبه علامة التأكيد بشكل فني */}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default HandleSpecifications;