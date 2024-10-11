import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable ,Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import axios from 'axios'; // Import axios for API requests
import { ToastAndroid } from 'react-native';
interface Card {
  id: string;
  accountName: string;
  balance: number; // Each account has its own balance
}

export default function HomeScreen() {
  const [activeCard, setActiveCard] = useState<string | null>(null); // Store active card ID
  const [cards, setCards] = useState<Card[]>([]); // Cards (Bank Accounts) will be stored here
  const [totalBalance, setTotalBalance] = useState<number>(0); // Total balance across all accounts
  const [loading, setLoading] = useState(true); // To handle loading state

  // Fetch user data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId'); // Assuming userId is stored after login

        if (!token || !userId) {
          router.replace('/login');
          ToastAndroid.show('Please log in to continue', ToastAndroid.SHORT);
          return;
        }

        // Fetch user bank accounts from the backend
        const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}` // Pass the token for authentication
          }
        });

        const userData = response.data.user;
        const bankAccounts = userData.bankAccounts || [];

        setCards(
          bankAccounts.map((account: any) => ({
            id: account.id.toString(),
            accountName: account.accountName,
            balance: account.balance,
          }))
        );

        // Calculate the total balance
        setTotalBalance(bankAccounts.reduce((acc: number, account: any) => acc + account.balance, 0));
      } catch (error) {
        console.error('Failed to load bank accounts:', error);
      
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handler to set the active card
  const handleSetActiveCard = async (cardId: string) => {
    setActiveCard(cardId);

    const selectedCard = cards.find((card) => card.id === cardId);

    if (selectedCard) {
      // Store the active card in AsyncStorage
      await AsyncStorage.setItem('activeCard', JSON.stringify(selectedCard));
      alert(`${selectedCard.accountName} has been set as the active account!`);
      console.log(`${selectedCard.accountName} has been set as the active account!`);
    } else {
      console.error('Selected card not found!');
    }
    
  };
  

  if (loading) {
    return <Text>Loading...</Text>; // Display a loading state
  }

  return (
    <View style={styles.container}>
      {/* Display Total Balance */}
      <Text style={styles.totalBalance}>Total Balance: ${totalBalance}</Text>

      {/* Display Each Card */}
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable 
            style={[
              styles.card,
              item.id === activeCard && styles.activeCard,
            ]}
            onPress={() => handleSetActiveCard(item.id)}
          >
            <Text style={styles.cardTitle}>{item.accountName}</Text>
            <Text style={styles.cardBalance}>Balance: ${item.balance}</Text>
          </Pressable >
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
    backgroundColor: '#f9f9f9',
  },
  totalBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginVertical: 10,
  },
  activeCard: {
    backgroundColor: '#cceeff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardBalance: {
    fontSize: 16,
    color: '#666',
  },
});
