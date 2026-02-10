import { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
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
import { useThemeColor } from "@/hooks/use-theme-color";

export interface PickerOption {
  id: string;
  label: string;
}

interface BottomSheetPickerProps {
  title: string;
  options: PickerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const DISMISS_THRESHOLD = 100;

export function BottomSheetPicker({
  title,
  options,
  selectedId,
  onSelect,
}: BottomSheetPickerProps) {
  const [visible, setVisible] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const tintColor = useThemeColor({}, "tint");
  const bgColor = useThemeColor({}, "background");

  const selectedLabel =
    options.find((o) => o.id === selectedId)?.label ?? title;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const open = () => {
    setVisible(true);
    translateY.value = SCREEN_HEIGHT;
    translateY.value = withTiming(0, { duration: 250 });
  };

  const closeWithAnimation = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
      scheduleOnRN(setVisible, false);
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow dragging downward
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        // Dragged past threshold — dismiss
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, () => {
          scheduleOnRN(setVisible, false);
        });
      } else {
        // Snap back to open position
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const handleSelect = (id: string) => {
    onSelect(id);
    closeWithAnimation();
  };

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center justify-between p-4 rounded-xl border-2 border-muted dark:border-mutedDark bg-card dark:bg-cardDark"
        onPress={open}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold">{selectedLabel}</ThemedText>
        <ThemedText className="text-sm opacity-50">▼</ThemedText>
      </TouchableOpacity>

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
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className={`flex-row items-center px-4 py-3.5 mx-2 rounded-xl ${
                    selectedId === option.id
                      ? "bg-gray-100 dark:bg-gray-800"
                      : ""
                  }`}
                  onPress={() => handleSelect(option.id)}
                  activeOpacity={0.6}
                >
                  <View
                    className="w-5 h-5 rounded-full border-2 items-center justify-center mr-3"
                    style={{
                      borderColor:
                        selectedId === option.id ? tintColor : "#9ca3af",
                    }}
                  >
                    {selectedId === option.id && (
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tintColor }}
                      />
                    )}
                  </View>
                  <ThemedText
                    type={
                      selectedId === option.id ? "defaultSemiBold" : "default"
                    }
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </Pressable>
        </Pressable>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}
