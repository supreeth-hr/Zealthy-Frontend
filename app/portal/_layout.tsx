import { Tabs } from "expo-router";
import { Image } from "react-native";

export default function PortalTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1740C8",
        tabBarInactiveTintColor: "#667085",
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 80,
          paddingBottom: 7,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/home.png")}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarLabel: "Appointments",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/schedule.png")}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: "Prescriptions",
          tabBarLabel: "Prescriptions",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/pill.png")}
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
