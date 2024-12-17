import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import axios from "axios";
import { ToastAndroid } from "react-native";
import emitter from "@/constants/EventEmitter";
import { useFocusEffect } from '@react-navigation/native';

interface Card {
  id: string;
  accountName: string;
  balance: number; // Each account has its own balance
}

export default function HomeScreen() {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      if (!token || !userId) {
        router.replace("/login");
        ToastAndroid.show("Please log in to continue", ToastAndroid.SHORT);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData = response.data.user;
      const bankAccounts = userData.bankAccounts || [];
      
      // Check if active card is still valid
      const storedActiveCard = await AsyncStorage.getItem("activeCard");
      const activeCardData = storedActiveCard ? JSON.parse(storedActiveCard) : null;

      setCards(
        bankAccounts.map((account: any) => ({
          id: account.id.toString(),
          accountName: account.accountName,
          balance: account.balance,
        }))
      );

      setTotalBalance(
        bankAccounts.reduce(
          (acc: number, account: any) => acc + account.balance,
          0
        )
      );

      // Set active card if it still exists in fetched accounts
      if (activeCardData && bankAccounts.some((account: any) => account.id.toString() === activeCardData.id)) {
        setActiveCard(activeCardData.id);
      } else {
        setActiveCard(null); // Clear active card if it's not found
      }
    } catch (error) {
      console.error("Failed to load bank accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    const subscription = emitter.addListener("activeCardUpdated", loadData);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleSetActiveCard = async (cardId: string) => {
    const selectedCard = cards.find((card) => card.id === cardId);

    if (selectedCard) {
      setActiveCard(selectedCard.id);
      await AsyncStorage.setItem("activeCard", JSON.stringify(selectedCard));

      console.log("card switched");

      // Emit event for other components to react to the change
      emitter.emit("activeCardUpdated");
      Alert.alert(`${selectedCard.accountName} has been set as the active account!`);
    } else {
      console.error("Selected card not found!");
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.totalBalance}>Total Balance: ${totalBalance}</Text>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, item.id === activeCard && styles.activeCard]}
            onPress={() => handleSetActiveCard(item.id)}
          >
            <Text style={styles.cardTitle}>{item.accountName}</Text>
            <Text style={styles.cardBalance}>Balance: ${item.balance}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

// Styles for the screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  totalBalance: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
  },
  card: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginVertical: 10,
  },
  activeCard: {
    backgroundColor: "#cceeff",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardBalance: {
    fontSize: 16,
    color: "#666",
  },
});
