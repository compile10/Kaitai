import { useEffect, type ReactNode } from "react";
import { View, Modal, Pressable, Dimensions } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { ThemedText } from "@/components/themed-text";
import { useRawCSSTheme } from "@/hooks/use-raw-css-theme";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const DISMISS_THRESHOLD = 100;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const bgColor = useRawCSSTheme("background");

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withTiming(0, { duration: 250 });
    }
  }, [visible, translateY]);

  const closeWithAnimation = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
      scheduleOnRN(onClose);
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          scheduleOnRN(onClose);
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeWithAnimation}
    >
      <GestureHandlerRootView className="flex-1">
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={closeWithAnimation}
        >
          <Pressable onPress={() => {}}>
            <Animated.View
              style={[{ backgroundColor: bgColor }, animatedStyle]}
              className="rounded-t-2xl pb-8 pt-4 px-2"
            >
              <GestureDetector gesture={panGesture}>
                <View className="w-full items-center pt-1 pb-3">
                  <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </View>
              </GestureDetector>
              <ThemedText type="subtitle" className="px-4 mb-3">
                {title}
              </ThemedText>
              {children}
            </Animated.View>
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
}
