import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../AuthContext';
import TabBar from '../components/TabBar';
import { db } from '../firebaseConfig';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

type Recipe = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  time: string;
  difficulty: string;
};

export default function RecipeScreen() {
  const { user } = useAuth();
  const [likedToday, setLikedToday] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        // likedToday stores ingredient IDs — we need names
        // HomeScreen also writes likedIngredients so we use that for names
        const liked: string[] = data.likedIngredients || [];
        const todayIds: string[] = data.likedToday || [];
        // filter likedIngredients down to only ones liked today
        // since HomeScreen resets likedToday each session but keeps names in likedIngredients,
        // we fall back to all likedIngredients if likedToday is empty
        setLikedToday(liked.slice(0, 20)); // cap to avoid token bloat
        setAllergies(data.allergies || []);
      }
      setFetching(false);
    };
    fetchUserData();
  }, [user]);

  const generateRecipe = async () => {
    if (likedToday.length === 0) {
      Alert.alert('No ingredients yet', 'Go swipe some ingredients on the home screen first!');
      return;
    }

    setLoading(true);
    setRecipe(null);

    const allergyNote =
      allergies.length > 0
        ? `The user is allergic to: ${allergies.join(', ')}. Do not include these.`
        : '';

    const prompt = `You are a creative chef. Based on these ingredients the user likes: ${likedToday.join(', ')}, create ONE recipe.
${allergyNote}

Respond ONLY with a valid JSON object in this exact shape, no markdown, no explanation:
{
  "title": "Recipe Name",
  "description": "One sentence description",
  "ingredients": ["1 cup flour", "2 eggs"],
  "steps": ["Step 1 description", "Step 2 description"],
  "time": "30 minutes",
  "difficulty": "Easy"
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              temperature: 0.8, 
              maxOutputTokens: 4096,
              thinkingConfig: { thinkingBudget: 0 }
            },
          }),
        }
      );

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('RAW GEMINI RESPONSE:', JSON.stringify(data, null, 2));      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed: Recipe = JSON.parse(clean);
      setRecipe(parsed);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate recipe. Try again.');
    }

    setLoading(false);
  };

  if (fetching) {
    return (
      <View className="flex-1 justify-center bg-rose-50">
        <ActivityIndicator size="large" color="#F43F5E" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-rose-50">
      <ScrollView
        className="flex-1 px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-black text-gray-800">Recipes</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Based on what you liked today
          </Text>
        </View>

        {/* Liked ingredients preview */}
        {likedToday.length > 0 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">
              Your liked ingredients
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {likedToday.map((item) => (
                <View
                  key={item}
                  className="bg-rose-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-rose-600 font-semibold text-sm">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {likedToday.length === 0 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6 items-center">
            <Text className="text-4xl mb-3">🥄</Text>
            <Text className="text-gray-600 font-semibold text-center">
              No liked ingredients yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Swipe on the home screen to build your list
            </Text>
          </View>
        )}

        {/* Generate button */}
        <TouchableOpacity
          onPress={generateRecipe}
          disabled={loading || likedToday.length === 0}
          className={`py-4 rounded-2xl items-center mb-8 ${
            likedToday.length === 0 ? 'bg-gray-200' : 'bg-rose-500'
          }`}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold text-base ml-2">
                Cooking up a recipe...
              </Text>
            </View>
          ) : (
            <Text
              className={`font-bold text-base ${
                likedToday.length === 0 ? 'text-gray-400' : 'text-white'
              }`}
            >
              ✨ Generate Recipe
            </Text>
          )}
        </TouchableOpacity>

        {/* Recipe card */}
        {recipe && (
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            {/* Title band */}
            <View className="bg-rose-500 px-5 py-5">
              <Text className="text-white text-2xl font-black">{recipe.title}</Text>
              <Text className="text-rose-100 text-sm mt-1">{recipe.description}</Text>
              <View className="flex-row gap-4 mt-3">
                <View className="flex-row items-center gap-1">
                  <Text className="text-rose-200 text-xs">⏱</Text>
                  <Text className="text-white text-xs font-semibold">{recipe.time}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-rose-200 text-xs">📊</Text>
                  <Text className="text-white text-xs font-semibold">{recipe.difficulty}</Text>
                </View>
              </View>
            </View>

            <View className="p-5">
              {/* Ingredients */}
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">
                Ingredients
              </Text>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} className="flex-row items-start mb-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 mr-3" />
                  <Text className="text-gray-700 flex-1">{ing}</Text>
                </View>
              ))}

              <View className="h-px bg-gray-100 my-4" />

              {/* Steps */}
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">
                Instructions
              </Text>
              {recipe.steps.map((step, i) => (
                <View key={i} className="flex-row items-start mb-4">
                  <View className="w-6 h-6 rounded-full bg-rose-500 justify-center items-center mr-3 mt-0.5">
                    <Text className="text-white text-xs font-bold">{i + 1}</Text>
                  </View>
                  <Text className="text-gray-700 flex-1 leading-relaxed">{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      <TabBar />
    </View>
  );
}