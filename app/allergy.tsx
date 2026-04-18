import { useRouter } from 'expo-router';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { seedIngredients } from '../seedData';

type Ingredient = {
    id: string;
    category: string;
    image: string;
    name: string;
};

export default function AllergySetup() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const totalIngredients = ingredients.length;
    const allSelected = selected.length === totalIngredients && totalIngredients > 0;

    useEffect(() => {
        const fetchIngredients = async () => {
            await seedIngredients();
            const snapshot = await getDocs(collection(db, 'ingredients'));
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<Ingredient, 'id'>,
            }));
            setIngredients(list);
            
            // start with all categories collapsed
            const categories = [...new Set(list.map(item => item.category))];
            const collapsedState: Record<string, boolean> = {};
            categories.forEach(cat => {
                collapsedState[cat] = true;
            });
            setCollapsed(collapsedState);
        };
        fetchIngredients();
    }, []);

    // Filter by search, then group by category
    const grouped = useMemo(() => {
        const filtered = ingredients.filter(i =>
            i.name.toLowerCase().includes(search.toLowerCase())
        );
        return filtered.reduce<Record<string, Ingredient[]>>((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});
    }, [ingredients, search]);

    const toggleIngredient = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleCategory = (category: string) => {
        setCollapsed(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const toggleSelectAll = (category: string) => {
        const ids = grouped[category].map(i => i.id);
        const allSelected = ids.every(id => selected.includes(id));
        if (allSelected) {
            // deselect all in this category
            setSelected(prev => prev.filter(id => !ids.includes(id)));
        } else {
            // select all missing ones
            setSelected(prev => [...new Set([...prev, ...ids])]);
        }
    };

    const handleFinish = async () => {
        const uid = auth.currentUser?.uid;
        await setDoc(doc(db, 'users', uid!), { allergies: selected }, { merge: true });
        router.replace('/home');
    };

    const categories = Object.keys(grouped).sort();

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-8 pt-20 pb-4">
                <Text className="text-3xl font-black text-red-500 mb-1">
                    Any Allergies? 🚫
                </Text>
                <Text className="text-gray-400 mb-4">
                    Select ingredients to avoid — we'll filter them out
                </Text>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2">
                    <Text className="text-gray-400 mr-2">🔍</Text>
                    <TextInput
                        className="flex-1 text-gray-800 text-base"
                        placeholder="Search ingredients..."
                        placeholderTextColor="#9ca3af"
                        value={search}
                        onChangeText={setSearch}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Text className="text-gray-400 text-lg">✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Grouped Ingredient List */}
            <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
                {categories.length === 0 ? (
                    <Text className="text-gray-400 text-center mt-8">No ingredients found</Text>
                ) : (
                    categories.map(category => {
                        const items = grouped[category];
                        const isCollapsed = collapsed[category] ?? false;
                        const allSelected = items.every(i => selected.includes(i.id));
                        const someSelected = items.some(i => selected.includes(i.id));

                        return (
                            <View key={category} className="mb-3">
                                {/* Category Header Row */}
                                <View className="flex-row items-center justify-between mb-2">
                                    {/* Dropdown toggle */}
                                    <TouchableOpacity
                                        className="flex-row items-center flex-1"
                                        onPress={() => toggleCategory(category)}
                                    >
                                        <Text className="text-base font-bold text-gray-700 mr-2">
                                            {category}
                                        </Text>
                                        <Text className="text-gray-400 text-xs">
                                            ({items.length})
                                        </Text>
                                        <Text className="ml-2 text-gray-400">
                                            {isCollapsed ? '▶' : '▼'}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Select All toggle */}
                                    <TouchableOpacity
                                        onPress={() => toggleSelectAll(category)}
                                        className={`px-3 py-1 rounded-lg border ${
                                            allSelected
                                                ? 'bg-red-500 border-red-500'
                                                : someSelected
                                                ? 'bg-red-50 border-red-300'
                                                : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-semibold ${
                                                allSelected ? 'text-white' : 'text-red-500'
                                            }`}
                                        >
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Ingredient Items */}
                                {!isCollapsed &&
                                    items.map(item => (
                                        <TouchableOpacity
                                            key={item.id}
                                            onPress={() => toggleIngredient(item.id)}
                                            className={`flex-row items-center p-4 mb-2 rounded-xl border-2 ${
                                                selected.includes(item.id)
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <Text className="text-xl mr-3">{item.image}</Text>
                                            <Text
                                                className={`flex-1 font-medium ${
                                                    selected.includes(item.id)
                                                        ? 'text-red-600'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {item.name}
                                            </Text>
                                            {selected.includes(item.id) && (
                                                <Text className="text-red-500">✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        );
                    })
                )}
                <View className="h-4" />
            </ScrollView>

            {/* footer Button */}
            <View className="px-8 pb-8 pt-4 border-t border-gray-100">
                {allSelected && (
                    <Text className="text-center text-gray-400 text-sm mb-3">
                        ⚠️ All ingredients selected — unable to create any recipes for you
                    </Text>
                )}
                <TouchableOpacity
                    className={`p-4 rounded-xl ${allSelected ? 'bg-gray-200' : 'bg-red-500'}`}
                    onPress={allSelected ? undefined : handleFinish}
                    disabled={allSelected}
                >
                    <Text className={`text-center font-bold text-lg ${allSelected ? 'text-gray-400' : 'text-white'}`}>
                        {selected.length === 0
                            ? 'No Allergies, Continue'
                            : `Save ${selected.length} Allergi${selected.length === 1 ? 'y' : 'es'}`}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}