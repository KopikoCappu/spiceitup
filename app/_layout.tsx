import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from "../AuthContext";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* By leaving screenOptions here, it applies to all screens.
            We don't need to list index, home, or modal manually! 
        */}
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}