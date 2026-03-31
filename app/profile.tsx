import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert,
    KeyboardAvoidingView,
    Platform, ScrollView, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '../AuthContext';
import TabBar from '../components/TabBar';
import { auth, db } from '../firebaseConfig';


const AVATAR_COLORS = [
  { label: 'Rose',   bg: 'bg-rose-500',   hex: '#F43F5E' },
  { label: 'Violet', bg: 'bg-violet-500',  hex: '#8B5CF6' },
  { label: 'Blue',   bg: 'bg-blue-500',    hex: '#3B82F6' },
  { label: 'Teal',   bg: 'bg-teal-500',    hex: '#14B8A6' },
  { label: 'Orange', bg: 'bg-orange-500',  hex: '#F97316' },
];

const CATEGORIES = ['Vegetable', 'Baking', 'Protein', 'Dairy', 'Fruit', 'Condiment', 'Dairy Alternative', 'Carb'];

type UserData = {
  name: string;
  email: string;
  allergies: string[];
  avatarColor?: string;
  isAdmin?: boolean;
}



export default function ProfileScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // things to edit
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [allergies, setAllergies] = useState<string[]>([]);

  // search/change allergies
  const [allIngredients, setAllIngredients] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // admin — new ingred
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState('');
  const [ingImage, setIngImage] = useState('');
  const [ingSaving, setIngSaving] = useState(false);

  const router = useRouter();

    const handleLogout = async () => {
    try {
        await signOut(auth);
        router.replace('/');
    } catch (e: any) {
        Alert.alert("Logout Error", e.message);
    }
    };

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData(data);
        setName(data.name);
        setAllergies(data.allergies || []);
        const saved = AVATAR_COLORS.find(c => c.hex === data.avatarColor);
        setAvatarColor(saved || AVATAR_COLORS[0]);
      }
      setLoading(false);
    };
    fetchUser();
  }, [user]);

  // get all ingredients for allergy search
  useEffect(() => {
    const fetchIngredients = async () => {
      const snap = await getDocs(collection(db, "ingredients"));
      const names = snap.docs.map(d => d.data().name as string).sort();
      setAllIngredients(names);
    };
    fetchIngredients();
  }, []);

  const handleAllergySearch = (text: string) => {
    setNewAllergy(text);
    if (text.trim()) {
      setSuggestions(
        allIngredients.filter(name =>
          name.toLowerCase().includes(text.toLowerCase()) &&
          !allergies.includes(name)
        ).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  };

  const selectAllergy = (item: string) => {
    setAllergies(prev => [...prev, item]);
    setNewAllergy('');
    setSuggestions([]);
  };

  const removeAllergy = (item: string) => {
    setAllergies(prev => prev.filter(a => a !== item));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        allergies,
        avatarColor: avatarColor.hex,
      });
      setUserData(prev => prev ? { ...prev, name, allergies, avatarColor: avatarColor.hex } : null);
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Save Error", e.message);
    }
  };

  const handleCancel = () => {
    // back to saved values
    setName(userData?.name || '');
    setAllergies(userData?.allergies || []);
    const saved = AVATAR_COLORS.find(c => c.hex === userData?.avatarColor);
    setAvatarColor(saved || AVATAR_COLORS[0]);
    setNewAllergy('');
    setSuggestions([]);
    setEditing(false);
  };

  // add ingredient
  const handleAddIngredient = async () => {
    if (!ingName.trim() || !ingCategory || !ingImage.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    setIngSaving(true);
    try {
      await addDoc(collection(db, "ingredients"), {
        name: ingName.trim(),
        category: ingCategory,
        image: ingImage.trim(),
      });
      setAllIngredients(prev => [...prev, ingName.trim()].sort());
      setIngName('');
      setIngCategory('');
      setIngImage('');
      Alert.alert("Success", `"${ingName.trim()}" added to ingredients!`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setIngSaving(false);
  };

  if (loading) return (
    <View className="flex-1 justify-center">
      <ActivityIndicator size="large" color="#EF4444" />
    </View>
  );

  const firstName = name.split(' ')[0] || 'Chef';

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 bg-rose-50">
        <ScrollView
          className="flex-1 px-6 pt-16"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >

          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-3xl font-black text-gray-800">Profile</Text>
            {editing ? (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleCancel}>
                  <Text className="text-gray-400 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave}>
                  <Text className="text-rose-500 font-bold">Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text className="text-rose-500 font-semibold">Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar */}
          <View className="items-center mb-8">
            <View
              className="w-24 h-24 rounded-full justify-center items-center mb-4 shadow-md"
              style={{ backgroundColor: avatarColor.hex }}
            >
              <Text className="text-white text-4xl font-black">
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
            {editing && (
              <View className="flex-row gap-3 mt-2">
                {AVATAR_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.hex}
                    onPress={() => setAvatarColor(color)}
                    style={{
                      backgroundColor: color.hex,
                      borderWidth: avatarColor.hex === color.hex ? 2 : 0,
                      borderColor: '#1F2937',
                    }}
                    className="w-8 h-8 rounded-full"
                  />
                ))}
              </View>
            )}
          </View>

          {/* Info Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Account Info</Text>

            <View className="py-3 border-b border-gray-100">
              <Text className="text-gray-500 font-medium mb-1">Full Name</Text>
              {editing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="text-gray-800 font-semibold bg-gray-50 px-3 py-2 rounded-lg"
                />
              ) : (
                <Text className="text-gray-800 font-semibold">{name || '—'}</Text>
              )}
            </View>

            <View className="py-3">
              <Text className="text-gray-500 font-medium mb-1">Email</Text>
              <Text className="text-gray-400 font-semibold">{userData?.email || '—'}</Text>
            </View>
          </View>

          {/* Allergies Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-8">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Allergies</Text>

            {/* Allergy tags */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {allergies.length === 0 && (
                <Text className="text-gray-400">None</Text>
              )}
              {allergies.map((item) => (
                <View key={item} className="flex-row items-center bg-rose-100 px-3 py-1 rounded-full">
                  <Text className="text-rose-600 font-semibold text-sm">{item}</Text>
                  {editing && (
                    <TouchableOpacity onPress={() => removeAllergy(item)} className="ml-2">
                      <Text className="text-rose-400 font-bold">✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Search input + suggestions */}
            {editing && (
              <View>
                <TextInput
                  value={newAllergy}
                  onChangeText={handleAllergySearch}
                  placeholder="Search ingredients..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 px-3 py-2 rounded-lg text-gray-800"
                />
                {suggestions.length > 0 && (
                  <View className="bg-white rounded-xl mt-1 border border-gray-100 overflow-hidden">
                    {suggestions.map((item, index) => (
                      <TouchableOpacity
                        key={item}
                        onPress={() => selectAllergy(item)}
                        className={`px-4 py-3 ${index < suggestions.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <Text className="text-gray-700">{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* admin — add ingred */}
          {userData?.isAdmin && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-8">
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">
                ⚙️ Admin — Add Ingredient
              </Text>

              <Text className="text-gray-500 font-medium mb-1">Name</Text>
              <TextInput
                value={ingName}
                onChangeText={setIngName}
                placeholder="e.g. Brussel Sprouts"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 px-3 py-2 rounded-lg text-gray-800 mb-3"
              />

              <Text className="text-gray-500 font-medium mb-1">Category</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setIngCategory(cat)}
                    className={`px-3 py-1 rounded-full border ${
                      ingCategory === cat
                        ? 'bg-rose-500 border-rose-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${
                      ingCategory === cat ? 'text-white' : 'text-gray-600'
                    }`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-gray-500 font-medium mb-1">Image (emoji)</Text>
              <TextInput
                value={ingImage}
                onChangeText={setIngImage}
                placeholder="e.g. 🥦"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 px-3 py-2 rounded-lg text-gray-800 mb-4"
              />

              <TouchableOpacity
                onPress={handleAddIngredient}
                disabled={ingSaving}
                className="bg-rose-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold">
                  {ingSaving ? 'Adding...' : 'Add Ingredient'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logout */}
            <TouchableOpacity
            onPress={handleLogout}
            className="bg-white border border-rose-200 py-3 rounded-xl items-center mb-8"
            >
            <Text className="text-rose-500 font-bold">Log Out</Text>
            </TouchableOpacity>

        </ScrollView>
        <TabBar />
      </View>
    </KeyboardAvoidingView>
  );
}