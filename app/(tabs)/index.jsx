import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("caregiver"); // caregiver | patient
  const [inviteCode, setInviteCode] = useState("");

  const handleRegister = async () => {
  try {
    console.log("Register button pressed, role:", role);

    // Basic input validation
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (role === "patient") {
      if (!inviteCode.trim()) {
        Alert.alert("Invite Code Required", "Please enter the invite code from your caregiver.");
        return;
      }

      console.log("Checking invite:", inviteCode);

      const inviteRef = doc(db, "invites", inviteCode.trim());
      const caregiverSnap = await getDoc(inviteRef);

      if (!caregiverSnap.exists()) {
        console.log("Invalid invite code");
        Alert.alert("Invalid Code", "This invite code does not exist.");
        return;
      }

      const caregiverId = caregiverSnap.data().caregiverId;
      console.log("Invite valid, caregiverId:", caregiverId);

      const res = await createUserWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;

      console.log("Patient account created:", uid);

      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        role: "patient",
        caregiverId,
      });

      await updateDoc(doc(db, "users", caregiverId), {
        patients: arrayUnion(uid),
      });

      Alert.alert("Success", "You are now linked to your caregiver.");
      navigation.replace("Drawer");
    } else {
      console.log("Registering caregiver");

      const res = await createUserWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        role: "caregiver",
        patients: [],
      });

      Alert.alert("Success", "Caregiver account created.");
      navigation.replace("Drawer");
    }
  } catch (e) {
    console.error("Register error:", e);
    Alert.alert("Error", e.message);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <View style={{ flexDirection: "row", marginVertical: 10 }}>
        <TouchableOpacity
          onPress={() => setRole("caregiver")}
          style={[styles.roleBtn, role === "caregiver" && styles.active]}
        >
          <Text>Caregiver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setRole("patient")}
          style={[styles.roleBtn, role === "patient" && styles.active]}
        >
          <Text>Patient</Text>
        </TouchableOpacity>
      </View>

      {role === "patient" && (
        <TextInput
          placeholder="Invite Code"
          value={inviteCode}
          onChangeText={setInviteCode}
          style={styles.input}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={{ color: "#fff" }}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 6 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 6, marginTop: 10, alignItems: "center" },
  roleBtn: { flex: 1, padding: 10, alignItems: "center", borderWidth: 1, marginHorizontal: 5 },
  active: { backgroundColor: "#ddd" },
});
