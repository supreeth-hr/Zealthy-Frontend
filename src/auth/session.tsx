import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { apiService } from "../services/apiService";
import { SessionState, SessionUser } from "../services/types";

type SessionContextType = {
  user: SessionUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SESSION_KEY = "zealthy_session";
const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw) as SessionState;
          setUser(session.user);
          setToken(session.token);
        }
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const value = useMemo<SessionContextType>(
    () => ({
      user,
      token,
      loading,
      login: async (email, password) => {
        const response = await apiService.login(email, password);
        setUser(response.user);
        setToken(response.token);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(response));
      },
      logout: async () => {
        setUser(null);
        setToken(null);
        await AsyncStorage.removeItem(SESSION_KEY);
      },
    }),
    [user, token, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
};
