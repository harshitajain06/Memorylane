import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;
      const snap = await getDoc(doc(db, "users", uid));
      const role = snap.data().role;

      if (role === "caregiver") navigation.replace("CaregiverDashboard");
      else navigation.replace("PatientDashboard");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={{ color: "#fff" }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={{ marginTop: 15 }}>No account? Register here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 6 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 6, marginTop: 10, alignItems: "center" },
});
