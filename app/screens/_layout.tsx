import { Stack } from 'expo-router';
import { colors } from '@/constants';
import React from 'react';

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // إخفاء الهيدر الافتراضي لكل الصفحات هنا
        contentStyle: { backgroundColor: colors.light[100] },
      }}
    >
      {/* هذه هي الصفحة التي نريدها أن تظهر كـ Modal */}
      <Stack.Screen 
        name="collectionsManagement" 
        options={{ 
          presentation: 'modal', 
          animation: 'slide_from_bottom',
          // في iOS، سيظهر شكل الـ Sheet الجميل
          // في أندرويد، سيظهر كـ Slide من الأسفل
        }} 
      />
    </Stack>
  );
}