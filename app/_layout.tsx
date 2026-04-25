import { Stack } from "expo-router";
import { SessionProvider } from "../src/auth/session";
import { NotificationsProvider } from "../src/ui/notifications/NotificationsProvider";

export default function RootLayout() {
  return (
    <SessionProvider>
      <NotificationsProvider>
        <Stack
          screenOptions={{
            title: "Zealthy",
            headerTitleStyle: {
              fontSize: 25,
              fontWeight: "700",
            },
            headerStyle: {
              backgroundColor: "#FFFFFF",
            },
            headerShadowVisible: false,
          }}
        />
      </NotificationsProvider>
    </SessionProvider>
  );
}