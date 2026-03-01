import { colors } from '@/constants';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type FilterProps = {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
};

const categories = ["All", "Electronics", "Clothing", "Home", "Accessories"];

export const FilterSection = ({ selectedCategory, onCategoryChange }: FilterProps) => {
    return (
        <View className="py-2">
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 20 }}
            >
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onCategoryChange(cat === "All" ? "" : cat)}
                        className="mr-3 px-5 py-2 rounded-full border"
                        style={{
                            backgroundColor: (selectedCategory === cat || (cat === "All" && !selectedCategory)) 
                                ? colors.dark[100] 
                                : colors.light[200],
                            borderColor: colors.light[300]
                        }}
                    >
                        <Text 
                            className="font-bold text-[12px]"
                            style={{ 
                                color: (selectedCategory === cat || (cat === "All" && !selectedCategory)) 
                                    ? colors.light[100] 
                                    : colors.dark[100] 
                            }}
                        >
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};