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
import {
  dosageOptions,
  medicationOptions,
  prescriptionFrequencyOptions,
} from "../../../../src/features/admin/constants";
import { apiService } from "../../../../src/services/apiService";
import { PrescriptionRow, PrescriptionTimelineItem } from "../../../../src/services/api/types";
import { Frequency } from "../../../../src/services/types";
import { formatDate } from "../../../../src/utils/date";
import { formatTitleCaseLabel } from "../../../../src/utils/format";
import { ui } from "../../../../src/ui/styles";
import { isValidIsoDateOnly } from "../../../../src/utils/validation";
import { crossPlatformAlert } from "../../../../src/ui/notifications/alert";
import { useNotifications } from "../../../../src/ui/notifications/NotificationsProvider";

type TimelineRow = PrescriptionTimelineItem;
type MedicationRow = PrescriptionRow;
type TabKey = "timeline" | "medications";
type FrequencyOption = Frequency;

export default function PatientPrescriptionsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const targetUserId = Number(userId);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [timelineRows, setTimelineRows] = useState<TimelineRow[]>([]);
  const [medicationRows, setMedicationRows] = useState<MedicationRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMedication, setCreateMedication] = useState("");
  const [createDosage, setCreateDosage] = useState("");
  const [createQuantity, setCreateQuantity] = useState("");
  const [createRefillOn, setCreateRefillOn] = useState("");
  const [createFrequency, setCreateFrequency] = useState<FrequencyOption | "">("");
  const [showCreateMedicationOptions, setShowCreateMedicationOptions] = useState(false);
  const [showCreateDosageOptions, setShowCreateDosageOptions] = useState(false);
  const [showCreateFrequencyOptions, setShowCreateFrequencyOptions] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | null>(null);
  const [updateMedication, setUpdateMedication] = useState("");
  const [updateDosage, setUpdateDosage] = useState("");
  const [updateQuantity, setUpdateQuantity] = useState("");
  const [updateRefillOn, setUpdateRefillOn] = useState("");
  const [updateFrequency, setUpdateFrequency] = useState<FrequencyOption | "">("");
  const [showUpdateMedicationOptions, setShowUpdateMedicationOptions] = useState(false);
  const [showUpdateDosageOptions, setShowUpdateDosageOptions] = useState(false);
  const [showUpdateFrequencyOptions, setShowUpdateFrequencyOptions] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const { notifySuccess } = useNotifications();

  const frequencyOptions = prescriptionFrequencyOptions as Array<{ label: string; value: FrequencyOption }>;

  const load = useCallback(async () => {
    if (!Number.isFinite(targetUserId)) {
      setError("Invalid patient ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [upcoming, allPrescriptions] = await Promise.all([
        apiService.listUpcomingPrescriptions(targetUserId),
        apiService.listAllPrescriptions(targetUserId),
      ]);
      setTimelineRows(upcoming);
      setMedicationRows(allPrescriptions);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prescriptions.");
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCreateModal = () => {
    setCreateMedication("");
    setCreateDosage("");
    setCreateQuantity("");
    setCreateRefillOn("");
    setCreateFrequency("");
    setShowCreateMedicationOptions(false);
    setShowCreateDosageOptions(false);
    setShowCreateFrequencyOptions(false);
    setCreateError("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (createSubmitting) return;
    setShowCreateModal(false);
    setShowCreateMedicationOptions(false);
    setShowCreateDosageOptions(false);
    setShowCreateFrequencyOptions(false);
    setCreateError("");
  };

  const submitCreatePrescription = async () => {
    const quantity = Number(createQuantity.trim());
    if (!createMedication || !createDosage || !createQuantity.trim() || !createRefillOn.trim() || !createFrequency || createFrequency === "none") {
      setCreateError("All fields are required.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setCreateError("Quantity must be a number greater than 0.");
      return;
    }
    if (!isValidIsoDateOnly(createRefillOn)) {
      setCreateError("Refill on must be in YYYY-MM-DD format.");
      return;
    }

    setCreateError("");
    setCreateSubmitting(true);
    try {
      await apiService.createPrescription(targetUserId, {
        medication: createMedication,
        dosage: createDosage,
        quantity,
        refill_on: createRefillOn.trim(),
        refill_schedule: createFrequency,
      });
      setShowCreateModal(false);
      notifySuccess("Prescription added successfully.");
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create prescription.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openUpdateModal = (item: MedicationRow) => {
    setEditingPrescriptionId(item.id);
    setUpdateMedication(item.medication);
    setUpdateDosage(item.dosage);
    setUpdateQuantity(String(item.quantity));
    setUpdateRefillOn(item.refill_on.slice(0, 10));
    const normalized = item.refill_schedule.toLowerCase() as FrequencyOption;
    setUpdateFrequency(frequencyOptions.some((option) => option.value === normalized) ? normalized : "");
    setShowUpdateMedicationOptions(false);
    setShowUpdateDosageOptions(false);
    setShowUpdateFrequencyOptions(false);
    setUpdateError("");
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    if (updateSubmitting) return;
    setShowUpdateModal(false);
    setEditingPrescriptionId(null);
    setShowUpdateMedicationOptions(false);
    setShowUpdateDosageOptions(false);
    setShowUpdateFrequencyOptions(false);
    setUpdateError("");
  };

  const submitUpdatePrescription = async () => {
    if (!editingPrescriptionId) return;
    const quantity = Number(updateQuantity.trim());
    if (!updateMedication || !updateDosage || !updateQuantity.trim() || !updateRefillOn.trim() || !updateFrequency || updateFrequency === "none") {
      setUpdateError("All fields are required.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setUpdateError("Quantity must be a number greater than 0.");
      return;
    }
    if (!isValidIsoDateOnly(updateRefillOn)) {
      setUpdateError("Refill on must be in YYYY-MM-DD format.");
      return;
    }

    setUpdateError("");
    setUpdateSubmitting(true);
    try {
      await apiService.updatePrescription(targetUserId, editingPrescriptionId, {
        medication: updateMedication,
        dosage: updateDosage,
        quantity,
        refill_on: updateRefillOn.trim(),
        refill_schedule: updateFrequency,
      });
      closeUpdateModal();
      await load();
      notifySuccess("Prescription updated successfully.");
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update prescription.");
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const confirmDeletePrescription = (item: MedicationRow) => {
    crossPlatformAlert(
      "Delete",
      `Delete prescription ${item.medication} (${item.dosage})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionBusyId(item.id);
              await apiService.deletePrescription(targetUserId, item.id);
              setError("");
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to delete prescription.");
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
            { key: "timeline", label: "Refill Timeline" },
            { key: "medications", label: "My Medications" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={ui.container}>
        {loading ? (
          <Text style={ui.emptyStateText}>Loading prescriptions...</Text>
        ) : activeTab === "timeline" ? (
          <>
            {timelineRows.map((item, index) => (
              <View key={`${item.medication}-${item.refill_on}-${index}`} style={[ui.card, ui.elevatedCard]}>
                <View style={ui.appointmentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[ui.appointmentProviderText, ui.medicationTitleText]}>{item.medication}</Text>
                    <Text style={[ui.dosageIndented, ui.medicationDetailText]}>
                      {item.dosage} x {item.quantity}
                    </Text>
                  </View>
                  <Text style={ui.appointmentDateText}>{formatDate(item.refill_on)}</Text>
                </View>
              </View>
            ))}
            {!timelineRows.length && <Text style={ui.emptyStateText}>No upcoming refills</Text>}
          </>
        ) : (
          <>
            <Pressable style={ui.buttonAddAppointment} onPress={openCreateModal}>
              <Text style={ui.buttonText}>Add Prescription</Text>
            </Pressable>
            {medicationRows.map((item) => (
              <View key={item.id} style={[ui.card, ui.elevatedCard]}>
                <View style={ui.providerCardRow}>
                  <View style={ui.providerCardContent}>
                    <Text style={ui.medicationTitleText}>{item.medication}</Text>
                    <Text style={ui.medicationDetailText}>Dosage: {item.dosage}</Text>
                    <Text style={ui.medicationDetailText}>Quantity: {item.quantity}</Text>
                    <Text style={ui.medicationDetailText}>Start date: {formatDate(item.refill_on)}</Text>
                    <Text style={ui.medicationDetailText}>Frequency: {formatTitleCaseLabel(item.refill_schedule)}</Text>
                  </View>
                  <View style={ui.providerCardActions}>
                    <Pressable
                      style={ui.iconButton}
                      onPress={() => openUpdateModal(item)}
                      disabled={updateSubmitting || actionBusyId === item.id}
                    >
                      <Image source={require("../../../../assets/pencil.png")} style={ui.iconImage} />
                    </Pressable>
                    <Pressable
                      style={ui.iconButton}
                      onPress={() => confirmDeletePrescription(item)}
                      disabled={updateSubmitting || actionBusyId === item.id}
                    >
                      <Image source={require("../../../../assets/delete.png")} style={ui.iconImage} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
            {!medicationRows.length && <Text style={ui.emptyStateText}>No medications found.</Text>}
          </>
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={closeCreateModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={ui.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closeCreateModal}
            disabled={createSubmitting}
            accessibilityLabel="Close create prescription dialog"
          />
          <View style={ui.modalCard}>
            <Text style={[ui.subheading, ui.headingCentered]}>Add Prescription</Text>

            <Text style={ui.label}>Medication</Text>
            <View style={[ui.selectFieldWrap, { zIndex: showCreateMedicationOptions ? 80 : 60 }]}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowCreateMedicationOptions((v) => !v)}
                disabled={createSubmitting}
              >
                <Text style={ui.selectControlText}>{createMedication || "Select medication"}</Text>
                <Text style={ui.muted}>{showCreateMedicationOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showCreateMedicationOptions && (
                <View style={ui.selectOptionsWrap}>
                  {medicationOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[ui.selectOption, option === createMedication && ui.selectOptionActive]}
                      onPress={() => {
                        setCreateMedication(option);
                        setShowCreateMedicationOptions(false);
                      }}
                      disabled={createSubmitting}
                    >
                      <Text style={option === createMedication ? ui.tabLabelActive : ui.tabLabelInactive}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Text style={ui.label}>Dosage</Text>
            <View style={[ui.selectFieldWrap, { zIndex: showCreateDosageOptions ? 70 : 50 }]}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowCreateDosageOptions((v) => !v)}
                disabled={createSubmitting}
              >
                <Text style={ui.selectControlText}>{createDosage || "Select dosage"}</Text>
                <Text style={ui.muted}>{showCreateDosageOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showCreateDosageOptions && (
                <ScrollView
                  style={[ui.selectOptionsWrap, { maxHeight: 210 }]}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {dosageOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[ui.selectOption, option === createDosage && ui.selectOptionActive]}
                      onPress={() => {
                        setCreateDosage(option);
                        setShowCreateDosageOptions(false);
                      }}
                      disabled={createSubmitting}
                    >
                      <Text style={option === createDosage ? ui.tabLabelActive : ui.tabLabelInactive}>{option}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <Text style={ui.label}>Quantity</Text>
            <TextInput
              style={ui.input}
              value={createQuantity}
              onChangeText={setCreateQuantity}
              keyboardType="numeric"
              editable={!createSubmitting}
              placeholder="Enter quantity"
            />

            <Text style={ui.label}>Refill on</Text>
            <TextInput
              style={ui.input}
              placeholder="YYYY-MM-DD"
              value={createRefillOn}
              onChangeText={setCreateRefillOn}
              autoCapitalize="none"
              editable={!createSubmitting}
            />

            <Text style={ui.label}>Refill Frequency</Text>
            <View style={[ui.selectFieldWrap, { zIndex: showCreateFrequencyOptions ? 60 : 40 }]}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowCreateFrequencyOptions((v) => !v)}
                disabled={createSubmitting}
              >
                <Text style={ui.selectControlText}>
                  {frequencyOptions.find((option) => option.value === createFrequency)?.label ?? "Select frequency"}
                </Text>
                <Text style={ui.muted}>{showCreateFrequencyOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showCreateFrequencyOptions && (
                <ScrollView
                  style={[ui.selectOptionsWrap, { maxHeight: 126 }]}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {frequencyOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[ui.selectOption, option.value === createFrequency && ui.selectOptionActive]}
                      onPress={() => {
                        setCreateFrequency(option.value);
                        setShowCreateFrequencyOptions(false);
                      }}
                      disabled={createSubmitting}
                    >
                      <Text style={option.value === createFrequency ? ui.tabLabelActive : ui.tabLabelInactive}>{option.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {!!createError && <Text style={{ color: "#B42318", fontSize: 13, textAlign: "center" }}>{createError}</Text>}

            <View style={ui.modalFooterRow}>
              <Pressable
                style={[ui.buttonSecondary, ui.modalButtonFlex, createSubmitting && { opacity: 0.6 }]}
                onPress={closeCreateModal}
                disabled={createSubmitting}
              >
                <Text style={ui.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[ui.button, ui.modalButtonFlex, createSubmitting && { opacity: 0.6 }]}
                onPress={submitCreatePrescription}
                disabled={createSubmitting}
              >
                <Text style={ui.buttonText}>{createSubmitting ? "Creating..." : "Add"}</Text>
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
            accessibilityLabel="Close update prescription dialog"
          />
          <View style={ui.modalCard}>
            <Text style={[ui.subheading, ui.headingCentered]}>Update Prescription</Text>

            <Text style={ui.label}>Medication</Text>
            <View style={[ui.selectFieldWrap, { zIndex: showUpdateMedicationOptions ? 80 : 60 }]}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowUpdateMedicationOptions((v) => !v)}
                disabled={updateSubmitting}
              >
                <Text style={ui.selectControlText}>{updateMedication || "Select medication"}</Text>
                <Text style={ui.muted}>{showUpdateMedicationOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showUpdateMedicationOptions && (
                <View style={ui.selectOptionsWrap}>
                  {medicationOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[ui.selectOption, option === updateMedication && ui.selectOptionActive]}
                      onPress={() => {
                        setUpdateMedication(option);
                        setShowUpdateMedicationOptions(false);
                      }}
                      disabled={updateSubmitting}
                    >
                      <Text style={option === updateMedication ? ui.tabLabelActive : ui.tabLabelInactive}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Text style={ui.label}>Dosage</Text>
            <View style={[ui.selectFieldWrap, { zIndex: showUpdateDosageOptions ? 70 : 50 }]}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowUpdateDosageOptions((v) => !v)}
                disabled={updateSubmitting}
              >
                <Text style={ui.selectControlText}>{updateDosage || "Select dosage"}</Text>
                <Text style={ui.muted}>{showUpdateDosageOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showUpdateDosageOptions && (
                <View style={ui.selectOptionsWrap}>
                  {dosageOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[ui.selectOption, option === updateDosage && ui.selectOptionActive]}
                      onPress={() => {
                        setUpdateDosage(option);
                        setShowUpdateDosageOptions(false);
                      }}
                      disabled={updateSubmitting}
                    >
                      <Text style={option === updateDosage ? ui.tabLabelActive : ui.tabLabelInactive}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Text style={ui.label}>Quantity</Text>
            <TextInput
              style={ui.input}
              value={updateQuantity}
              onChangeText={setUpdateQuantity}
              keyboardType="numeric"
              editable={!updateSubmitting}
              placeholder="Enter quantity"
            />

            <Text style={ui.label}>Refill on</Text>
            <TextInput
              style={ui.input}
              placeholder="YYYY-MM-DD"
              value={updateRefillOn}
              onChangeText={setUpdateRefillOn}
              autoCapitalize="none"
              editable={!updateSubmitting}
            />

            <Text style={ui.label}>Refill Frequency</Text>
            <View style={[ui.selectFieldWrap, { zIndex: showUpdateFrequencyOptions ? 60 : 40 }]}>
              <Pressable
                style={ui.selectControl}
                onPress={() => setShowUpdateFrequencyOptions((v) => !v)}
                disabled={updateSubmitting}
              >
                <Text style={ui.selectControlText}>
                  {frequencyOptions.find((option) => option.value === updateFrequency)?.label ?? "Select frequency"}
                </Text>
                <Text style={ui.muted}>{showUpdateFrequencyOptions ? "Hide" : "Select"}</Text>
              </Pressable>
              {showUpdateFrequencyOptions && (
                <View style={ui.selectOptionsWrap}>
                  {frequencyOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[ui.selectOption, option.value === updateFrequency && ui.selectOptionActive]}
                      onPress={() => {
                        setUpdateFrequency(option.value);
                        setShowUpdateFrequencyOptions(false);
                      }}
                      disabled={updateSubmitting}
                    >
                      <Text style={option.value === updateFrequency ? ui.tabLabelActive : ui.tabLabelInactive}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {!!updateError && <Text style={{ color: "#B42318", fontSize: 13, textAlign: "center" }}>{updateError}</Text>}

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
                onPress={submitUpdatePrescription}
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
