import React from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useLoadingScreen } from "@/contexts/loadingScreen";
import { colors } from "@/constants";

export default function LoadingScreen() {
  const { loadingScreen } = useLoadingScreen();

  if (!loadingScreen.isOpen) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.dark[100]} />
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
    zIndex: 9999,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 30,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    minWidth: 150
  },
  loadingText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
  },
});