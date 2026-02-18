import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { authClient } from "@/lib/auth-client";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message ?? "Failed to sign in");
      setIsLoading(false);
    } else {
      router.back();
    }
  };

  return (
    <ThemedView className="flex-1" edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerClassName="pt-8 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" className="mb-2">
            Welcome back
          </ThemedText>
          <ThemedText className="text-sm opacity-70 mb-8">
            Enter your credentials to access Kaitai.
          </ThemedText>

          {/* Email */}
          <View className="mb-5">
            <ThemedText type="defaultSemiBold" className="mb-2 text-sm">
              Email
            </ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="me@nihongo.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              className="p-4 rounded-xl border-2 border-border text-base text-foreground bg-transparent"
            />
          </View>

          {/* Password */}
          <View className="mb-5">
            <ThemedText type="defaultSemiBold" className="mb-2 text-sm">
              Password
            </ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoComplete="current-password"
              className="p-4 rounded-xl border-2 border-border text-base text-foreground bg-transparent"
            />
          </View>

          {/* Error */}
          {error && (
            <View className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <ThemedText className="text-sm text-red-600 dark:text-red-400">
                {error}
              </ThemedText>
            </View>
          )}

          {/* Sign In Button */}
          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center mt-2 bg-primary ${isLoading ? "opacity-60" : ""}`}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <ThemedText className="text-base font-semibold text-white">
              {isLoading ? "Signing in..." : "Sign In"}
            </ThemedText>
          </TouchableOpacity>

          {/* Link to sign up */}
          <View className="flex-row justify-center mt-6">
            <ThemedText className="text-sm opacity-70">
              Don&apos;t have an account?{" "}
            </ThemedText>
            <TouchableOpacity
              onPress={() => router.replace("/sign-up")}
              activeOpacity={0.6}
            >
              <ThemedText
                className="text-sm font-semibold text-primary"
              >
                Sign Up
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
