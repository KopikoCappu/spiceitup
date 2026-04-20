import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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

  const SWIPE_THRESHOLD = 120;

  useEffect(() => {
    translateX.value = 0;
  }, [ingredient.id]);

  const gesture = Gesture.Pan()
    .onChange((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(500, {
          damping: 15,
          stiffness: 120,
        });
        runOnJS(onSwipe)(true);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-500, {
          damping: 15,
          stiffness: 120,
        });
        runOnJS(onSwipe)(false);
      } else {
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 120,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = `${translateX.value / 20}deg`;
    const scale = 1; 

    return {
      transform: [
        { translateX: translateX.value },
        { rotateZ: rotate },
        { scale },
      ],
    };
  });

  // right swipe
  const keepStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 120], [0, 1]),
    transform: [{ scale: interpolate(translateX.value, [0, 120], [0.8, 1]) }],
  }));

  // left swipe 
  const removeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-120, 0], [1, 0]),
    transform: [{ scale: interpolate(translateX.value, [-120, 0], [1, 0.8]) }],
  }));

  // border color change
  const borderColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      translateX.value,
      [-150, 0, 150],
      ['#ef4444', '#ffe4e6', '#22c55e'] 
    );

    return {
      borderColor: color,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width: '100%' }, animatedStyle]}>
        <Animated.View
          className="bg-white rounded-3xl p-8 items-center shadow-xl border border-rose-100"
          style={[{ aspectRatio: 4 / 5, justifyContent: 'center' }, borderColorStyle]}
        >
          {/* keep - right card */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 20,
                left: 20,
                backgroundColor: '#22c55e',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              },
              keepStyle,
            ]}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>KEEP</Text>
          </Animated.View>

          {/* skip - left card */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 20,
                right: 20,
                backgroundColor: '#ef4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              },
              removeStyle,
            ]}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>SKIP</Text>
          </Animated.View>

          <Text className="text-8xl mb-4">{ingredient.image}</Text>
          <Text className="text-3xl font-bold text-gray-800">
            {ingredient.name}
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}