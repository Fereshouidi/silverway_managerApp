import { Stack } from "expo-router";
import React from "react";

export default function AdminAuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="verifyAdmin" />
    </Stack>
  );
}