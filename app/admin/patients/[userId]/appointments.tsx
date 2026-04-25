import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
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
import { TabSwitchRow } from "../../../../src/components/TabSwitchRow";
import { appointmentRepeatOptions } from "../../../../src/features/admin/constants";
import { apiService } from "../../../../src/services/apiService";
import { AdminAppointmentRow, AppointmentListItem } from "../../../../src/services/api/types";
import { Frequency } from "../../../../src/services/types";
import { formatUtcDateTimeToLocal, localDateTimeFieldsToUtcIso, utcDateTimeToLocalFields } from "../../../../src/utils/date";
import { formatTitleCaseLabel } from "../../../../src/utils/format";
import { ui } from "../../../../src/ui/styles";
import { crossPlatformAlert } from "../../../../src/ui/notifications/alert";
import { useNotifications } from "../../../../src/ui/notifications/NotificationsProvider";

type ScheduleRow = AppointmentListItem;
type ProviderRow = AdminAppointmentRow;
type TabKey = "schedule" | "providers";
type RepeatOption = Frequency;

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
  const { notifySuccess } = useNotifications();

  const repeatOptions = appointmentRepeatOptions as Array<{ label: string; value: RepeatOption }>;

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
      notifySuccess("Appointment added successfully.");
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
      notifySuccess("Appointment updated successfully.");
    } catch (err) {
      setUpdateFormError(err instanceof Error ? err.message : "Failed to update appointment.");
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleDeleteAppointment = (appointment: ProviderRow) => {
    crossPlatformAlert(
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
        <TabSwitchRow
          activeTab={activeTab}
          onSelect={setActiveTab}
          options={[
            { key: "schedule", label: "Upcoming Schedule" },
            { key: "providers", label: "My Providers" },
          ]}
        />
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
                    <Text>Frequency: {formatTitleCaseLabel(provider.repeat)}</Text>
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
