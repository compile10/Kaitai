import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  useSettingsStore,
  PROVIDER_MAP,
  type Provider,
} from '@/stores/settings-store';

export default function SettingsScreen() {
  const {
    provider,
    model,
    useCustomModel,
    setProvider,
    setModel,
    setUseCustomModel,
    isHydrated,
  } = useSettingsStore();

  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const models = PROVIDER_MAP[provider]?.models ?? [];

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
  };

  const handleUseCustomModelChange = (value: boolean) => {
    setUseCustomModel(value);
    if (!value) {
      const isPreset = models.some((m) => m.id === model);
      if (!isPreset) {
        setModel(PROVIDER_MAP[provider]?.defaultModel ?? '');
      }
    }
  };

  if (!isHydrated) {
    return (
      <ThemedView className="flex-1">
        <ThemedText>Loading settings...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mb-6 mt-5">
          <ThemedText type="subtitle" className="mb-2">
            AI Provider
          </ThemedText>
          <ThemedText className="text-sm opacity-70 mb-4">
            Choose which AI provider to use for sentence analysis.
          </ThemedText>

          <View className="gap-2">
            {Object.values(PROVIDER_MAP).map((p) => (
              <TouchableOpacity
                key={p.id}
                className={`flex-row items-center p-4 rounded-xl border-2 ${
                  provider === p.id
                    ? 'bg-gray-100 dark:bg-gray-800 border-tint dark:border-tintDark'
                    : 'border-muted dark:border-mutedDark'
                }`}
                onPress={() => handleProviderChange(p.id)}
              >
                <View className="w-5 h-5 rounded-full border-2 border-gray-400 items-center justify-center">
                  {provider === p.id && (
                    <View className="w-2.5 h-2.5 rounded-full bg-tint dark:bg-tintDark" />
                  )}
                </View>
                <ThemedText className="ml-3">{p.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center">
            <View className="flex-1">
              <ThemedText type="defaultSemiBold">Use Custom Model</ThemedText>
              <ThemedText className="text-[13px] opacity-70 mt-1">
                Enter a specific model name instead of choosing from presets
              </ThemedText>
            </View>
            <Switch
              value={useCustomModel}
              onValueChange={handleUseCustomModelChange}
              trackColor={{ false: borderColor, true: tintColor }}
            />
          </View>
        </View>

        {useCustomModel ? (
          <View className="mb-6">
            <ThemedText type="subtitle" className="mb-2">
              Custom Model Name
            </ThemedText>
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder="e.g., claude-opus-4-5-20251101"
              placeholderTextColor="#9ca3af"
              className="p-4 rounded-xl border-2 border-muted dark:border-mutedDark bg-card dark:bg-cardDark text-base text-text dark:text-textDark"
            />
          </View>
        ) : (
          <View className="mb-6">
            <ThemedText type="subtitle" className="mb-2">
              Select Model
            </ThemedText>
            <ThemedText className="text-sm opacity-70 mb-4">
              Choose which model to use. Your preference will be saved locally.
            </ThemedText>

            <View className="gap-3">
              {models.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  className={`p-4 rounded-xl border-2 ${
                    model === m.id
                      ? 'bg-gray-100 dark:bg-gray-800 border-tint dark:border-tintDark'
                      : 'bg-transparent border-muted dark:border-mutedDark'
                  }`}
                  onPress={() => setModel(m.id)}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="w-5 h-5 rounded-full border-2 border-gray-400 items-center justify-center">
                      {model === m.id && (
                        <View className="w-2.5 h-2.5 rounded-full bg-tint dark:bg-tintDark" />
                      )}
                    </View>
                    <ThemedText type="defaultSemiBold" className="flex-1 ml-3">
                      {m.name}
                    </ThemedText>
                    {m.speed && (
                      <View className="px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700">
                        <ThemedText className="text-xs">{m.speed}</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText className="text-sm opacity-70 ml-8 mb-1">
                    {m.description}
                  </ThemedText>
                  {m.pricing && (
                    <ThemedText className="text-xs opacity-50 ml-8">
                      Pricing: {m.pricing}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
