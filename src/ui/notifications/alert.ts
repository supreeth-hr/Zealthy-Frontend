import { Alert, Platform } from "react-native";

type AlertButton = {
  text?: string;
  onPress?: (() => void) | undefined;
  style?: "default" | "cancel" | "destructive";
};

type AlertButtons = AlertButton[];

function stringify(title?: string, message?: string) {
  if (title && message) return `${title}\n\n${message}`;
  return title || message || "";
}

export function crossPlatformAlert(title: string, message?: string, buttons?: AlertButtons) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const w = typeof window !== "undefined" ? window : null;
  if (!w) return;

  if (!buttons || buttons.length === 0) {
    w.alert(stringify(title, message));
    return;
  }

  const cancel = buttons.find((b) => b.style === "cancel") ?? buttons[0];
  const destructiveOrDefault = buttons.find((b) => b.style === "destructive") ?? buttons.find((b) => b.style === "default") ?? buttons[buttons.length - 1];

  const okText = destructiveOrDefault.text ?? "OK";
  const cancelText = cancel.text ?? "Cancel";

  const confirmed = w.confirm(`${stringify(title, message)}\n\n${okText} / ${cancelText}`);
  if (confirmed) destructiveOrDefault.onPress?.();
  else cancel.onPress?.();
}

