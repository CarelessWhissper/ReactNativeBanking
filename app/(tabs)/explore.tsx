import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Alert, StyleSheet, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import emitter from "@/constants/EventEmitter";
import axios from "axios"; // Import axios for API requests

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

    // Listen for the 'activeCardUpdated' event to refresh the active card
    const subscription = emitter.addListener("activeCardUpdated", getActiveCard);

    return () => {
      subscription.remove();
    };
  }, []);

  // Function to fetch updated active card data
  const fetchUpdatedActiveCard = async (activeCardId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token for authentication
        },
      });

      const userData = response.data.user;
      const updatedCard = userData.bankAccounts.find(account => account.id.toString() === activeCardId);

      if (updatedCard) {
        setActiveCard({
          id: updatedCard.id.toString(),
          accountName: updatedCard.accountName,
          balance: updatedCard.balance,
        });
      }
    } catch (error) {
      console.error("Error fetching updated active card:", error);
    }
  };

  // Function to handle the transfer
  const handleTransfer = async () => {
    if (!activeCard) {
      Alert.alert(
        "No active account",
        "Please select an active account before transferring."
      );
      return;
    }

    if (!amount || !recipientBankNumber) {
      Alert.alert(
        "Invalid input",
        "Please enter both the amount and recipient bank number."
      );
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/transfer", {
        senderAccountId: activeCard.id,
        recipientBankNumber,
        amount: parseFloat(amount),
      });

      if (response.status === 200) {
        Alert.alert("Success", "Transfer completed successfully.");

        // Fetch updated active card information
        await fetchUpdatedActiveCard(activeCard.id);
        
        // Emit an event to notify other screens that the active card's balance has changed
        emitter.emit("activeCardUpdated");
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
          Active Account: {activeCard.accountName} (Balance:{" "}
          {activeCard.balance})
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
