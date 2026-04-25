import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { TabSwitchRow } from "../../src/components/TabSwitchRow";
import { useSession } from "../../src/auth/session";
import { PortalPrescriptionRow, PrescriptionTimelineItem } from "../../src/services/api/types";
import { apiService } from "../../src/services/apiService";
import { formatDate } from "../../src/utils/date";
import { formatTitleCaseLabel } from "../../src/utils/format";
import { ui } from "../../src/ui/styles";

type TimelineRow = PrescriptionTimelineItem;
type MedicationRow = PortalPrescriptionRow;
type TabKey = "timeline" | "medications";

export default function PortalPrescriptions() {
  const { user, token } = useSession();
  const [timelineRows, setTimelineRows] = useState<TimelineRow[]>([]);
  const [medicationRows, setMedicationRows] = useState<MedicationRow[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }

    const load = async () => {
      if (!token) return;
      const [allPrescriptions, uniquePrescriptions] = await Promise.all([
        apiService.getPortalPrescriptions(user.id, token),
        apiService.getPortalUniquePrescriptions(user.id, token),
      ]);
      setTimelineRows(allPrescriptions);
      setMedicationRows(uniquePrescriptions);
    };
    load();
  }, [user, token]);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={ui.screen}>
      <View style={ui.container}>
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
        {activeTab === "timeline" ? (
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
            {medicationRows.map((item, index) => (
              <View key={`details-${item.medication}-${item.refill_on}-${index}`} style={[ui.card, ui.elevatedCard]}>
                <Text style={ui.medicationTitleText}>{item.medication}</Text>
                <Text style={ui.medicationDetailText}>Dosage: {item.dosage}</Text>
                <Text style={ui.medicationDetailText}>Quantity: {item.quantity}</Text>
                <Text style={ui.medicationDetailText}>Start date: {formatDate(item.refill_on)}</Text>
                <Text style={ui.medicationDetailText}>Frequency: {formatTitleCaseLabel(item.refill_schedule)}</Text>
              </View>
            ))}
            {!medicationRows.length && <Text style={ui.emptyStateText}>No medications found.</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
