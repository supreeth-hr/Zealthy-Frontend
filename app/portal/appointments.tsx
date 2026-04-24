import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useSession } from "../../src/auth/session";
import { apiService } from "../../src/services/apiService";
import { ui } from "../../src/ui/styles";

type Row = { provider: string; datetime: string; repeat: string };
type TabKey = "schedule" | "providers";

export default function PortalAppointments() {
  const { user, token } = useSession();
  const [scheduleRows, setScheduleRows] = useState<Row[]>([]);
  const [providerRows, setProviderRows] = useState<Row[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");

  const formatAppointmentDateTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatRepeatLabel = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return "";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

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
        {activeTab === "schedule" ? (
          <>
            {scheduleRows.map((item, index) => (
              <View key={`${item.provider}-${item.datetime}-${index}`} style={[ui.card, ui.elevatedCard]}>
                <View style={ui.appointmentRow}>
                  <Text style={ui.appointmentProviderText}>{item.provider}</Text>
                  <Text style={ui.appointmentDateText}>{formatAppointmentDateTime(item.datetime)}</Text>
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
                <Text>Start Date and Time: {formatAppointmentDateTime(provider.datetime)}</Text>
                <Text>Frequency: {formatRepeatLabel(provider.repeat)}</Text>
              </View>
            ))}
            {!providerRows.length && <Text style={ui.emptyStateText}>No providers found</Text>}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}