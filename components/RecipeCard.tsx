import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export interface RecipeIngredient {
  ingredientId: string | null;
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: RecipeIngredient[];
  directions: string[];
}

export interface RecipeFlipCardHandle {
  reset: () => void;
}

interface RecipeFlipCardProps {
  recipe: Recipe;
  // called whenever the active face changes height
  // RecipeScreen uses this to know how tall the card actually is
  onHeightChange?: (height: number) => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: '#0d9488',
  Medium: '#d97706',
  Hard: '#ef4444',
};

const RecipeCard = forwardRef<RecipeFlipCardHandle, RecipeFlipCardProps>(
  ({ recipe, onHeightChange }, ref) => {
    const [flipped, setFlipped] = useState(false);

    // measured pixel heights of each face, set once they render
    const [frontHeight, setFrontHeight] = useState(0);
    const [backHeight, setBackHeight] = useState(0);

    const flipAnim = useRef(new Animated.Value(0)).current;

    const frontRotate = flipAnim.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });
    const backRotate = flipAnim.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });

    const flipTo = (toBack: boolean) => {
      Animated.spring(flipAnim, {
        toValue: toBack ? 180 : 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setFlipped(toBack);

      // tell the parent which height is now active so it can reposition buttons
      if (onHeightChange) {
        onHeightChange(toBack ? backHeight : frontHeight);
      }
    };

    useImperativeHandle(ref, () => ({
      reset: () => flipTo(false),
    }));

    // the container height is whichever face is currently active
    // this is what physically pushes the buttons down in the parent ScrollView
    const containerHeight = flipped
      ? backHeight || frontHeight   // fall back to frontHeight until back is measured
      : frontHeight;

    return (
      <TouchableOpacity
        onPress={() => flipTo(!flipped)}
        activeOpacity={1}
        // explicit height drives the layout — buttons always sit below this
        style={{ width: '100%', height: containerHeight || undefined }}
      >

        {/* ── FRONT FACE ─────────────────────────────────────────
            onLayout fires once after render and gives us the natural
            height of the front face content. We store it so the
            container knows how tall to be when showing the front. */}
        <Animated.View
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== frontHeight) {
              setFrontHeight(h);
              // if front is currently showing, update container too
              if (!flipped && onHeightChange) onHeightChange(h);
            }
          }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            transform: [{ rotateY: frontRotate }],
            backfaceVisibility: 'hidden',

            // ── front card appearance ──
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: '#ffe4e6',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            alignItems: 'center',
          }}
        >
          {/* ── EMOJI — change fontSize to resize */}
          <Text style={{ fontSize: 72, marginBottom: 16 }}>
            {recipe.emoji}
          </Text>

          {/* ── RECIPE NAME ── */}
          <Text style={{
            fontSize: 22, fontWeight: '800',
            color: '#1f2937', textAlign: 'center', marginBottom: 8,
          }}>
            {recipe.name}
          </Text>

          {/* ── PREP TIME + DIFFICULTY PILLS ── */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {/* prep time — change backgroundColor to recolor */}
            <View style={{
              backgroundColor: '#fff1f2', paddingHorizontal: 12,
              paddingVertical: 4, borderRadius: 20,
            }}>
              <Text style={{ color: '#9ca3af', fontSize: 12, fontWeight: '500' }}>
                ⏱ {recipe.prepTime}
              </Text>
            </View>
            {/* difficulty — color from DIFFICULTY_COLOR map at top */}
            <View style={{
              backgroundColor: '#f0fdf4', paddingHorizontal: 12,
              paddingVertical: 4, borderRadius: 20,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: DIFFICULTY_COLOR[recipe.difficulty] }}>
                {recipe.difficulty}
              </Text>
            </View>
          </View>

          {/* ── INGREDIENT PILLS ──
              slice(0, 4) = first 4 shown. change 4 to show more/fewer.
              To show quantity too: replace {ing.name} with {ing.name} · {ing.quantity} */}
          <View style={{
            flexDirection: 'row', flexWrap: 'wrap',
            justifyContent: 'center', gap: 6, marginBottom: 24,
          }}>
            {recipe.ingredients.slice(0, 4).map((ing, i) => (
              <View key={i} style={{
                backgroundColor: '#fef2f2', paddingHorizontal: 10,
                paddingVertical: 4, borderRadius: 20,
                borderWidth: 1, borderColor: '#fecaca',
              }}>
                <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600' }}>
                  {ing.name}
                </Text>
              </View>
            ))}
            {recipe.ingredients.length > 4 && (
              <View style={{
                backgroundColor: '#f9fafb', paddingHorizontal: 10,
                paddingVertical: 4, borderRadius: 20,
              }}>
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                  +{recipe.ingredients.length - 4} more
                </Text>
              </View>
            )}
          </View>

          {/* ── TAP HINT — delete this block to remove it ── */}
          <Text style={{ color: '#d1d5db', fontSize: 12 }}>
            Tap to see directions
          </Text>
        </Animated.View>

        {/* ── BACK FACE ───────────────────────────────────────────
            onLayout measures the full height of all directions content.
            We store backHeight so the container can match it when flipped.
            No maxHeight here — let content be its full natural height so
            the measurement is accurate and buttons land below it. */}
        <Animated.View
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== backHeight) {
              setBackHeight(h);
              // if back is currently showing, update container immediately
              if (flipped && onHeightChange) onHeightChange(h);
            }
          }}
          pointerEvents={flipped ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            transform: [{ rotateY: backRotate }],
            backfaceVisibility: 'hidden',

            // ── back card appearance ──
            backgroundColor: '#fff1f2',
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: '#fecaca',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          {/* ── DIRECTIONS HEADER ── */}
          <Text style={{
            fontSize: 16, fontWeight: '800',
            color: '#1f2937', marginBottom: 14,
          }}>
            📋 Directions
          </Text>

          {/* ── STEPS — rendered as plain Views, not ScrollView.
              Since the outer screen ScrollView handles scrolling,
              we let the steps render at full height so onLayout
              measures the true total height and buttons land below. */}
          {recipe.directions.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 12 }}>
              {/* step number circle — change backgroundColor to recolor */}
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: '#ef4444',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 10, marginTop: 1, flexShrink: 0,
              }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>
                  {i + 1}
                </Text>
              </View>
              {/* step text — increase fontSize/lineHeight for readability */}
              <Text style={{
                color: '#374151', fontSize: 13,
                lineHeight: 20, flex: 1,
              }}>
                {step}
              </Text>
            </View>
          ))}

          {/* ── BACK HINT — delete this block to remove it ── */}
          <Text style={{ color: '#d1d5db', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
            Tap to go back
          </Text>
        </Animated.View>

      </TouchableOpacity>
    );
  }
);

export default RecipeCard;