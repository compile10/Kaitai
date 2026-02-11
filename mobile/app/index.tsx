import { TextInput, View, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import Logo from "@common/assets/branding/logo.svg";
import { BottomSheet } from "@/components/bottom-sheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

const EXAMPLE_SENTENCES = [
  "私は美しい花を見ました。",
  "猫が静かに部屋に入った。",
  "彼女は新しい本を読んでいる。",
];

function navigateToImageResults(asset: ImagePicker.ImagePickerAsset) {
  const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "image.jpg";
  const mimeType = asset.mimeType ?? "image/jpeg";

  router.push({
    pathname: "/results",
    params: {
      imageUri: asset.uri,
      imageMimeType: mimeType,
      imageFileName: fileName,
    },
  });
}

export default function HomeScreen() {
  const [searchValue, setSearchValue] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const iconColor = useThemeColor({}, "icon");

  const handleSearch = () => {
    if (searchValue.trim()) {
      router.push({
        pathname: "/results",
        params: { sentence: searchValue.trim() },
      });
    }
  };

  const handleCamera = async () => {
    setSheetVisible(false);

    const permissionResult =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to photograph Japanese text for analysis.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    navigateToImageResults(result.assets[0]);
  };

  const handleGallery = async () => {
    setSheetVisible(false);

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to analyze images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    navigateToImageResults(result.assets[0]);
  };

  return (
    <ThemedView className="flex-1 items-center px-5">
      {/* Settings Button */}
      <TouchableOpacity
        className="absolute top-12 right-5 p-2 z-10"
        onPress={() => router.push("/settings" as Href)}
        accessibilityLabel="Settings"
      >
        <Ionicons name="settings-outline" size={24} color={iconColor} />
      </TouchableOpacity>

      <View className="flex-[2]" />
      <Logo width={260} height={66} />
      <ThemedText type="subtitle" className="text-center mt-2">
        Understand Japanese sentences using AI.
      </ThemedText>
      <View className="mt-5 w-[80%] flex-row items-stretch gap-2 h-11">
        <TextInput
          value={searchValue}
          className="flex-1 h-full px-3 border border-gray-500 rounded-md text-gray-900 dark:text-gray-100 bg-transparent"
          onChangeText={setSearchValue}
          placeholder="Insert the sentence..."
          placeholderTextColor="#687076"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          className="w-11 h-11 rounded-md border border-gray-500 items-center justify-center"
          onPress={() => setSheetVisible(true)}
          accessibilityLabel="Add image"
        >
          <Ionicons name="add" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Example Sentences */}
      <View className="mt-6 w-full items-center">
        <ThemedText className="text-sm opacity-70 mb-3">
          Try these examples:
        </ThemedText>
        <View className="flex-row flex-wrap justify-center gap-2 px-2.5">
          {EXAMPLE_SENTENCES.map((sentence, index) => (
            <TouchableOpacity
              key={index}
              className="px-3 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700"
              onPress={() =>
                router.push({ pathname: "/results", params: { sentence } })
              }
            >
              <ThemedText className="text-sm text-gray-800 dark:text-gray-200">
                {sentence}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-[2]" />

      {/* Image Source Action Sheet */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Add Image"
      >
        <TouchableOpacity
          className="flex-row items-center px-4 py-3.5 mx-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-800"
          onPress={handleCamera}
          activeOpacity={0.6}
        >
          <Ionicons name="camera-outline" size={22} color={iconColor} />
          <ThemedText className="ml-3 text-base">Take Photo</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3.5 mx-2 rounded-xl active:bg-gray-100 dark:active:bg-gray-800"
          onPress={handleGallery}
          activeOpacity={0.6}
        >
          <Ionicons name="images-outline" size={22} color={iconColor} />
          <ThemedText className="ml-3 text-base">Photo Library</ThemedText>
        </TouchableOpacity>
      </BottomSheet>
    </ThemedView>
  );
}
