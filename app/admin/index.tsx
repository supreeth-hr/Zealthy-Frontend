import { Link, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { apiService } from "../../src/services/apiService";
import { SessionUser } from "../../src/services/types";
import { ui } from "../../src/ui/styles";
import { useNotifications } from "../../src/ui/notifications/NotificationsProvider";

export default function AdminPatients() {
  const [patients, setPatients] = useState<SessionUser[]>([]);
  const [error, setError] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const { notifySuccess } = useNotifications();

  const resetCreateForm = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateError("");
    setCreateSubmitting(false);
  };

  const closeCreateModal = () => {
    if (createSubmitting) {
      return;
    }
    setCreateModalOpen(false);
    resetCreateForm();
  };

  const load = useCallback(async () => {
    try {
      const rows = await apiService.listPatients();
      setPatients(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreatePatient = async () => {
    const trimmedName = createName.trim();
    const trimmedEmail = createEmail.trim();
    const trimmedPassword = createPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setCreateError("All fields are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.com$/i.test(trimmedEmail)) {
      setCreateError("Email must be in the format name@domain.com");
      return;
    }
    if (trimmedPassword.length < 8) {
      setCreateError("Password must be at least 8 characters long");
      return;
    }
    if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(trimmedPassword)) {
      setCreateError("Password must include a special character");
      return;
    }
    if (!/\d/.test(trimmedPassword)) {
      setCreateError("Password must include a number");
      return;
    }
    if (!/[A-Z]/.test(trimmedPassword)) {
      setCreateError("Password must include a capital letter");
      return;
    }
    try {
      setCreateSubmitting(true);
      setCreateError("");
      await apiService.createPatient({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
      });
      await load();
      setCreateModalOpen(false);
      resetCreateForm();
      notifySuccess("Successfully added a patient.");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create patient");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={ui.screen}>
      <Stack.Screen options={{ headerBackTitle: "Login" }} />
      <View style={ui.adminHome}>
        <View style={ui.adminHomeHeader}>
          <Text style={ui.adminDashboardHeading}>Admin Dashboard</Text>
          <Text style={[ui.muted, ui.headingCentered]}>
            Manage patient records, appointments, and prescriptions
          </Text>
          {!!error && <Text style={{ color: "#B42318" }}>{error}</Text>}
          <Pressable style={ui.buttonCreatePatient} onPress={() => setCreateModalOpen(true)}>
            <Text style={ui.buttonText}>Create New Patient</Text>
          </Pressable>
          <Text style={ui.patientListTitle}>Patient List</Text>
        </View>
        <ScrollView
          style={ui.patientListScroll}
          contentContainerStyle={ui.patientListScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {patients.map((patient) => (
            <View key={patient.id} style={[ui.card, ui.patientListCard]}>
              <Text style={[ui.subheading, ui.headingCentered]}>{patient.name}</Text>
              <Text style={ui.patientCardEmail}>{patient.email}</Text>
              <Link href={{ pathname: "/admin/patients/[userId]", params: { userId: String(patient.id) } }} asChild>
                <Pressable style={ui.buttonSecondary}>
                  <Text style={ui.secondaryText}>Open Patient Record</Text>
                </Pressable>
              </Link>
            </View>
          ))}
        </ScrollView>
      </View>
      <Modal
        visible={createModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <Pressable style={ui.modalBackdrop} onPress={closeCreateModal}>
          <Pressable style={[ui.modalCard, { marginTop: -230 }]} onPress={(event) => event.stopPropagation()}>
            <Text style={[ui.subheading, ui.headingCentered]}>Create Patient</Text>
            <Text style={ui.label}>Name</Text>
            <TextInput
              value={createName}
              onChangeText={setCreateName}
              style={ui.input}
              placeholder="Enter name"
            />
            <Text style={ui.label}>Email</Text>
            <TextInput
              value={createEmail}
              onChangeText={setCreateEmail}
              style={ui.input}
              autoCapitalize="none"
              placeholder="Enter email"
            />
            <Text style={ui.label}>Password</Text>
            <TextInput
              value={createPassword}
              onChangeText={setCreatePassword}
              style={ui.input}
              placeholder="Enter password"
            />
            <Text style={ui.muted}>*Must be atleast 8 characters long</Text>
            <Text style={ui.muted}>*Must include a special character</Text>
            <Text style={ui.muted}>*Must include a number</Text>
            <Text style={ui.muted}>*Must include a capital letter</Text>
            {!!createError && <Text style={{ color: "#B42318", textAlign: "center" }}>{createError}</Text>}
            <View style={ui.modalFooterRow}>
              <Pressable
                style={[ui.buttonSecondary, ui.modalButtonFlex]}
                onPress={closeCreateModal}
                disabled={createSubmitting}
              >
                <Text style={ui.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[ui.button, ui.modalButtonFlex]}
                onPress={handleCreatePatient}
                disabled={createSubmitting}
              >
                <Text style={ui.buttonText}>{createSubmitting ? "Adding..." : "Add"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
} 