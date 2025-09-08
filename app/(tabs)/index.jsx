import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Welcome Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={60} color="#4A90E2" />
          </View>
          <Text style={styles.appName}>MemoryLane</Text>
          <Text style={styles.tagline}>Connecting Caregivers and Patients</Text>
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="chatbubbles" size={24} color="#4A90E2" />
            <Text style={styles.featureText}>AI-Powered Chat</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="book" size={24} color="#4A90E2" />
            <Text style={styles.featureText}>Memory Journals</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="game-controller" size={24} color="#4A90E2" />
            <Text style={styles.featureText}>Memory Games</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
        <TouchableOpacity
            style={[styles.button, styles.primaryButton]} 
            onPress={() => navigation.navigate("LoginScreen")}
            activeOpacity={0.8}
        >
            <Ionicons name="log-in" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => navigation.navigate("RegisterScreen")}
            activeOpacity={0.8}
        >
            <Ionicons name="person-add" size={20} color="#4A90E2" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Register</Text>
        </TouchableOpacity>
      </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            New to MemoryLane? Register to get started
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    ...Platform.select({
      web: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    }),
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    maxWidth: 400,
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: 500,
        margin: "0 auto",
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(74, 144, 226, 0.15)",
      },
    }),
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
    ...Platform.select({
      web: {
        maxWidth: 300,
      },
    }),
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-1px)",
        },
      },
    }),
  },
  primaryButton: {
    backgroundColor: "#4A90E2",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(74, 144, 226, 0.3)",
      },
    }),
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#4A90E2",
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#4A90E2",
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
});
