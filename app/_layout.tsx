import React, { useEffect, useState } from "react";
import { Stack, useRouter, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem("auth:user");
        setAuthed(!!v);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inTabs = pathname?.startsWith("/(tabs)") ?? false;
    const inRoot = pathname === "/";
    if (!authed && inTabs) router.replace("/");
    else if (authed && inRoot) router.replace("/(tabs)");
  }, [loading, authed, pathname, router]);

  if (loading) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
