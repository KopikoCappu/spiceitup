import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return; // stops here, never reaches Firebase
    }

    if (!email.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/home'); // Redirect to the swipe screen
    } catch (error: any) {
      Alert.alert("Login Error", "Invalid email or password, please try again.");
    }
  };

  return (
    <View className="flex-1 justify-center p-8 bg-white">
      <Text className="text-5xl font-black text-red-500 text-center mb-10">
        Spice It Up 🌶️
      </Text>
      
      <TextInput 
        placeholder="Email" 
        placeholderTextColor="#9CA3AF"
        className="bg-gray-100 p-4 rounded-xl mb-4"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <TextInput 
        placeholder="Password" 
        placeholderTextColor="#9CA3AF"
        className="bg-gray-100 p-4 rounded-xl mb-6"
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity className="bg-red-500 p-4 rounded-xl" onPress={handleLogin}>
        <Text className="text-white text-center font-bold text-lg">Login</Text>
      </TouchableOpacity>

      {/* navigate to signup page */}
      <TouchableOpacity className="mt-6" onPress={() => router.push('/signup')}>
        <Text className="text-blue-500 text-center">Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}