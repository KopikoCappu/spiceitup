import AsyncStorage from '@react-native-async-storage/async-storage';

export type GeneratedRecipe = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  time: string;
  difficulty: string;
};

const STORAGE_KEY = 'generatedRecipe';

let _recipe: GeneratedRecipe | null = null;

export const recipeStore = {
  get: async (): Promise<GeneratedRecipe | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Failed to load recipe:', e);
      return null;
    }
  },
  set: async (r: GeneratedRecipe | null): Promise<void> => {
    try {
      if (r === null) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        const jsonValue = JSON.stringify(r);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      }
    } catch (e) {
      console.error('Failed to save recipe:', e);
    }
  },
};