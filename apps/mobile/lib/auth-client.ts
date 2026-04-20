import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, customSessionClient } from "better-auth/client/plugins";
import { Auth } from "../../api/auth";
import * as SecureStore from "expo-secure-store";




export const authClient = createAuthClient({
    baseURL:   process.env.EXPO_PUBLIC_SERVER_URL ?? "https://api-production-d535.up.railway.app", 
    plugins: [
        expoClient({
            scheme: process.env.EXPO_SCHEME ?? "skillmap",
            storagePrefix: "skillmap",
            storage: SecureStore,
        }),
        phoneNumberClient(),
        customSessionClient<Auth>(),
    ],
    storage: {
      async getItem(key:any) {
        return await SecureStore.getItemAsync(key);
      },
      async setItem(key:any, value:any) {
        await SecureStore.setItemAsync(key, value);
      },
      async removeItem(key:any) {
        await SecureStore.deleteItemAsync(key);
      },
    },
});

export const { useSession, signIn, signUp, signOut, phoneNumber, updateUser, changeEmail } =  authClient;