import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../AuthContext';
import RecipeFlipCard, { Recipe, RecipeFlipCardHandle } from '../components/RecipeCard';
import TabBar from '../components/TabBar';

import { auth, db } from '../firebaseConfig';
import { GeneratedRecipe, recipeStore } from '../recipeStore';
import { seedRecipes } from '../seedRecipes';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const filterAndRankRecipes = (allRecipes: Recipe[], userData: any) => {
  const { allergies = [], liked = [], disliked = [], likedToday = [] } = userData;
  const recipeRankings = Array(5).fill(null).map(() => ({ recipe: null as Recipe | null, rating: 0.0 }));

  for (const recipe of allRecipes) {
    let ranking = 0.0;
    let hasAllergen = false;
    const numIngredients = recipe?.ingredients?.length || 0;

    for (const ingredient of recipe?.ingredients || []) {
      if (allergies.includes(ingredient.ingredientId)) { hasAllergen = true; break; }
      else if (likedToday.includes(ingredient.ingredientId)) ranking += (10 / numIngredients);
      else if (liked.includes(ingredient.ingredientId)) ranking += (5 / numIngredients);
      else if (disliked.includes(ingredient.ingredientId)) ranking -= (10 / numIngredients);
    }
    if (hasAllergen) ranking = -10;

    for (let i = 4; i >= 0; i--) {
      if (ranking >= recipeRankings[i].rating) {
        if (i < 4) recipeRankings[i + 1] = { recipe: recipeRankings[i].recipe, rating: recipeRankings[i].rating };
        recipeRankings[i] = { recipe, rating: ranking };
      } else break;
    }
  }
  return recipeRankings.map(r => r.recipe).filter(r => r !== null) as Recipe[];
};

