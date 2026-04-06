import { Text, View } from 'react-native';
import TabBar from '../components/TabBar';

interface Ingredient {
  id: string;
  name: string;
  image: string;
}

type UserData = {
  name: string;
  email: string;
  allergies: string[];
  profileComplete: boolean;
}

export default function RecipeScreen() {
  return (
    <View className="flex-1 bg-rose-50">
      <View className="flex-1 px-6 pt-16 items-center justify-center">
        <Text className="text-5xl mb-4">🍽️</Text>
        <Text className="text-2xl font-extrabold text-gray-800">Recipes</Text>
        <Text className="text-sm text-gray-500 mt-2">No recipes available right now.</Text>
      </View>
      <TabBar />
    </View>
  );
}