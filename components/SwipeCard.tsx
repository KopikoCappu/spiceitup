import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface Ingredient {
  id: string;
  name: string;
  image: string;
}

interface SwipeCardProps {
  ingredient: Ingredient;
  onSwipe: (liked: boolean) => void;
}

export default function SwipeCard({ ingredient, onSwipe }: SwipeCardProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
  }, [ingredient.id]);

  const gesture = Gesture.Pan()
    .onChange((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 100) {
        translateX.value = withSpring(e.translationX > 0 ? 500 : -500);
        runOnJS(onSwipe)(e.translationX > 0);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value }, 
      { rotate: `${translateX.value / 20}deg` }
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width: '100%' }, animatedStyle]}>
        <View className="bg-white rounded-3xl p-8 items-center shadow-xl border border-rose-100">
          <Text className="text-8xl mb-4">{ingredient.image}</Text>
          <Text className="text-3xl font-bold text-gray-800">{ingredient.name}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}