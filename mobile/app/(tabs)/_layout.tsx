import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";

const { colors: Colors } = require("@common/tailwind.config");

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].primary,
        tabBarInactiveTintColor: Colors[colorScheme]["muted-foreground"],
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopColor: Colors[colorScheme].border,
          height: 70,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerTintColor: Colors[colorScheme].foreground,
        tabBarShowLabel: true,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
