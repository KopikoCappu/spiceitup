import { usePathname, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

const TABS = [
  { path: '/home',    label: 'Home',    icon: '🏠' },
  { path: '/recipes',  label: 'Recipes', icon: '🍽️' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="flex-row bg-white border-t border-gray-100 pb-6 pt-3 px-6 shadow-lg">
      {TABS.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.path}
            onPress={() => router.push(tab.path as any)}
            className="flex-1 items-center gap-1"
          >
            <View className={`px-4 py-1 rounded-full ${isActive ? 'bg-rose-100' : 'bg-transparent'}`}>
              <Text className="text-2xl">{tab.icon}</Text>
            </View>
            <Text className={`text-xs font-semibold ${isActive ? 'text-rose-500' : 'text-gray-400'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}