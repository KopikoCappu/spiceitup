import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/home'); // Redirect to the swipe screen
    } catch (error: any) {
      Alert.alert("Login Error", error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Account created! You can now log in.");
    } catch (error: any) {
      Alert.alert("Sign Up Error", error.message);
    }
  };

  return (
    <View className="flex-1 justify-center p-8 bg-white">
      <Text className="text-5xl font-black text-red-500 text-center mb-10">
        Spice It Up 🌶️
      </Text>
      
      <TextInput 
        placeholder="Email" 
        className="bg-gray-100 p-4 rounded-xl mb-4"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <TextInput 
        placeholder="Password" 
        className="bg-gray-100 p-4 rounded-xl mb-6"
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity className="bg-red-500 p-4 rounded-xl" onPress={handleLogin}>
        <Text className="text-white text-center font-bold text-lg">Login</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-6" onPress={handleSignUp}>
        <Text className="text-blue-500 text-center">Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}