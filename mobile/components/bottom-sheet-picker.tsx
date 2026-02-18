import { useState } from "react";
import { View, TouchableOpacity } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { ThemedText } from "@/components/themed-text";

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

export function BottomSheetPicker({
  title,
  options,
  selectedId,
  onSelect,
}: BottomSheetPickerProps) {
  const [visible, setVisible] = useState(false);

  const selectedLabel =
    options.find((o) => o.id === selectedId)?.label ?? title;

  const handleSelect = (id: string) => {
    onSelect(id);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center justify-between p-4 rounded-xl border-2 border-border bg-card"
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold">{selectedLabel}</ThemedText>
        <ThemedText className="text-sm opacity-50">▼</ThemedText>
      </TouchableOpacity>

      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title={title}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            className={`flex-row items-center px-4 py-3.5 mx-2 rounded-xl ${
              selectedId === option.id ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
            onPress={() => handleSelect(option.id)}
            activeOpacity={0.6}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                selectedId === option.id
                  ? "border-primary"
                  : "border-gray-400"
              }`}
            >
              {selectedId === option.id && (
                <View
                  className="w-2.5 h-2.5 rounded-full bg-primary"
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
      </BottomSheet>
    </>
  );
}
