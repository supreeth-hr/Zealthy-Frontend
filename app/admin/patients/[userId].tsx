import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiService } from "../../../src/services/apiService";
import { SessionUser } from "../../../src/services/types";
import { ui } from "../../../src/ui/styles";

export default function PatientRecordScreen() {
  const params = useLocalSearchParams<{ userId: string }>();
  const userId = Number(params.userId);

  const [patient, setPatient] = useState<SessionUser | null>(null);
  const [error, setError] = useState("");
  const [updatePatientError, setUpdatePatientError] = useState("");

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFormError, setPasswordFormError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const load = async () => {
    try {
      const patients = await apiService.listPatients();
      const targetPatient = patients.find((p) => p.id === userId) ?? null;
      setPatient(targetPatient);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patient data");
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordFormError("");
    setPasswordModalVisible(true);
  };

  const closePasswordModal = () => {
    if (passwordSaving) return;
    setPasswordModalVisible(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordFormError("");
    setPasswordSaving(false);
  };

  const submitPasswordChange = async () => {
    const next = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!next) {
      setPasswordFormError("Password cannot be empty.");
      return;
    }
    if (!confirm) {
      setPasswordFormError("Confirm password cannot be empty.");
      return;
    }
    if (next.length < 8) {
      setPasswordFormError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(next)) {
      setPasswordFormError("Password must include a special character.");
      return;
    }
    if (!/\d/.test(next)) {
      setPasswordFormError("Password must include a number.");
      return;
    }
    if (!/[A-Z]/.test(next)) {
      setPasswordFormError("Password must include a capital letter.");
      return;
    }
    if (next !== confirm) {
      setPasswordFormError("New password and Confirm password must match.");
      return;
    }

    setPasswordFormError("");
    setPasswordSaving(true);
    try {
      const updated = await apiService.updatePatientPassword(userId, { password: next });
      setPatient(updated);
      setError("");
      Alert.alert("Success!", "Password updated.");
      setPasswordModalVisible(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordFormError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!patient) {
    return (
      <SafeAreaView style={ui.screen}>
        <View style={ui.container}>
          <Text style={ui.muted}>Loading patient record...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const updatePatient = async () => {
    const trimmedName = patient.name.trim();
    const trimmedEmail = patient.email.trim();
    setUpdatePatientError("");
    if (!trimmedName || !trimmedEmail) {
      setUpdatePatientError("Name and Email cannot be empty");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.com$/i.test(trimmedEmail)) {
      setUpdatePatientError("Email must be in the format name@domain.com");
      return;
    }
    try {
      const updated = await apiService.updatePatient(userId, { name: trimmedName, email: trimmedEmail });
      setPatient(updated);
      setError("");
      setUpdatePatientError("");
      Alert.alert("Success!", "Patient Information updated.");
    } catch (err) {
      setUpdatePatientError(err instanceof Error ? err.message : "Failed to update patient");
    }
  };

  return (
    <SafeAreaView style={ui.screen}>
      <Stack.Screen options={{ headerBackTitle: "Back" }} />
      <ScrollView contentContainerStyle={ui.container}>
        <Text style={ui.patientRecordIdHeading}>Patient ID: {patient.id}</Text>
        {!!error && <Text style={{ color: "#B42318" }}>{error}</Text>}

        <View style={ui.card}>
          <Text style={[ui.subheading, ui.headingCentered]}>Patient Info</Text>
          <Text style={ui.label}>Name</Text>
          <TextInput style={ui.input} value={patient.name} onChangeText={(name) => setPatient({ ...patient, name })} />
          <Text style={ui.label}>Email</Text>
          <TextInput
            style={ui.input}
            autoCapitalize="none"
            value={patient.email}
            onChangeText={(email) => setPatient({ ...patient, email })}
          />
          {!!updatePatientError && <Text style={{ color: "#B42318", textAlign: "center" }}>{updatePatientError}</Text>}
          <Pressable style={ui.button} onPress={updatePatient}>
            <Text style={ui.buttonText}>Update Patient Info</Text>
          </Pressable>

          <Pressable style={ui.buttonPatientRecordNav} onPress={openPasswordModal}>
            <Text style={ui.buttonText}>Update Password</Text>
          </Pressable>
          <Link href={`/admin/patients/${userId}/appointments`} asChild>
            <Pressable style={ui.buttonPatientRecordNav}>
              <Text style={ui.buttonText}>Appointments</Text>
            </Pressable>
          </Link>
          <Link href={`/admin/patients/${userId}/prescriptions`} asChild>
            <Pressable style={ui.buttonPatientRecordNav}>
              <Text style={ui.buttonText}>Prescriptions</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      <Modal visible={passwordModalVisible} transparent animationType="fade" onRequestClose={closePasswordModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={ui.modalBackdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closePasswordModal}
            disabled={passwordSaving}
            accessibilityLabel="Close dialog"
          />
          <View style={ui.modalCard}>
            <Text style={[ui.subheading, ui.headingCentered]}>Update Password</Text>
            <Text style={ui.muted}>*Must be atleast 8 characters long</Text>
            <Text style={ui.muted}>*Must include a special character</Text>
            <Text style={ui.muted}>*Must include a number</Text>
            <Text style={ui.muted}>*Must include a capital letter</Text>
            <Text style={ui.label}>New Password</Text>
            <TextInput
              style={ui.input}
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (passwordFormError) setPasswordFormError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!passwordSaving}
              placeholder="Enter new password"
            />
            <Text style={ui.label}>Confirm Password</Text>
            <TextInput
              style={ui.input}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (passwordFormError) setPasswordFormError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!passwordSaving}
              placeholder="Confirm new password"
            />
            {!!passwordFormError && (
              <Text style={{ color: "#B42318", fontSize: 13, textAlign: "center" }}>{passwordFormError}</Text>
            )}
            <View style={ui.modalFooterRow}>
              <Pressable
                style={[ui.buttonSecondary, ui.modalButtonFlex, passwordSaving && { opacity: 0.6 }]}
                onPress={closePasswordModal}
                disabled={passwordSaving}
              >
                <Text style={ui.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[ui.button, ui.modalButtonFlex, passwordSaving && { opacity: 0.6 }]}
                onPress={submitPasswordChange}
                disabled={passwordSaving}
              >
                <Text style={ui.buttonText}>{passwordSaving ? "Updating…" : "Update"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
