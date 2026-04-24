import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
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
import { apiService } from "../../../../src/services/apiService";
import { formatUtcDateTimeToLocal, localDateTimeFieldsToUtcIso, utcDateTimeToLocalFields } from "../../../../src/utils/date";
import { ui } from "../../../../src/ui/styles";

type ScheduleRow = { provider: string; datetime: string; repeat: string };
type ProviderRow = {
  id: number;
  user_id: number;
  provider: string;
  datetime: string;
  repeat: string;
  created_at: string;
};
type TabKey = "schedule" | "providers";
type RepeatOption = "daily" | "weekly" | "monthly" | "yearly" | "none";

export default function PatientAppointmentsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const targetUserId = Number(userId);
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [providerRows, setProviderRows] = useState<ProviderRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [repeatValue, setRepeatValue] = useState<RepeatOption | "">("");
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [updateProviderName, setUpdateProviderName] = useState("");
  const [updateDateValue, setUpdateDateValue] = useState("");
  const [updateTimeValue, setUpdateTimeValue] = useState("");
  const [updateRepeatValue, setUpdateRepeatValue] = useState<RepeatOption | "">("");
  const [showUpdateRepeatOptions, setShowUpdateRepeatOptions] = useState(false);
  const [updateFormError, setUpdateFormError] = useState("");
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const repeatOptions: Array<{ label: string; value: RepeatOption }> = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
    { label: "None", value: "none" },
  ];

  const formatRepeatLabel = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return "";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const load = useCallback(async () => {
    if (!Number.isFinite(targetUserId)) {
      setError("Invalid patient ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [upcoming, allAppointments] = await Promise.all([
        apiService.listUpcomingAppointments(targetUserId),
        apiService.listAllAppointments(targetUserId),
      ]);
      setScheduleRows(upcoming);
      setProviderRows(allAppointments);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openAddModal = () => {
    setProviderName("");
    setDateValue("");
    setTimeValue("");
    setRepeatValue("");
    setShowRepeatOptions(false);
    setFormError("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (submitting) return;
    setShowAddModal(false);
    setProviderName("");
    setDateValue("");
    setTimeValue("");
    setRepeatValue("");
    setShowRepeatOptions(false);
    setFormError("");
  };

  const submitAppointment = async () => {
    const provider = providerName.trim();
    const date = dateValue.trim();
    const time = timeValue.trim();
    if (!provider || !date || !time || !repeatValue) {
      setFormError("All fields are required.");
      return;
    }
    const datetimeIso = localDateTimeFieldsToUtcIso(date, time);
    if (!datetimeIso) {
      setFormError("Enter a valid date (YYYY-MM-DD) and time (HH:mm).");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      await apiService.createAppointment(targetUserId, {
        provider,
        datetime: datetimeIso,
        repeat: repeatValue,
      });
      setShowAddModal(false);
      setProviderName("");
      setDateValue("");
      setTimeValue("");
      setRepeatValue("");
      setShowRepeatOptions(false);
      await load();
      Alert.alert("Success!", "Appointment added successfully.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdateModal = (appointment: ProviderRow) => {
    const parsed = utcDateTimeToLocalFields(appointment.datetime);
    setEditingAppointmentId(appointment.id);
    setUpdateProviderName(appointment.provider);
    setUpdateDateValue(parsed.date);
    setUpdateTimeValue(parsed.time);
    const normalized = appointment.repeat.toLowerCase() as RepeatOption;
    setUpdateRepeatValue(repeatOptions.some((opt) => opt.value === normalized) ? normalized : "");
    setShowUpdateRepeatOptions(false);
    setUpdateFormError("");
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    if (updateSubmitting) return;
    setShowUpdateModal(false);
    setEditingAppointmentId(null);
    setUpdateProviderName("");
    setUpdateDateValue("");
    setUpdateTimeValue("");
    setUpdateRepeatValue("");
    setShowUpdateRepeatOptions(false);
    setUpdateFormError("");
  };

  const submitUpdateAppointment = async () => {
    if (!editingAppointmentId) return;
    const provider = updateProviderName.trim();
    if (!provider || !updateDateValue.trim() || !updateTimeValue.trim() || !updateRepeatValue) {
      setUpdateFormError("All fields are required.");
      return;
    }
    const datetimeIso = localDateTimeFieldsToUtcIso(updateDateValue, updateTimeValue);
    if (!datetimeIso) {
      setUpdateFormError("Enter a valid date (YYYY-MM-DD) and time (HH:mm).");
      return;
    }
    setUpdateFormError("");
    setUpdateSubmitting(true);
    try {
      await apiService.updateAppointment(targetUserId, editingAppointmentId, {
        provider,
        datetime: datetimeIso,
        repeat: updateRepeatValue,
      });
      closeUpdateModal();
      await load();
      Alert.alert("Success!", "Appointment updated successfully.");
    } catch (err) {
      setUpdateFormError(err instanceof Error ? err.message : "Failed to update appointment.");
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleDeleteAppointment = (appointment: ProviderRow) => {
    Alert.alert(
      "Delete Appointment",
      `Are you sure you want to delete ${appointment.provider} for this patient?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setActionBusyId(appointment.id);
              await apiService.deleteAppointment(targetUserId, appointment.id);
              setError("");
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to delete appointment.");
            } finally {
              setActionBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={ui.screen}>
      <Stack.Screen options={{ headerBackTitle: "Back" }} />
      <View style={ui.container}>
        {!!error && <Text style={{ color: "#B42318" }}>{error}</Text>}
        <View style={ui.tabRow}>
          <Pressable
            style={[ui.tabButton, activeTab === "schedule" ? ui.tabButtonActive : ui.tabButtonInactive]}
            onPress={() => setActiveTab("schedule")}
          >
            <Text style={activeTab === "schedule" ? ui.tabLabelActive : ui.tabLabelInactive}>Upcoming Schedule</Text>
          </Pressable>
          <Pressable
            style={[ui.tabButton, activeTab === "providers" ? ui.tabButtonActive : ui.tabButtonInactive]}
            onPress={() => setActiveTab("providers")}
          >
            <Text style={activeTab === "providers" ? ui.tabLabelActive : ui.tabLabelInactive}>My Providers</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={ui.container}>
        {loading ? (
          <Text style={ui.emptyStateText}>Loading appointments...</Text>
        ) : activeTab === "schedule" ? (
          <>
            {scheduleRows.map((item, index) => (
              <View key={`${item.provider}-${item.datetime}-${index}`} style={[ui.card, ui.elevatedCard]}>
                <View style={ui.appointmentRow}>
                  <Text style={ui.appointmentProviderText}>{item.provider}</Text>
                  <Text style={ui.appointmentDateText}>{formatUtcDateTimeToLocal(item.datetime)}</Text>
                </View>
              </View>
            ))}
            {!scheduleRows.length && <Text style={ui.emptyStateText}>No upcoming appointments</Text>}
          </>
        ) : (
          <>
            <Pressable style={ui.buttonAddAppointment} onPress={openAddModal}>
              <Text style={ui.buttonText}>Add Appointment</Text>
            </Pressable>
            {providerRows.map((provider) => (
              <View key={provider.id} style={[ui.card, ui.elevatedCard]}>
                <View style={ui.providerCardRow}>
                  <View style={ui.providerCardContent}>
                    <Text style={ui.subheading}>{provider.provider}</Text>
                    <Text>Start Date and Time: {formatUtcDateTimeToLocal(provider.datetime)}</Text>
                    <Text>Frequency: {formatRepeatLabel(provider.repeat)}</Text>
                  </View>
                  <View style={ui.providerCardActions}>
                    <Pressable
                      style={ui.iconButton}
                      onPress={() => openUpdateModal(provider)}
                      disabled={updateSubmitting || actionBusyId === provider.id}
                    >
                      <Image source={require("../../../../assets/pencil.png")} style={ui.iconImage} />
                    </Pressable>
                    <Pressable
                      style={ui.iconButton}
                      onPress={() => handleDeleteAppointment(provider)}
                      disabled={updateSubmitting || actionBusyId === provider.id}
                    >
                      <Image source={require("../../../../assets/delete.png")} style={ui.iconImage} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
            {!providerRows.length && <Text style={ui.emptyStateText}>No providers found</Text>}
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={closeAddModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={ui.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closeAddModal}
            disabled={submitting}
            accessibilityLabel="Close dialog"
          />
          <View style={ui.modalCard}>
            <Text style={[ui.subheading, ui.headingCentered]}>Add Appointment</Text>

            <Text style={ui.label}>Provider Name</Text>
            <TextInput
              style={ui.input}
              value={providerName}
              onChangeText={setProviderName}
              editable={!submitting}
              placeholder="Enter provider name"
            />

            <Text style={ui.label}>Date</Text>
            <TextInput
              style={ui.input}
              placeholder="YYYY-MM-DD"
              value={dateValue}
              onChangeText={setDateValue}
              editable={!submitting}
              autoCapitalize="none"
            />

            <Text style={ui.label}>Time</Text>
            <TextInput
              style={ui.input}
              placeholder="HH:mm"
              value={timeValue}
              onChangeText={setTimeValue}
              editable={!submitting}
              autoCapitalize="none"
            />

            <Text style={ui.label}>Frequency</Text>
            <View style={ui.selectFieldWrap}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowRepeatOptions((v) => !v)}
                disabled={submitting}
              >
                <Text style={ui.selectControlText}>
                  {repeatOptions.find((option) => option.value === repeatValue)?.label ?? "Select frequency"}
                </Text>
                <Text style={ui.muted}>{showRepeatOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showRepeatOptions && (
                <ScrollView
                  style={[ui.selectOptionsWrap, { maxHeight: 160 }]}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {repeatOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[ui.selectOption, option.value === repeatValue && ui.selectOptionActive]}
                      onPress={() => {
                        setRepeatValue(option.value);
                        setShowRepeatOptions(false);
                      }}
                      disabled={submitting}
                    >
                      <Text style={option.value === repeatValue ? ui.tabLabelActive : ui.tabLabelInactive}>{option.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {!!formError && <Text style={{ color: "#B42318", fontSize: 13, textAlign: "center" }}>{formError}</Text>}

            <View style={ui.modalFooterRow}>
              <Pressable
                style={[ui.buttonSecondary, ui.modalButtonFlex, submitting && { opacity: 0.6 }]}
                onPress={closeAddModal}
                disabled={submitting}
              >
                <Text style={ui.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[ui.button, ui.modalButtonFlex, submitting && { opacity: 0.6 }]}
                onPress={submitAppointment}
                disabled={submitting}
              >
                <Text style={ui.buttonText}>{submitting ? "Adding..." : "Add"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showUpdateModal} transparent animationType="fade" onRequestClose={closeUpdateModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={ui.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closeUpdateModal}
            disabled={updateSubmitting}
            accessibilityLabel="Close dialog"
          />
          <View style={ui.modalCard}>
            <Text style={[ui.subheading, ui.headingCentered]}>Update Appointment</Text>

            <Text style={ui.label}>Provider Name</Text>
            <TextInput
              style={ui.input}
              value={updateProviderName}
              onChangeText={setUpdateProviderName}
              editable={!updateSubmitting}
              placeholder="Enter provider name"
            />

            <Text style={ui.label}>Date</Text>
            <TextInput
              style={ui.input}
              placeholder="YYYY-MM-DD"
              value={updateDateValue}
              onChangeText={setUpdateDateValue}
              editable={!updateSubmitting}
              autoCapitalize="none"
            />

            <Text style={ui.label}>Time</Text>
            <TextInput
              style={ui.input}
              placeholder="HH:mm"
              value={updateTimeValue}
              onChangeText={setUpdateTimeValue}
              editable={!updateSubmitting}
              autoCapitalize="none"
            />

            <Text style={ui.label}>Frequency</Text>
            <View style={ui.selectFieldWrap}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowUpdateRepeatOptions((v) => !v)}
                disabled={updateSubmitting}
              >
                <Text style={ui.selectControlText}>
                  {repeatOptions.find((option) => option.value === updateRepeatValue)?.label ?? "Select frequency"}
                </Text>
                <Text style={ui.muted}>{showUpdateRepeatOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showUpdateRepeatOptions && (
                <View style={ui.selectOptionsWrap}>
                  {repeatOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[ui.selectOption, option.value === updateRepeatValue && ui.selectOptionActive]}
                      onPress={() => {
                        setUpdateRepeatValue(option.value);
                        setShowUpdateRepeatOptions(false);
                      }}
                      disabled={updateSubmitting}
                    >
                      <Text style={option.value === updateRepeatValue ? ui.tabLabelActive : ui.tabLabelInactive}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {!!updateFormError && (
              <Text style={{ color: "#B42318", fontSize: 13, textAlign: "center" }}>{updateFormError}</Text>
            )}

            <View style={ui.modalFooterRow}>
              <Pressable
                style={[ui.buttonSecondary, ui.modalButtonFlex, updateSubmitting && { opacity: 0.6 }]}
                onPress={closeUpdateModal}
                disabled={updateSubmitting}
              >
                <Text style={ui.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[ui.button, ui.modalButtonFlex, updateSubmitting && { opacity: 0.6 }]}
                onPress={submitUpdateAppointment}
                disabled={updateSubmitting}
              >
                <Text style={ui.buttonText}>{updateSubmitting ? "Updating..." : "Update"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
