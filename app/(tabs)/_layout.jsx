// src/navigation/StackLayout.jsx

import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import CaregiverDashboard from './CaregiverDashboard';
import PatientDashboard from './PatientDashboard';
import LoginScreen from './LoginScreen';
import InviteScreen from './InviteScreen';
import RegisterScreen from './index';
import AiChat from './AiChat';
import CaregiverTaskReminder from './CaregiverTaskReminder';
import CreateMemoryJournal from './CreateMemoryJournal';
import FetchImages from './FetchImages';
import FetchMemoryJournal from './FetchMemoryJournal';
import GameZone from './GameZone';
import PatientTaskReminder from './PatientTaskReminder';
import ProfileScreen from './ProfileScreen';
import UploadImages from './UploadImages';

import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { auth } from '../../config/firebase';

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
          if (route.name === "CaregiverDashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "CaregiverTaskReminder") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "InviteScreen") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "ProfileScreen") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "AiChat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "CreateMemoryJournal") {
            iconName = focused ? "create" : "create-outline";
          } else if (route.name === "FetchMemoryJournal") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "UploadImages") {
            iconName = focused ? "cloud-upload" : "cloud-upload-outline";
          } else if (route.name === "FetchImages") {
            iconName = focused ? "images" : "images-outline";
          } else if (route.name === "GameZone") {
            iconName = focused ? "game-controller" : "game-controller-outline";
          } else if (route.name === "PatientTaskReminder") {
            iconName = focused ? "checkmark-done" : "checkmark-done-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="CaregiverDashboard" component={CaregiverDashboard} />
      <Tab.Screen name="CaregiverTaskReminder" component={CaregiverTaskReminder} />
      <Tab.Screen name="UploadImages" component={UploadImages} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
      <Tab.Screen name="FetchImages" component={FetchImages} />
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
          if (route.name === "CaregiverDashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "CaregiverTaskReminder") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "InviteScreen") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "ProfileScreen") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "AiChat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "CreateMemoryJournal") {
            iconName = focused ? "create" : "create-outline";
          } else if (route.name === "FetchMemoryJournal") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else if (route.name === "UploadImages") {
            iconName = focused ? "cloud-upload" : "cloud-upload-outline";
          } else if (route.name === "FetchImages") {
            iconName = focused ? "images" : "images-outline";
          } else if (route.name === "GameZone") {
            iconName = focused ? "game-controller" : "game-controller-outline";
          } else if (route.name === "PatientTaskReminder") {
            iconName = focused ? "checkmark-done" : "checkmark-done-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PatientDashboard" component={PatientDashboard} />
      <Tab.Screen name="AiChat" component={AiChat} />
      <Tab.Screen name="CreateMemoryJournal" component={CreateMemoryJournal} />
      <Tab.Screen name="FetchMemoryJournal" component={FetchMemoryJournal} />
      <Tab.Screen name="FetchImages" component={FetchImages} />
      <Tab.Screen name="GameZone" component={GameZone} />
      <Tab.Screen name="PatientTaskReminder" component={PatientTaskReminder} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />

    </Tab.Navigator>
  );
};

const DrawerNavigator = ({ role }) => {
  const navigation = useNavigation();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("RegisterScreen");
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
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
  );
}
