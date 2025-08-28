import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";

export default function PatientDashboard({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Dashboard</Text>
      <Text>Here you will see reminders & messages from your caregiver.</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "red", marginTop: 20 }]}
        onPress={() => {
          signOut(auth);
          navigation.replace("Login");
        }}
      >
        <Text style={{ color: "#fff" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 6, marginTop: 10, alignItems: "center" },
});
