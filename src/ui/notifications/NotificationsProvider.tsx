import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type NoticeKind = "success" | "error" | "info";

type Notice = {
  id: string;
  kind: NoticeKind;
  title?: string;
  message: string;
};

type NotificationsApi = {
  notifySuccess: (message: string, opts?: { title?: string; durationMs?: number }) => void;
  notifyError: (message: string, opts?: { title?: string; durationMs?: number }) => void;
  notifyInfo: (message: string, opts?: { title?: string; durationMs?: number }) => void;
  clear: () => void;
};

const NotificationsContext = createContext<NotificationsApi | null>(null);

const DEFAULT_DURATION_MS = 2600;

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotice(null);
  }, []);

  const push = useCallback(
    (kind: NoticeKind, message: string, opts?: { title?: string; durationMs?: number }) => {
      const next: Notice = { id: randomId(), kind, message, title: opts?.title };
      setNotice(next);

      const durationMs = opts?.durationMs ?? DEFAULT_DURATION_MS;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setNotice((current) => (current?.id === next.id ? null : current));
        timeoutRef.current = null;
      }, durationMs);
    },
    []
  );

  const api = useMemo<NotificationsApi>(
    () => ({
      notifySuccess: (message, opts) => push("success", message, { title: opts?.title ?? "Success", durationMs: opts?.durationMs }),
      notifyError: (message, opts) => push("error", message, { title: opts?.title ?? "Error", durationMs: opts?.durationMs ?? 3600 }),
      notifyInfo: (message, opts) => push("info", message, { title: opts?.title ?? "Info", durationMs: opts?.durationMs }),
      clear,
    }),
    [push, clear]
  );

  return (
    <NotificationsContext.Provider value={api}>
      {children}
      {!!notice && (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            onPress={clear}
            style={[styles.toast, notice.kind === "success" && styles.toastSuccess, notice.kind === "error" && styles.toastError]}
          >
            {!!notice.title && <Text style={styles.toastTitle}>{notice.title}</Text>}
            <Text style={styles.toastMessage}>{notice.message}</Text>
          </Pressable>
        </View>
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsApi {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: Platform.OS === "web" ? 14 : 54,
    alignItems: "center",
    zIndex: 10000,
    elevation: 20,
    paddingHorizontal: 12,
  },
  toast: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    borderColor: "#E7E8EF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  toastSuccess: {
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
  },
  toastError: {
    borderColor: "#FDA4AF",
    backgroundColor: "#FFF1F2",
  },
  toastTitle: { color: "#0F172A", fontSize: 14, fontWeight: "800", marginBottom: 2 },
  toastMessage: { color: "#0F172A", fontSize: 14, fontWeight: "600" },
});

