import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { useSession } from "../src/auth/session";
import { ui } from "../src/ui/styles";

export const options = {
  title: "Login",
};

export default function LoginScreen() {
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setError("");
      setBusy(false);
    }, [])
  );

  const onLogin = async () => {
    try {
      setBusy(true);
      setError("");
      await login(email, password);
      router.replace("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={ui.screen}>
      <View style={[ui.container, ui.loginBlock]}>
        <Text style={[ui.heading, ui.headingCentered]}>Patient Portal</Text>

        <View style={[ui.card, ui.elevatedCard]}>
          <Text style={ui.label}>Email</Text>
          <TextInput
            style={ui.input}
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
          />
          <Text style={ui.label}>Password</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[ui.input, { paddingRight: 48 }]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
            />
            <Pressable
              onPress={() => setShowPassword((current) => !current)}
              style={{ marginRight:25,position: "absolute", right: 8, top: "50%", transform: [{ translateY: -12 }] }}
              hitSlop={8}
            >
              <Image
                source={showPassword ? require("../assets/hide.png") : require("../assets/visible.png")}
                style={{ width: 24, height: 24, resizeMode: "contain" }}
              />
            </Pressable>
          </View>
          {!!error && <Text style={{ color: "#B42318", textAlign: "center" }}>{error}</Text>}
          <Pressable style={ui.button} onPress={onLogin} disabled={busy}>
            <Text style={ui.buttonText}>{busy ? "Signing in..." : "Login"}</Text>
          </Pressable>
        </View>

        <Link href="/admin" asChild>
          <Pressable style={ui.visitAdminButton}>
            <Text style={[ui.secondaryText, ui.secondaryTextLarge]}>Visit Admin</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
