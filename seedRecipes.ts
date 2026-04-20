import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

interface RecipeTemplate {
  id: string;
  name: string;
  emoji: string;
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredientNames: { name: string; quantity: string }[];
  directions: string[];
}

const RECIPE_TEMPLATES: RecipeTemplate[] = [
  {
    id: 'scrambled-eggs',
    name: 'Scrambled Eggs',
    emoji: '🍳',
    prepTime: '10 min',
    difficulty: 'Easy',
    ingredientNames: [
      { name: 'Eggs', quantity: '3' },
      { name: 'Olive Oil', quantity: '1 tbsp' },
      { name: 'Salt', quantity: 'pinch' },
      { name: 'Pepper', quantity: 'pinch' },
    ],
    directions: [
      'Crack eggs into a bowl and whisk until combined.',
      'Season with salt and pepper.',
      'Melt butter in a non-stick pan over medium-low heat.',
      'Pour in eggs and gently stir with a spatula.',
      'Remove from heat when eggs are just set but still slightly glossy.',
      'Serve immediately.',
    ],
  },
  {
    id: 'garlic-pasta',
    name: 'Garlic Butter Pasta',
    emoji: '🍝',
    prepTime: '20 min',
    difficulty: 'Easy',
    ingredientNames: [
      { name: 'Pasta Noodles', quantity: '200g' },
      { name: 'Garlic', quantity: '4 cloves' },
      { name: 'Unsalted Butter', quantity: '3 tbsp' },
      { name: 'Olive Oil', quantity: '2 tbsp' },
      { name: 'Parmesan Cheese', quantity: '1/4 cup' },
      { name: 'Parsley', quantity: 'handful' },
    ],
    directions: [
      'Cook pasta in salted boiling water until al dente. Reserve 1/2 cup pasta water.',
      'Mince garlic finely.',
      'Heat olive oil and butter in a large pan over medium heat.',
      'Add garlic and sauté 1–2 minutes until fragrant — do not brown.',
      'Add drained pasta and toss to coat. Splash in pasta water to loosen.',
      'Top with parmesan and parsley. Serve hot.',
    ],
  },
  {
    id: 'tomato-soup',
    name: 'Simple Tomato Soup',
    emoji: '🍅',
    prepTime: '25 min',
    difficulty: 'Easy',
    ingredientNames: [
      { name: 'Tomatoes', quantity: '6 large' },
      { name: 'Onion', quantity: '1 medium' },
      { name: 'Garlic', quantity: '3 cloves' },
      { name: 'Olive Oil', quantity: '2 tbsp' },
      { name: 'Basil', quantity: 'handful' },
    ],
    directions: [
      'Dice onion and mince garlic.',
      'Heat olive oil in a pot over medium heat. Sauté onion 5 min until soft.',
      'Add garlic and cook 1 more minute.',
      'Add chopped tomatoes and 2 cups of water. Bring to a boil.',
      'Reduce heat and simmer 15 minutes.',
      'Blend until smooth with an immersion blender.',
      'Season with salt, pepper, and fresh basil. Serve hot.',
    ],
  },
  {
    id: 'veggie-stir-fry',
    name: 'Veggie Stir Fry',
    emoji: '🥦',
    prepTime: '20 min',
    difficulty: 'Easy',
    ingredientNames: [
      { name: 'Broccoli', quantity: '1 head' },
      { name: 'Bell Pepper', quantity: '1' },
      { name: 'Carrot', quantity: '2' },
      { name: 'Garlic', quantity: '3 cloves' },
      { name: 'Soy Sauce', quantity: '3 tbsp' },
      { name: 'Sesame Oil', quantity: '1 tbsp' },
      { name: 'Rice', quantity: '1 cup cooked' },
    ],
    directions: [
      'Cook rice according to package instructions.',
      'Chop broccoli into florets, slice bell pepper and carrots thin.',
      'Heat sesame oil in a wok over high heat.',
      'Add minced garlic and stir 30 seconds.',
      'Add carrots and broccoli — stir fry 3–4 minutes.',
      'Add bell pepper and soy sauce — toss 2 more minutes.',
      'Serve over rice.',
    ],
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast',
    emoji: '🥑',
    prepTime: '10 min',
    difficulty: 'Easy',
    ingredientNames: [
      { name: 'Bread', quantity: '2 slices' },
      { name: 'Avocado', quantity: '1 ripe' },
      { name: 'Lemon', quantity: '1/2' },
      { name: 'Eggs', quantity: '2' },
    ],
    directions: [
      'Toast bread to your desired crispness.',
      'Scoop avocado flesh into a bowl and mash with lemon juice and salt.',
      'Spread avocado generously on toast.',
      'Top with a fried or poached egg.',
      'Finish with red pepper flakes if desired.',
    ],
  },
  {
    id: 'chicken-rice-bowl',
    name: 'Chicken & Rice Bowl',
    emoji: '🍚',
    prepTime: '30 min',
    difficulty: 'Medium',
    ingredientNames: [
      { name: 'Chicken', quantity: '2 pieces' },
      { name: 'Rice', quantity: '1 cup' },
      { name: 'Soy Sauce', quantity: '3 tbsp' },
      { name: 'Garlic', quantity: '3 cloves' },
      { name: 'Sesame Oil', quantity: '1 tbsp' },
      { name: 'Green Onion', quantity: '3 stalks' },
    ],
    directions: [
      'Cook rice according to package instructions.',
      'Slice chicken breast into thin strips.',
      'Mix soy sauce, sesame oil, and minced garlic into a marinade.',
      'Coat chicken and let sit 10 minutes.',
      'Cook chicken in a hot pan 5–6 minutes per side until done.',
      'Slice and serve over rice. Garnish with green onions.',
    ],
  },
  {
    id: 'banana-pancakes',
    name: 'Banana Pancakes',
    emoji: '🥞',
    prepTime: '15 min',
    difficulty: 'Easy',
    ingredientNames: [
      { name: 'Banana', quantity: '2 ripe' },
      { name: 'Eggs', quantity: '2' },
      { name: 'Flour', quantity: '1/2 cup' },
      { name: 'Choice of Milk', quantity: '1/4 cup' },
      { name: 'Unsalted Butter', quantity: '1 tbsp' },
    ],
    directions: [
      'Mash bananas in a large bowl until smooth.',
      'Whisk in eggs and milk.',
      'Fold in flour until just combined — lumps are okay.',
      'Melt butter in a non-stick pan over medium heat.',
      'Pour 1/4 cup batter per pancake. Flip when bubbles form (2–3 min).',
      'Cook another 1–2 minutes until golden. Serve with maple syrup.',
    ],
  },
  {
    id: 'lentil-soup',
    name: 'Lentil Soup',
    emoji: '🍲',
    prepTime: '35 min',
    difficulty: 'Medium',
    ingredientNames: [
      { name: 'Lentils', quantity: '1 cup' },
      { name: 'Onion', quantity: '1 large' },
      { name: 'Garlic', quantity: '3 cloves' },
      { name: 'Tomatoes', quantity: '2' },
      { name: 'Olive Oil', quantity: '2 tbsp' },
      { name: 'Lemon', quantity: '1/2' },
    ],
    directions: [
      'Rinse lentils under cold water until clear.',
      'Dice onion and mince garlic. Chop tomatoes.',
      'Heat olive oil in a pot. Sauté onion until golden (5 min).',
      'Add garlic, cumin, and turmeric — stir 1 minute.',
      'Add lentils, tomatoes, and 4 cups water. Bring to a boil.',
      'Simmer 20 minutes until lentils are soft.',
      'Partially blend for a creamy texture. Squeeze in lemon juice and serve.',
    ],
  },
];

export async function seedRecipes() {
  try {
    const existingSnap = await getDocs(collection(db, 'recipes'));
    if (!existingSnap.empty) {
      console.log('Recipes already seeded, skipping.');
      return;
    }

    // Build name -> docId map from your ingredients collection
    const ingredientSnap = await getDocs(collection(db, 'ingredients'));
    const nameToId: Record<string, string> = {};
    ingredientSnap.docs.forEach(d => {
      const data = d.data();
      if (data.name) {
        nameToId[data.name.toLowerCase()] = d.id;
      }
    });

    for (const template of RECIPE_TEMPLATES) {
      const ingredients = template.ingredientNames.map(ing => ({
        ingredientId: nameToId[ing.name.toLowerCase()] ?? null, // null if not in ingredients DB
        name: ing.name,     // kept as display fallback
        quantity: ing.quantity,
      }));

      await setDoc(doc(db, 'recipes', template.id), {
        name: template.name,
        emoji: template.emoji,
        prepTime: template.prepTime,
        difficulty: template.difficulty,
        ingredients,
        directions: template.directions,
      });
    }

    console.log(`Seeded ${RECIPE_TEMPLATES.length} recipes.`);
  } catch (error) {
    console.error('Error seeding recipes:', error);
  }
}