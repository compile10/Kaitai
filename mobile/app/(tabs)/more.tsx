import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { authClient } from "@/lib/auth-client";

export default function MoreScreen() {
  const { data: session, isPending } = authClient.useSession();
  const tintColor = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");
  const borderColor = useThemeColor({}, "border");

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (isPending) {
    return (
      <ThemedView className="flex-1 items-center justify-center" edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  // Authenticated view
  if (session?.user) {
    const initial = (
      session.user.name?.[0] ??
      session.user.email[0] ??
      "?"
    ).toUpperCase();

    return (
      <ThemedView className="flex-1" edges={['top', 'left', 'right']}>
        {/* User profile header */}
        <View className="items-center pt-10 pb-6 px-5">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: tintColor }}
          >
            <ThemedText className="text-3xl font-bold text-white">
              {initial}
            </ThemedText>
          </View>
          <ThemedText type="subtitle">{session.user.name}</ThemedText>
          <ThemedText className="text-sm opacity-70 mt-1">
            {session.user.email}
          </ThemedText>
        </View>

        {/* Menu items */}
        <View className="px-5 mt-2">
          {/* Settings row */}
          <TouchableOpacity
            className="flex-row items-center py-4 border-b"
            style={{ borderBottomColor: borderColor }}
            onPress={() => router.push("/settings")}
            activeOpacity={0.6}
          >
            <Ionicons name="settings-outline" size={22} color={iconColor} />
            <ThemedText className="flex-1 ml-3 text-base">Settings</ThemedText>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity
            className="flex-row items-center py-4 mt-6"
            onPress={handleSignOut}
            activeOpacity={0.6}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <ThemedText className="ml-3 text-base text-red-500">
              Sign Out
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Unauthenticated view
  return (
    <ThemedView className="flex-1 items-center justify-center px-12" edges={['top', 'left', 'right']}>
      <Ionicons name="person-circle-outline" size={80} color={iconColor} />
      <ThemedText type="subtitle" className="mt-4 text-center">
        Welcome to Kaitai
      </ThemedText>
      <ThemedText className="text-sm opacity-70 mt-2 text-center">
        Sign in to access your account and sync your preferences.
      </ThemedText>

      <View className="w-full mt-8 gap-3">
        <TouchableOpacity
          className="w-full py-4 rounded-xl items-center"
          style={{ backgroundColor: tintColor }}
          onPress={() => router.push("/sign-in")}
          activeOpacity={0.7}
        >
          <ThemedText className="text-base font-semibold text-white">
            Sign In
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full py-4 rounded-xl items-center border-2"
          style={{ borderColor: tintColor }}
          onPress={() => router.push("/sign-up")}
          activeOpacity={0.7}
        >
          <ThemedText
            className="text-base font-semibold"
            style={{ color: tintColor }}
          >
            Create Account
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Settings shortcut even when not logged in */}
      <TouchableOpacity
        className="flex-row items-center mt-10"
        onPress={() => router.push("/settings")}
        activeOpacity={0.6}
      >
        <Ionicons name="settings-outline" size={18} color={iconColor} />
        <ThemedText className="ml-2 text-sm opacity-70">
          AI Provider Settings
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}
