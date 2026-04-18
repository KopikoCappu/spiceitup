import TabBar from '@/components/TabBar';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RecipeFlipCard, { Recipe, RecipeFlipCardHandle } from '../components/RecipeCard';
import { auth, db } from '../firebaseConfig';
import { seedRecipes } from '../seedRecipes';

export default function RecipeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const cardRef = useRef<RecipeFlipCardHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Function to filter and rank recipes based on user preferences
  // Lauren's algorithm for filtering and ranking recipes
  const filterAndRankRecipes = (allRecipes: Recipe[], userData: any) => {
    const { allergies = [], liked = [], disliked = [], likedToday = [] } = userData;

    // create empty array
    const recipeRankings = Array(5).fill(null).map(() => ({ recipe: null as Recipe | null, rating: 0.0 }));

    // For now, just take the first 5 filtered recipes
    // You can add more sophisticated ranking based on preferences, difficulty, etc.
    for (const recipe of allRecipes) {
      let ranking = 0.0
      let hasAllergen = false
      let numIngredients = recipe?.ingredients?.length || 0
      for (const ingredient of recipe?.ingredients || []) {
        // Check ingredientId against allergies (assuming allergies contains ingredient IDs)
        if (allergies.includes(ingredient.ingredientId)) {
          hasAllergen = true
          break
        }
        else if (likedToday.includes(ingredient.ingredientId)) {
          ranking += (10 / numIngredients)
        }
        else if (liked.includes(ingredient.ingredientId)) {
          ranking += (5 / numIngredients)
        }
        else if (disliked.includes(ingredient.ingredientId)) {
          ranking -= (10 / numIngredients)
        }
      }
      
      if (hasAllergen) {
        ranking = -10
      }

      for (let i = 4; i >= 0; i--) {
        if (ranking >= recipeRankings[i].rating) {
          if (i < 4) {
            recipeRankings[i+1] = {recipe: recipeRankings[i].recipe, rating: recipeRankings[i].rating}
          }
          recipeRankings[i] = {recipe: recipe, rating: ranking}
        }
        else {
          break
        }
      }

    }
    // return recipes
    return recipeRankings.map(ranking => ranking.recipe).filter(recipe => recipe !== null) as Recipe[];
  };

  // seed recipes and then get all from database
  useEffect(() => {
    const setup = async () => {
      await seedRecipes();
      
      // Get all recipes
      const recipesSnapshot = await getDocs(collection(db, 'recipes'));
      const allRecipes = recipesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Recipe[];
      
      // Get user data
      const uid = auth.currentUser?.uid;
      let userData: { allergies: string[]; likedToday: string[]; liked: string[]; disliked: string[] } = { allergies: [], likedToday: [], liked: [], disliked: [] };
      if (uid) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const docData = userDoc.data();
          userData = {
            allergies: docData.allergies || [],
            likedToday: docData.likedToday || [],
            liked: docData.liked || [],
            disliked: docData.disliked || []
          };
        }
      }
      
      // Filter and rank recipes
      const filteredRecipes = filterAndRankRecipes(allRecipes, userData);
      
      setRecipes(filteredRecipes);
      setLoading(false);
    };
    setup();
  }, []);

  const handleChoice = (next: boolean) => {
    cardRef.current?.reset(); // flip to front when first shown

    setTimeout(() => {
      // scroll back to top so the card header is visible
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setIndex(prev => {
        if (next) {
          return Math.min(prev + 1, recipes.length);
        }
        if (prev === 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 400);
  };

  // while loading recipes display spinning circle
  if (loading) {
    return (
      <View className="flex-1 justify-center bg-rose-50">
        <ActivityIndicator size="large" color="#EF4444" /> 
      </View>
    );
  }

  return (
    <View className="flex-1 bg-rose-50">

      {/* scroll to reach buttons, prevent anything from being cutt off */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* header */}
        <View className="mb-8">
          <Text className="text-2xl font-extrabold text-gray-800">Recipes 🍽️</Text>
          <Text className="text-sm text-gray-500 mt-1">Tap a card to see directions</Text>
        </View>

        {/* group cards and buttons so they move together */}
        <View className="items-center w-4/5" style={{ alignSelf: 'center' }}>
        {/* check button increments index */}
          {index < recipes.length ? (
            <>
              <RecipeFlipCard ref={cardRef} recipe={recipes[index]} />

              {/* buttons */}
              <View className="flex-row gap-8 mt-8 mb-4">
                <TouchableOpacity
                  onPress={() => handleChoice(false)}
                  className="w-20 h-20 rounded-full bg-white shadow-lg justify-center items-center border border-red-100 active:scale-95"
                >
                  <Text className="text-black text-3xl">-</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleChoice(true)}
                  className="w-20 h-20 rounded-full bg-white shadow-lg justify-center items-center border border-teal-100 active:scale-95"
                >
                  <Text className="text-black text-3xl">R</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="items-center mt-20">
              <Text className="text-lg font-bold text-gray-700">All caught up! 🍽️</Text>
              <TouchableOpacity
                onPress={() => setIndex(0)}
                className="mt-6 bg-rose-500 px-8 py-3 rounded-full"
              >
                <Text className="text-white font-bold">Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}