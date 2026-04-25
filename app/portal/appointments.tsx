import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { TabSwitchRow } from "../../src/components/TabSwitchRow";
import { useSession } from "../../src/auth/session";
import { AppointmentListItem } from "../../src/services/api/types";
import { apiService } from "../../src/services/apiService";
import { formatUtcDateTimeToLocal } from "../../src/utils/date";
import { formatTitleCaseLabel } from "../../src/utils/format";
import { ui } from "../../src/ui/styles";

type Row = AppointmentListItem;
type TabKey = "schedule" | "providers";

export default function PortalAppointments() {
  const { user, token } = useSession();
  const [scheduleRows, setScheduleRows] = useState<Row[]>([]);
  const [providerRows, setProviderRows] = useState<Row[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }

    const load = async () => {
      if (!token) return;
      const [allAppointments, uniqueAppointments] = await Promise.all([
        apiService.getPortalAppointments(user.id, token),
        apiService.getPortalUniqueAppointments(user.id, token),
      ]);
      setScheduleRows(allAppointments);
      setProviderRows(uniqueAppointments);
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
            { key: "schedule", label: "Upcoming Schedule" },
            { key: "providers", label: "My Providers" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={ui.container}>
        {activeTab === "schedule" ? (
          <>
            {scheduleRows.map((item, index) => (
              <View key={`${item.provider}-${item.datetime}-${index}`} style={[ui.card, ui.elevatedCard]}>
                <View style={ui.appointmentRow}>
                  <Text style={ui.appointmentProviderText}>{item.provider}</Text>
                  <Text style={ui.appointmentDateText}>{formatUtcDateTimeToLocal(item.datetime)}</Text>
                </View>
              </View>
            ))}
            {!scheduleRows.length && <Text style={ui.emptyStateText}>No upcoming Appointments</Text>}
          </>
        ) : (
          <>
            {providerRows.map((provider) => (
              <View key={`${provider.provider}-${provider.datetime}`} style={[ui.card, ui.elevatedCard]}>
                <Text style={ui.subheading}>{provider.provider}</Text>
                <Text>Start Date and Time: {formatUtcDateTimeToLocal(provider.datetime)}</Text>
                <Text>Frequency: {formatTitleCaseLabel(provider.repeat)}</Text>
              </View>
            ))}
            {!providerRows.length && <Text style={ui.emptyStateText}>No providers found</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}