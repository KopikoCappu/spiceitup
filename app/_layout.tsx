import { Stack, router } from "expo-router";
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from "../AuthContext";
import "../global.css";

export default function RootLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // wait until Firebase responds

    if (user) {
      router.replace('/home');  // logged in → go to home
    } else {
      router.replace('/');        // not logged in → go to login
    }
  }, [user, loading]);

    return (
    <AuthProvider>
      <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="allergy" options={{ animation: 'none' }} />
          <Stack.Screen name="home" options={{ animation: 'none' }} />
        </Stack>
      </GestureHandlerRootView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}