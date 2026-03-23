import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { ProductType } from '@/types';

type Props = {
    setProducts: (value: ProductType[]) => void;
};

const SearchBar = ({ setProducts }: Props) => {
    const [searchText, setSearchText] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // الدالة ترسل البيانات تماماً كما يتوقعها الباك إند في الـ req.body
    const handleSearch = async (text: string) => {
        setIsSearching(true);

        try {
            const { data } = await axios.post(`${backEndUrl}/getProductsBySearch`, {
                searchText: text.trim(),
                limit: 20,
                skip: 0,
                filtration: {}, // فارغة كما طلبت
                status: JSON.stringify(["active", "archived"]) // لتمر من JSON.parse في السيرفر
            });

            console.log(data);

            // تعيين المنتجات بناءً على هيكلة الـ result الراجعة
            setProducts(data.products || []);
        } catch (err: any) {
            console.error("Search Error:", err.message);
        } finally {
            setIsSearching(false);
        }
    };

    // تطبيق الـ Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleSearch(searchText);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchText]);

    return (
        <View style={styles.container}>
            <View
                className="w-[90%] h-[54px] rounded-2xl flex-row items-center px-4 border-[0.5px]"
                style={{
                    backgroundColor: colors.light[100],
                    borderColor: colors.light[300]
                }}
            >
                <Ionicons name="search" size={20} color={colors.dark[400]} />

                <TextInput
                    placeholder="Search products..."
                    value={searchText}
                    onChangeText={setSearchText}
                    className="flex-1 h-full px-3 font-medium text-[15px]"
                    placeholderTextColor={colors.dark[600]}
                    style={{ color: colors.dark[100] }}
                />

                {/* عرض مؤشر التحميل داخل الشريط أو زر الحذف */}
                {isSearching ? (
                    <ActivityIndicator size="small" color={colors.dark[100]} />
                ) : (
                    searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText("")}>
                            <Ionicons name="close-circle" size={20} color={colors.dark[400]} />
                        </TouchableOpacity>
                    )
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: colors.light[150],
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default SearchBar;