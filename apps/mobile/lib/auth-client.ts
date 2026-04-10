import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, customSessionClient } from "better-auth/client/plugins";
import { Auth } from "../../api/auth";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
    baseURL:  "http://192.168.201.16:4000", // Base URL of your Better Auth backend.
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

export const { useSession, signIn, signUp, signOut, phoneNumber, updateUser, changeEmail } = authClient;