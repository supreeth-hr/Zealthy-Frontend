import { Stack } from "expo-router";
import { SessionProvider } from "../src/auth/session";

export default function RootLayout() {
  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}