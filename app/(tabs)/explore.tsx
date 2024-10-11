import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabTwoScreen() {
  const [amount, setAmount] = useState("");
  const [recipientBankNumber, setRecipientBankNumber] = useState("");
  const [activeCard, setActiveCard] = useState(null);

  // Retrieve the active card from AsyncStorage
  useEffect(() => {
    const getActiveCard = async () => {
      try {
        const storedCard = await AsyncStorage.getItem("activeCard");
        if (storedCard !== null) {
          setActiveCard(JSON.parse(storedCard));
        }
      } catch (error) {
        console.error("Error retrieving active card:", error);
      }
    };

    getActiveCard();
  }, []);

  // Function to handle the transfer
  const handleTransfer = async () => {
    if (!activeCard) {
      Alert.alert("No active account", "Please select an active account before transferring.");
      return;
    }

    if (!amount || !recipientBankNumber) {
      Alert.alert("Invalid input", "Please enter both the amount and recipient bank number.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderAccountId: activeCard.id,
          recipientBankNumber,
          amount: parseFloat(amount),
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Transfer completed successfully.");
      } else {
        Alert.alert("Error", "Transfer failed. Please try again.");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      Alert.alert("Error", "An error occurred during the transfer.");
    }
  };

  return (
    <View style={styles.container}>
      {activeCard ? (
        <Text style={styles.info}>
          Active Account: {activeCard.accountName} (Balance: {activeCard.balance})
        </Text>
      ) : (
        <Text style={styles.info}>No active account selected</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Recipient Bank Number"
        value={recipientBankNumber}
        onChangeText={setRecipientBankNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="Amount to Transfer"
        value={amount}
        keyboardType="numeric"
        onChangeText={setAmount}
      />

      <Button title="Transfer" onPress={handleTransfer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 20,
  },
});
