import { Stack } from "expo-router";
import React from "react";

export default function AdminAuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}