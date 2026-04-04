import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";

import { colors } from "./src/theme";
import { useAuthStore } from "./src/store";

import LoginScreen    from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import UploadScreen   from "./src/screens/UploadScreen";
import AnalysisScreen from "./src/screens/AnalysisScreen";
import ProfileScreen  from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const qc    = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: "⊞", Upload: "↑", Profile: "◉" };
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20, color: focused ? colors.primary : colors.textDim }}>{icons[label] || "●"}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.cardBorder, height: 72, paddingBottom: 12, paddingTop: 8 },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textDim,
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
    })}>
      <Tab.Screen name="Home"    component={DashboardScreen} />
      <Tab.Screen name="Upload"  component={UploadScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { token } = useAuthStore();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      {!token ? (
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main"     component={MainTabs} />
          <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ animation: "slide_from_right" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const hydrate = useAuthStore(s => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate().finally(() => setReady(true));
  }, []);

  if (!ready) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
