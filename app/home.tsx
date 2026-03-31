import SwipeCard from '@/components/SwipeCard';
import TabBar from '@/components/TabBar';
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
  const [ingredientGroups, setIngredientGroups] = useState<Ingredient[][]>([]);
  const [loading, setLoading] = useState(true);
  const [groupIndex, setGroupIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);

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

      //shuffles the ingredients
      const shuffled = [...items];
      for (let i = 0; i < shuffled.length; i++) {
        const randNum = Math.floor(Math.random() * shuffled.length);
        const temp = shuffled[i];
        shuffled[i] = shuffled[randNum];
        shuffled[randNum] = temp;
      }

      //groups the ingredients
      const groups: Ingredient[][] = [];
      const groupSize = 15;

      for (let i = 0; i < shuffled.length; i += groupSize) {
        groups.push(shuffled.slice(i, i + groupSize));
      }

      setIngredientGroups(groups);
      setLoading(false);
    };
    setupData();
  }, []);

  const handleChoice = async (liked: boolean) => {
    if (!user || !ingredientGroups[groupIndex][itemIndex]) return;

    const ingredient = ingredientGroups[groupIndex][itemIndex];
    const userPrefsRef = doc(db, "users", user.uid);

    try {
      if (liked) {
        // Add to likes, remove from dislikes (if it was there)
        await setDoc(userPrefsRef, {
          likedIngredients: arrayUnion(ingredient.name),
          dislikedIngredients: arrayRemove(ingredient.name)
        }, { merge: true });
      } else {
        // Add to dislikes, remove from likes (if it was there)
        await setDoc(userPrefsRef, {
          dislikedIngredients: arrayUnion(ingredient.name),
          likedIngredients: arrayRemove(ingredient.name)
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving preference: ", error);
    }

    setTimeout(() => {
      setItemIndex(prev => prev + 1);
    }, 200);
  };

  if (loading) return <View className="flex-1 justify-center"><ActivityIndicator size="large" color="#EF4444" /></View>;

  const firstName = (userData?.name || '').split(' ')[0] || 'Chef';

  return (
    <View className="flex-1 bg-rose-50">
      <View className="flex-1 px-6 pt-16 items-center">
      <View className="self-start mb-8">
        <Text className="text-2xl font-extrabold text-gray-800">Hey, {firstName}! 👋</Text>
        <Text className="text-sm text-gray-500 mt-1">What's going in the pot today?</Text>
      </View>

      <View className="w-4/5 items-center justify-center mt-20" style={{ alignSelf: 'center' }}>
        {itemIndex < ingredientGroups[groupIndex].length ? (
          <SwipeCard 
            ingredient={ingredientGroups[groupIndex][itemIndex]} 
            onSwipe={(liked) => handleChoice(liked)} 
          />
        ) : groupIndex == (ingredientGroups.length-1) ? (
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-700">All caught up! 🥗</Text>
            <TouchableOpacity 
              onPress={() => {
                setItemIndex(0);
                setGroupIndex(0);
              }} 
              className="mt-6 bg-rose-500 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-bold">Restart Deck</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-700">Done with the round! 🌶️</Text>
            <TouchableOpacity 
              onPress={() => {
                setItemIndex(0);
                setGroupIndex(prev => prev + 1);
              }}
              className="mt-6 bg-rose-500 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-bold">Continue Search</Text>
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
      {/* navigation bar between screens */}
      </View>
      <TabBar /> 
    </View>
  );
}