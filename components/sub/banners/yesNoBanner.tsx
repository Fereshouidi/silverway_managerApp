import { colors } from '@/constants'
import { useBanner } from '@/contexts/yesNoBanner';
import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, Modal } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const YesNoBanner = () => {
  const { isVisible, bannerConfig, hideBanner } = useBanner();

  if (!isVisible || !bannerConfig) return null;

  const activeTheme = colors.light;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={hideBanner}
    >
      <View style={styles.overlay}>
        {/* Modal Card */}
        <View
          className="w-[85%] p-8 rounded-[35px] items-center"
          style={{
            backgroundColor: activeTheme[100],
            shadowColor: colors.light[950],
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.15,
            shadowRadius: 30,
            elevation: 10,
          }}
        >
          {/* Top Icon Area */}
          <View
            className="mb-5 w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: activeTheme[200] }}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={35}
              color={activeTheme[950]}
            />
          </View>

          {/* Message */}
          <Text
            className="text-xl font-bold text-center mb-8"
            style={{ color: activeTheme[950], lineHeight: 28 }}
          >
            {bannerConfig.message}
          </Text>

          {/* Buttons Row */}
          <View className="w-full flex-row gap-4">

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => {
                if (bannerConfig.onCancel) bannerConfig.onCancel();
                hideBanner();
              }}
              disabled={bannerConfig.isLoading}
              className="flex-1 h-14 rounded-xl items-center justify-center"
              style={{ backgroundColor: activeTheme[250] }}
            >
              <Text className="text-lg font-semibold" style={{ color: activeTheme[600] }}>
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={async () => {
                await bannerConfig.onConfirm();
                hideBanner();
              }}
              disabled={bannerConfig.isLoading}
              className="flex-1 h-14 rounded-xl items-center justify-center"
              style={{ backgroundColor: activeTheme[950] }}
            >
              {bannerConfig.isLoading ? (
                <ActivityIndicator color={activeTheme[100]} size="small" />
              ) : (
                <Text className="text-lg font-bold" style={{ color: activeTheme[100] }}>
                  Confirm
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(10, 10, 10, 0.4)', // استخدام درجة 950 مع شفافية
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  }
});

export default YesNoBanner;