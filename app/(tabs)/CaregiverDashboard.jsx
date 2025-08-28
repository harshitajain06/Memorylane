import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { auth, db } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import uuid from "react-native-uuid";

export default function CaregiverDashboard({ navigation }) {
  const [inviteCode, setInviteCode] = useState(null);

  const generateInvite = async () => {
    const code = uuid.v4().slice(0, 6); // short random code
    await setDoc(doc(db, "invites", code), {
      caregiverId: auth.currentUser.uid,
      createdAt: Date.now(),
    });
    setInviteCode(code);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Dashboard</Text>

      <TouchableOpacity style={styles.button} onPress={generateInvite}>
        <Text style={{ color: "#fff" }}>Generate Invite Code</Text>
      </TouchableOpacity>

      {inviteCode && (
        <Text style={{ marginTop: 20, fontSize: 18 }}>Share this code with patient: {inviteCode}</Text>
      )}

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
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 6, marginTop: 10, alignItems: "center" },
});
