import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { useLoadingScreen } from "@/contexts/loadingScreen";
import LoadingIcon from "./loadingIcon";
import { colors } from "@/constants";
import { useTheme } from "@react-navigation/native";

export default function LoadingScreen() {

  const { loadingScreen } = useLoadingScreen();
  const { colors } = useTheme();

  if (!loadingScreen.isOpen) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.center}>

        <View className="w-20 h-20 bg-red-500- p-3- flex flex-1-">
          <LoadingIcon />

        </View>
        
        {loadingScreen.message ? (
          <Text style={styles.loadingText}>
            {loadingScreen.message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // قيمة عالية لضمان الظهور فوق كل شيء
    backgroundColor: "rgba(0,0,0,0.3)", 
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    minWidth: 175,
    minHeight: 175,
    alignItems: "center",
    backgroundColor: colors?.light[100] || "#111",
    boxShadow: `0 5px 15px ${colors.dark[700]}`,
    borderWidth: 1,
    borderColor: colors.light[500],
    padding: 25,
    // paddingTop: 25,
    borderRadius: 20,
    gap: 15,
  },
  loadingText: {
    color: colors.dark[500],
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    textAlignVertical: "center",
    marginTop: 10,
  },
});