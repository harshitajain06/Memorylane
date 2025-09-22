// src/navigation/StackLayout.jsx

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import AiChat from './AiChat';
import CaregiverDashboard from './CaregiverDashboard';
import CaregiverTaskReminder from './CaregiverTaskReminder';
import CreateMemoryJournal from './CreateMemoryJournal';
import FetchImages from './FetchImages';
import FetchMemoryJournal from './FetchMemoryJournal';
import GameZone from './GameZone';
import LandingScreen from './index';
import LoginScreen from './LoginScreen';
import PatientDashboard from './PatientDashboard';
import PatientTaskReminder from './PatientTaskReminder';
import RegisterScreen from './RegisterScreen';
import UploadImages from './UploadImages';

import { auth } from '../../config/firebase';
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const db = getFirestore();

const CaregiverTabs = () => {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Task Reminder") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Add Images") {
            iconName = focused ? "cloud-upload" : "cloud-upload-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={CaregiverDashboard} />
      <Tab.Screen name="Task Reminder" component={CaregiverTaskReminder} />
      <Tab.Screen name="Add Images" component={UploadImages} />
    </Tab.Navigator>
  );
};

const PatientTabs = () => {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Ai Chat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "Create Memory Journal") {
            iconName = focused ? "create" : "create-outline";
          } else if (route.name === " View Memory Journal") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "Memories") {
            iconName = focused ? "images" : "images-outline";
          } else if (route.name === "Game Zone") {
            iconName = focused ? "game-controller" : "game-controller-outline";
          } else if (route.name === "Task Reminder") {
            iconName = focused ? "checkmark-done" : "checkmark-done-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={PatientDashboard} />
      <Tab.Screen name="Ai Chat" component={AiChat} />
      <Tab.Screen name="Create Memory Journal" component={CreateMemoryJournal} />
      <Tab.Screen name=" View Memory Journal" component={FetchMemoryJournal} />
      <Tab.Screen name="Memories" component={FetchImages} />
      <Tab.Screen name="Game Zone" component={GameZone} />
      <Tab.Screen name="Task Reminder" component={PatientTaskReminder} />
      

    </Tab.Navigator>
  );
};

const DrawerNavigator = ({ role }) => {
  const navigation = useNavigation();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("LandingScreen");
      })
      .catch((err) => {
        console.error("Logout Error:", err);
        Alert.alert("Error", "Failed to logout. Please try again.");
      });
  };

  return (
    <Drawer.Navigator initialRouteName="MainTabs">
      <Drawer.Screen
        name="MainTabs"
        component={role === 'caregiver' ? CaregiverTabs : PatientTabs}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen
        name="Logout"
        component={View} // dummy component
        options={{
          title: 'Logout',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Drawer.Navigator>
  );
};

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching role:", error);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors[colorScheme ?? "light"].background,
          },
        }}
      >
        {user ? (
          <Stack.Screen name="Drawer">
            {() => <DrawerNavigator role={role} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="LandingScreen" component={LandingScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
  );
}
