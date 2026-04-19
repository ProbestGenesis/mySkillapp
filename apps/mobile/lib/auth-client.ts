import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, customSessionClient } from "better-auth/client/plugins";
import { Auth } from "../../api/auth";
import * as SecureStore from "expo-secure-store";

const secureStoreWrapper = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};


export const authClient = createAuthClient({
    baseURL:   process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:4000", // Base URL of your Better Auth backend.
    plugins: [
        expoClient({
            scheme: process.env.EXPO_SCHEME ?? "skillmap",
            storagePrefix: "skillmap",
            storage: SecureStore,
        }),
        phoneNumberClient(),
        customSessionClient<Auth>(),
    ]
});

export const { useSession, signIn, signUp, signOut, phoneNumber, updateUser, changeEmail } =  authClient;