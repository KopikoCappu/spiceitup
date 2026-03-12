import { useRouter } from 'expo-router';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

type Ingredient = {
        id: string;
        category: string;
        image: string;
        name: string;
    }

export default function AllergySetup() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    // const [collapsed, setCollapsed] = useState<string[]>([]);
    const router = useRouter();
    
    // get all ingredients
    useEffect(() => {
        const fetchIngredients = async () => {
            const snapshot = await getDocs(collection(db, 'ingredients'));
            const list = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() as Omit<Ingredient, 'id'>  // ← tell TypeScript what doc.data() contains
            }));
            // const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIngredients(list);
        };
        fetchIngredients();
    }, []);

    const toggleIngredient = (id: string) => {
        setSelected(prev =>
            prev.includes(id) // if prev list includes item
            ? prev.filter(x => x !== id)  // true (selected) → remove it
            : [...prev, id]                // false (not selected) → add it
        );
    };


    const handleFinish = async () => {
        const uid = auth.currentUser?.uid;

        await setDoc(doc(db, "users", uid!), {
            allergies: selected,
        }, { merge: true });

        router.replace('/home')
    }

    return (
        <View className="flex-1 justify-center p-8 pt-20 bg-white">
            <Text className="text-3xl font-black text-red-500 mb-2">
                Any Allergies? 🚫
            </Text>
            <Text className="text-gray-400 mb-6">
                Select ingredients to avoid — we'll filter them out
            </Text>

            {/* display and choose allergies */}
            <FlatList 
                data={ingredients}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => toggleIngredient(item.id)}
                    className={`p-4 mb-2 rounded-xl border-2 ${
                    selected.includes(item.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                    }`}
                >
                    <Text>{item.name}</Text>
                </TouchableOpacity>
                )}
            />


            <TouchableOpacity
                className="bg-red-500 p-4 rounded-xl mt-4"
                onPress={handleFinish}
            >
                <Text className="text-white text-center font-bold text-lg">
                {selected.length === 0 ? 'No Allergies, Continue' : `Save ${selected.length} Allergies`}
                </Text>
            </TouchableOpacity>
        </View>
    )
}

