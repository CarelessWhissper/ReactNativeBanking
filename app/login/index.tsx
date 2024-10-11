import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function loginScreen() {
  const [bankNumber, setBankNumber] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  // Handler for logging in
  const handleLogin = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bankNumber, password }),
        }
      );

      if (response.ok) {
        const { user, cards, token } = await response.json();

        // Store user and card info in AsyncStorage
        await AsyncStorage.setItem("bankNumber", user.bankNumber);
        await AsyncStorage.setItem("cards", JSON.stringify(cards));
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userId",user.id);

        // Navigate to the main page
        router.replace("/(tabs)/");
      } else {
        Alert.alert("Login failed", "Invalid credentials, please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login error", "An error occurred, please try again.");
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to Your Bank Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Bank Number"
        value={bankNumber}
        onChangeText={setBankNumber}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});
