import TabBar from '@/components/TabBar';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RecipeFlipCard, { Recipe, RecipeFlipCardHandle } from '../components/RecipeCard';
import { db } from '../firebaseConfig';
import { seedRecipes } from '../seedRecipes';

export default function RecipeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const cardRef = useRef<RecipeFlipCardHandle>(null);

  // ref to the ScrollView so we can scroll back to top when card advances
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const setup = async () => {
      await seedRecipes();
      const snapshot = await getDocs(collection(db, 'recipes'));
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Recipe[];
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      setRecipes(items);
      setLoading(false);
    };
    setup();
  }, []);

  const handleChoice = (liked: boolean) => {
    // flip card back to front face
    cardRef.current?.reset();

    setTimeout(() => {
      // scroll back to top so next card header is visible
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setIndex(prev => prev + 1);
    }, 400);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center bg-rose-50">
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  return (
    // flex-1 + bg on outer View keeps TabBar pinned at bottom always
    <View className="flex-1 bg-rose-50">

      {/* ScrollView fills the space above TabBar.
          When the flipped card pushes content down, the user can
          scroll to reach the buttons. contentContainerStyle grows
          to fit all content rather than clipping it. */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        // nestedScrollEnabled lets the card's inner ScrollView
        // (directions list) scroll independently from this outer one
        nestedScrollEnabled={true}
      >
        {/* ── HEADER ── same style as HomeScreen */}
        <View className="mb-8">
          <Text className="text-2xl font-extrabold text-gray-800">Recipes 🍽️</Text>
          <Text className="text-sm text-gray-500 mt-1">Tap a card to see directions</Text>
        </View>

        {/* ── CARD + BUTTONS ── grouped in one block so buttons
            always sit directly below the card, whether it's
            the short front face or the taller directions back face */}
        <View className="items-center w-4/5" style={{ alignSelf: 'center' }}>
          {index < recipes.length ? (
            <>
              <RecipeFlipCard ref={cardRef} recipe={recipes[index]} />

              {/* Buttons sit here, directly under the card.
                  marginTop gives a fixed gap between card bottom and buttons.
                  They scroll with the card naturally — no absolute positioning. */}
              <View className="flex-row gap-8 mt-8 mb-4">
                <TouchableOpacity
                  onPress={() => handleChoice(false)}
                  className="w-20 h-20 rounded-full bg-white shadow-lg justify-center items-center border border-red-100 active:scale-95"
                >
                  <Text className="text-red-500 text-3xl font-bold">✕</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleChoice(true)}
                  className="w-20 h-20 rounded-full bg-white shadow-lg justify-center items-center border border-teal-100 active:scale-95"
                >
                  <Text className="text-teal-500 text-3xl font-bold">✔</Text>
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

      {/* TabBar stays pinned outside the ScrollView so it never scrolls away */}
      <TabBar />
    </View>
  );
}