export default function RecipeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [index, setIndex] = useState(0);

  const cardRef = useRef<RecipeFlipCardHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { user } = useAuth();
  const [likedToday, setLikedToday] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [generating, setGenerating] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!user) { setFetchingUser(false); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setLikedToday((data.likedIngredients || []).slice(0, 20));
        setAllergies(data.allergies || []);
      }
      setFetchingUser(false);
    });
  }, [user]);

  useEffect(() => { recipeStore.get().then(setGeneratedRecipe); }, []);

  useEffect(() => {
    const setup = async () => {
      await seedRecipes();
      const snap = await getDocs(collection(db, 'recipes'));
      const allRecipes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Recipe[];

      const uid = auth.currentUser?.uid;
      let userData = { allergies: [] as string[], likedToday: [] as string[], liked: [] as string[], disliked: [] as string[] };
      if (uid) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          userData = { allergies: d.allergies || [], likedToday: d.likedToday || [], liked: d.liked || [], disliked: d.disliked || [] };
        }
      }
      setRecipes(filterAndRankRecipes(allRecipes, userData));
      setLoadingRecipes(false);
    };
    setup();
  }, []);

  useEffect(() => {
    cardRef.current?.reset();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  const handleChoice = (next: boolean) => {
    setIndex(prev => {
      if (next) return Math.min(prev + 1, recipes.length);
      if (prev === 0) return 0;
      return prev - 1;
    });
  };

  const generateRecipe = async () => {
    if (likedToday.length === 0) {
      Alert.alert('No ingredients yet', 'Go swipe some ingredients on the home screen first!');
      return;
    }
    setGenerating(true);
    setGeneratedRecipe(null);

    const allergyNote = allergies.length > 0
      ? `The user is allergic to: ${allergies.join(', ')}. Do not include these.` : '';

    const prompt = `You are a creative chef. Based on these ingredients the user likes: ${likedToday.join(', ')}, create ONE recipe.
      ${allergyNote}
      Respond ONLY with a valid JSON object in this exact shape, no markdown, no explanation:
      { "title": "Recipe Name", "description": "One sentence description", "ingredients": ["1 cup flour"], "steps": ["Step 1"], "time": "30 minutes", "difficulty": "Easy" }`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
          }),
        }
      );
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed: GeneratedRecipe = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setGeneratedRecipe(parsed);
      await recipeStore.set(parsed);
    } catch {
      Alert.alert('Error', 'Failed to generate recipe. Try again.');
    }
    setGenerating(false);
  };

  if (loadingRecipes || fetchingUser) {
    return (
      <View className="flex-1 justify-center bg-rose-50">
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  const atStart = index === 0;
  const atEnd = index >= recipes.length;

  return (
    <View className="flex-1 bg-rose-50">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View className="mb-6">
          <Text className="text-2xl font-extrabold text-gray-800">Recipes 🍽️</Text>
          <Text className="text-sm text-gray-500 mt-1">Tap a card to see directions</Text>
        </View>

        {/* liked ingredients */}
        {likedToday.length > 0 ? (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Your liked ingredients</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {likedToday.map(item => (
                  <View key={item} className="bg-rose-100 px-3 py-1 rounded-full">
                    <Text className="text-rose-600 font-semibold text-sm">{item}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6 items-center">
            <Text className="text-4xl mb-3">🥄</Text>
            <Text className="text-gray-600 font-semibold text-center">No liked ingredients yet</Text>
            <Text className="text-gray-400 text-sm text-center mt-1">Swipe on the home screen to build your list</Text>
          </View>
        )}

        {/* recipe swiper */}
        <View className="mb-8">
          {!atEnd ? (
            <>
              <RecipeFlipCard ref={cardRef} recipe={recipes[index]} onHeightChange={setCardHeight} />

              {/* arrow buttons sit below the card, centered */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 20 }}>
                {/* left arrow */}
                <TouchableOpacity
                  onPress={() => handleChoice(false)}
                  disabled={atStart}
                  style={{
                    opacity: atStart ? 0.2 : 1,
                    padding: 8,
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {/* chevron left — two lines forming < */}
                  <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{
                      width: 12, height: 12,
                      borderLeftWidth: 2.5,
                      borderBottomWidth: 2.5,
                      borderColor: '#9ca3af',
                      transform: [{ rotate: '45deg' }],
                      marginLeft: 4,
                    }} />
                  </View>
                </TouchableOpacity>

                {/* counter */}
                <Text style={{ fontSize: 13, color: '#9ca3af', fontWeight: '600' }}>
                  {index + 1} / {recipes.length}
                </Text>

                {/* right arrow */}
                <TouchableOpacity
                  onPress={() => handleChoice(true)}
                  style={{ padding: 8 }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{
                      width: 12, height: 12,
                      borderRightWidth: 2.5,
                      borderTopWidth: 2.5,
                      borderColor: '#ef4444',
                      transform: [{ rotate: '45deg' }],
                      marginRight: 4,
                    }} />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="items-center mt-8">
              <Text className="text-lg font-bold text-gray-700">All caught up! 🍽️</Text>
              <TouchableOpacity onPress={() => setIndex(0)} className="mt-6 bg-rose-500 px-8 py-3 rounded-full">
                <Text className="text-white font-bold">Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* generate button */}
        <TouchableOpacity
          onPress={generateRecipe}
          disabled={generating || likedToday.length === 0}
          className={`py-4 rounded-2xl items-center mb-8 ${likedToday.length === 0 ? 'bg-gray-200' : 'bg-rose-500'}`}
          style={{ opacity: generating ? 0.7 : 1 }}
        >
          {generating ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold text-base ml-2">Cooking up a recipe...</Text>
            </View>
          ) : (
            <Text className={`font-bold text-base ${likedToday.length === 0 ? 'text-gray-400' : 'text-white'}`}>
              ✨ Generate Recipe
            </Text>
          )}
        </TouchableOpacity>

        {/* generated recipe card */}
        {generatedRecipe && (
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <View className="bg-rose-500 px-5 py-5">
              <Text className="text-white text-2xl font-black">{generatedRecipe.title}</Text>
              <Text className="text-rose-100 text-sm mt-1">{generatedRecipe.description}</Text>
              <View className="flex-row gap-4 mt-3">
                <View className="flex-row items-center gap-1">
                  <Text className="text-rose-200 text-xs">⏱</Text>
                  <Text className="text-white text-xs font-semibold">{generatedRecipe.time}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-rose-200 text-xs">📊</Text>
                  <Text className="text-white text-xs font-semibold">{generatedRecipe.difficulty}</Text>
                </View>
              </View>
            </View>
            <View className="p-5">
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Ingredients</Text>
              {generatedRecipe.ingredients.map((ing, i) => (
                <View key={i} className="flex-row items-start mb-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 mr-3" />
                  <Text className="text-gray-700 flex-1">{ing}</Text>
                </View>
              ))}
              <View className="h-px bg-gray-100 my-4" />
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Instructions</Text>
              {generatedRecipe.steps.map((step, i) => (
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