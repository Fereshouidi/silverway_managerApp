import React from "react";
import { Pressable } from "react-native";

// In your HapticTab component file
export function HapticTab(props: any) {
  return (
    <Pressable
      {...props}
      style={[{ flex: 1 }, props.style]} // Make sure flex: 1 is here
      onPressIn={() => {
        // haptic feedback
      }}
    />
  );
}