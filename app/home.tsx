import SwipeCard from '@/components/SwipeCard';
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { db } from '../firebaseConfig';
import { seedIngredients } from '../seedData';


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

export default function HomeScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      }
    };
    if (user) fetchUser();
  }, [user]);

  // 1. Seed and Fetch Data
  useEffect(() => {
    const setupData = async () => {
      await seedIngredients(); 
      const querySnapshot = await getDocs(collection(db, "ingredients"));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ingredient[];
      setIngredients(items);
      setLoading(false);
    };
    setupData();
  }, []);

  const handleChoice = async (liked: boolean) => {
    if (!user || !ingredients[currentIndex]) return;

    const ingredient = ingredients[currentIndex];
    const userPrefsRef = doc(db, "users", user.uid);

    try {
      if (liked) {
        // Add to likes, remove from dislikes (if it was there)
        await setDoc(userPrefsRef, {
          likedIngredients: arrayUnion(ingredient.id),
          dislikedIngredients: arrayRemove(ingredient.id)
        }, { merge: true });
      } else {
        // Add to dislikes, remove from likes (if it was there)
        await setDoc(userPrefsRef, {
          dislikedIngredients: arrayUnion(ingredient.id),
          likedIngredients: arrayRemove(ingredient.id)
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving preference: ", error);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 200);
  };

  if (loading) return <View className="flex-1 justify-center"><ActivityIndicator size="large" color="#EF4444" /></View>;

  const firstName = (userData?.name || '').split(' ')[0] || 'Chef';

  return (
    <View className="flex-1 bg-rose-50 px-6 pt-16 items-center">
      <View className="self-start mb-8">
        <Text className="text-2xl font-extrabold text-gray-800">Hey, {firstName}! 👋</Text>
        <Text className="text-sm text-gray-500 mt-1">What's going in the pot today?</Text>
      </View>

      <View className="w-full h-3/5 items-center justify-center">
        {currentIndex < ingredients.length ? (
          <SwipeCard 
            ingredient={ingredients[currentIndex]} 
            onSwipe={(liked) => handleChoice(liked)} 
          />
        ) : (
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-700">All caught up! 🥗</Text>
            <TouchableOpacity 
              onPress={() => setCurrentIndex(0)} 
              className="mt-6 bg-rose-500 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-bold">Restart Deck</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Manual Action Buttons */}
      <View className="flex-row gap-8 mt-10">
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
    </View>
  );
}
