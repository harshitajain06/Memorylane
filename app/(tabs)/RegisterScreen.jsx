import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../config/firebase";

export default function RegisterScreen() {
  const navigation = useNavigation();
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
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor="#95a5a6"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#7f8c8d" style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor="#95a5a6"
            />
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                onPress={() => setRole("caregiver")}
                style={[styles.roleBtn, role === "caregiver" && styles.activeRole]}
              >
                <Ionicons 
                  name="people" 
                  size={20} 
                  color={role === "caregiver" ? "#fff" : "#4A90E2"} 
                />
                <Text style={[styles.roleText, role === "caregiver" && styles.activeRoleText]}>
                  Caregiver
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole("patient")}
                style={[styles.roleBtn, role === "patient" && styles.activeRole]}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={role === "patient" ? "#fff" : "#4A90E2"} 
                />
                <Text style={[styles.roleText, role === "patient" && styles.activeRoleText]}>
                  Patient
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {role === "patient" && (
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={20} color="#7f8c8d" style={styles.inputIcon} />
              <TextInput
                placeholder="Invite Code"
                value={inviteCode}
                onChangeText={setInviteCode}
                style={styles.input}
                placeholderTextColor="#95a5a6"
              />
            </View>
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Ionicons name="person-add" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
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
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: 500,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
    width: "100%",
    maxWidth: 400,
  },
  backButton: {
    padding: 8,
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  placeholder: {
    width: 40,
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    ...Platform.select({
      web: {
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#2c3e50",
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4A90E2",
    backgroundColor: "#fff",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.2s ease",
      },
    }),
  },
  activeRole: {
    backgroundColor: "#4A90E2",
  },
  roleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
  activeRoleText: {
    color: "#fff",
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(74, 144, 226, 0.3)",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-1px)",
        },
      },
    }),
  },
  buttonIcon: {
    marginRight: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  linkText: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
});
