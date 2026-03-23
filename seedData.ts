import { addDoc, collection, getDocs, limit, query } from "firebase/firestore";
import { db } from "./firebaseConfig";

const ingredients = [
  { name: "Tomato", image: "🍅", category: "Vegetable" },
  { name: "Chicken Breast", image: "🍗", category: "Protein" },
  { name: "Avocado", image: "🥑", category: "Fat" },
  { name: "Pasta", image: "🍝", category: "Carb" },
  { name: "Spinach", image: "🍃", category: "Vegetable" },
  { name: "Cheese", image: "🧀", category: "Dairy" },
];




export const seedIngredients = async () => {
  const colRef = collection(db, "ingredients");
  
  // Check if we already have data so we don't duplicate
  const snapshot = await getDocs(query(colRef, limit(1)));
  if (!snapshot.empty) {
    console.log("Ingredients already seeded!");
    return;
  }

  for (const item of ingredients) {
    await addDoc(colRef, item);
  }
  console.log("Database seeded successfully! 🎉");
};