import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setPassword2] = useState('');
    const router = useRouter();

    const handleSignUp = async () => {
        if (!name) {
            Alert.alert("Missing Fields", "Please enter first and last name.");
            return; // stops here, never reaches Firebase
        }

        if (!email || !email.includes('@')) {
            Alert.alert("Email Error", "Invalid email or value missing.");
            return; // stops here, never reaches Firebase
        }

        if (!password) {
            Alert.alert("Missing Fields", "Please enter a password.");
            return; // stops here, never reaches Firebase
        }

        if (password != confirmPassword) {
            Alert.alert("Mismatch Values", "Passwords do not match, please try again.");
            return; // stops here, never reaches Firebase
        }

        try {
            const user_cred = await createUserWithEmailAndPassword(auth, email, password);
            const uid = user_cred.user.uid;

            await setDoc(doc(db, "users", uid), {
                name : name,
                email : email,
                isAdmin : false
            } 
            )
            router.replace('/allergy');
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
        placeholder="Full Name" 
        placeholderTextColor="#9CA3AF"
        className="bg-gray-100 p-4 rounded-xl mb-4"
        autoCapitalize="none"
        onChangeText={setName}
        />

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

        <TextInput 
        placeholder="Confirm Password" 
        placeholderTextColor="#9CA3AF"
        className="bg-gray-100 p-4 rounded-xl mb-6"
        secureTextEntry
        onChangeText={setPassword2}
        />

        {/* BACK BUTTON */}
        <TouchableOpacity className="bg-red-500 p-4 rounded-xl" onPress={handleSignUp}>
            <Text className="text-white text-center font-bold text-lg">Create an Account</Text>
        </TouchableOpacity>

        {/* handle signup */}
        <TouchableOpacity className="mt-6" onPress={() => router.back()}>
            <Text className="text-blue-500 text-center">Back</Text>
        </TouchableOpacity>
        </View>
    );
}