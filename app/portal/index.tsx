import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useSession } from "../../src/auth/session";
import { apiService } from "../../src/services/apiService";
import { formatDate, formatUtcDateTimeToLocal, isWithinNextSevenDays } from "../../src/utils/date";
import { ui } from "../../src/ui/styles";

export default function PortalHome() {
  const { user, token, logout } = useSession();
  const confirmLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const [appointments, setAppointments] = useState<Array<{ provider: string; datetime: string }>>([]);
  const [refills, setRefills] = useState<Array<{ medication: string; refill_on: string }>>([]);

  useEffect(() => {
    const load = async () => {
      if (!user || !token) return;
      try {
        const [appointmentRows, refillRows] = await Promise.all([
          apiService.getPortalAppointments(user.id, token),
          apiService.getPortalPrescriptions(user.id, token),
        ]);
        setAppointments(appointmentRows.filter((item) => isWithinNextSevenDays(item.datetime)));
        setRefills(refillRows.filter((item) => isWithinNextSevenDays(item.refill_on)));
      } catch {
        setAppointments([]);
        setRefills([]);
      }
    };
    load();
  }, [user, token]);

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={ui.screen}>
      <ScrollView contentContainerStyle={ui.container}>
        <Text style={[ui.heading, ui.headingCentered]}>Dashboard</Text>
        <Text style={ui.welcomeText}>Welcome back, {user.name}!</Text>

        <View style={[ui.card, ui.elevatedCard]}>
          <Text style={[ui.subheading, ui.headingCentered]}>Your Information</Text>
          <Text>Patient ID: {user.id}</Text>
          <Text>Name: {user.name}</Text>
          <Text>Email: {user.email}</Text>
        </View>

        <View style={[ui.card, ui.elevatedCard]}>
          <Text style={[ui.subheading, ui.headingCentered]}>Upcoming Appointments</Text>
          {appointments.slice(0, 3).map((item, index, rows) => (
            <View key={`${item.provider}-${item.datetime}-${index}`} style={[ui.appointmentRow, index < rows.length - 1 && ui.rowDivider]}>
              <Text style={ui.appointmentProviderText}>{item.provider}</Text>
              <Text style={ui.appointmentDateText}>{formatUtcDateTimeToLocal(item.datetime)}</Text>
            </View>
          ))}
          {!appointments.length && <Text style={ui.emptyStateText}>No upcoming appointments</Text>}
        </View>

        <View style={[ui.card, ui.elevatedCard]}>
          <Text style={[ui.subheading, ui.headingCentered]}>Upcoming Prescription Refills</Text>
          {refills.slice(0, 3).map((item, index, rows) => (
            <View key={`${item.medication}-${item.refill_on}-${index}`} style={[ui.appointmentRow, index < rows.length - 1 && ui.rowDivider]}>
              <Text style={ui.appointmentProviderText}>{item.medication}</Text>
              <Text style={ui.appointmentDateText}>{formatDate(item.refill_on)}</Text>
            </View>
          ))}
          {!refills.length && <Text style={ui.emptyStateText}>No upcoming refills</Text>}
        </View>

        <View style={ui.rowCentered}>
          <Pressable style={[ui.buttonDanger, ui.logoutButton]} onPress={confirmLogout}>
            <Text style={[ui.dangerText, ui.logoutText]}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}