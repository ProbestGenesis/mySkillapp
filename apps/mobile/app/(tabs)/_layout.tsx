import EmailandNameDrawer from '@/components/ui/utils/auth/emailandNameDrawer';
import PhoneVerificationDrawer from '@/components/ui/utils/auth/phoneVerificationDrawer';
import {
  VerificationGateProvider,
  useVerificationGate,
} from '@/components/ui/utils/auth/verificationGateContext';
import { useSession } from '@/lib/auth-client';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

type Props = {};

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const NUMERIC_NAME_REGEX = /^\d+$/;

function GateAwareTabsLayout() {
  const { data: session } = useSession();
  const { criticalRequest, clearCriticalVerification } = useVerificationGate();

  const [showPhoneDrawer, setShowPhoneDrawer] = useState(false);
  const [showIdentityDrawer, setShowIdentityDrawer] = useState(false);
  const [dismissedPhoneGate, setDismissedPhoneGate] = useState(false);
  const [dismissedIdentityGate, setDismissedIdentityGate] = useState(false);
  const [criticalModeActive, setCriticalModeActive] = useState(false);

  const createdAt = session?.user
    ? new Date((session.user as Record<string, unknown>).createdAt as string)
    : null;
  const accountIsOlderThan6Hours = !!createdAt && !Number.isNaN(createdAt.getTime())
    ? Date.now() - createdAt.getTime() >= SIX_HOURS_MS
    : false;

  const needsPhoneVerification = Boolean(session?.user && !session.user.phoneNumberVerified);

  const needsNameUpdate = useMemo(() => {
    const rawName = session?.user?.name?.trim();
    if (!rawName) return false;
    return NUMERIC_NAME_REGEX.test(rawName);
  }, [session?.user?.name]);

  useEffect(() => {
    if (!session?.user) {
      setShowPhoneDrawer(false);
      setShowIdentityDrawer(false);
      setCriticalModeActive(false);
      clearCriticalVerification();
      return;
    }

    if (!needsPhoneVerification) {
      setDismissedPhoneGate(false);
    }

    if (!needsNameUpdate) {
      setDismissedIdentityGate(false);
    }

    if (criticalRequest) {
      const target = criticalRequest.target;
      setCriticalModeActive(true);

      if ((target === 'phone' || target === 'auto') && needsPhoneVerification) {
        setShowPhoneDrawer(true);
        setShowIdentityDrawer(false);
        return;
      }

      if ((target === 'identity' || target === 'auto') && needsNameUpdate) {
        setShowPhoneDrawer(false);
        setShowIdentityDrawer(true);
        return;
      }

      clearCriticalVerification();
      setCriticalModeActive(false);
      setShowPhoneDrawer(false);
      setShowIdentityDrawer(false);
      return;
    }

    setCriticalModeActive(false);

    if (!accountIsOlderThan6Hours) {
      setShowPhoneDrawer(false);
      return;
    }

    if (needsPhoneVerification && !dismissedPhoneGate) {
      setShowPhoneDrawer(true);
      setShowIdentityDrawer(false);
      return;
    }

    if (needsNameUpdate && !dismissedIdentityGate) {
      setShowPhoneDrawer(false);
      setShowIdentityDrawer(true);
      return;
    }

    setShowPhoneDrawer(false);
    setShowIdentityDrawer(false);
  }, [
    session?.user,
    needsPhoneVerification,
    needsNameUpdate,
    accountIsOlderThan6Hours,
    dismissedPhoneGate,
    dismissedIdentityGate,
    criticalRequest,
    clearCriticalVerification,
  ]);

  const handlePhoneVerified = () => {
    setShowPhoneDrawer(false);

    if (needsNameUpdate) {
      setShowIdentityDrawer(true);
      return;
    }

    clearCriticalVerification();
    setCriticalModeActive(false);
  };

  const handlePhoneClose = () => {
    setShowPhoneDrawer(false);

    if (!criticalModeActive) {
      setDismissedPhoneGate(true);
      return;
    }

    clearCriticalVerification();
    setCriticalModeActive(false);
  };

  const handleIdentityClose = () => {
    setShowIdentityDrawer(false);

    if (!criticalModeActive) {
      setDismissedIdentityGate(true);
      return;
    }

    clearCriticalVerification();
    setCriticalModeActive(false);
  };

  return (
    <View className="flex-1">
      <Tabs screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ size, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={focused ? '#000' : '#ccc'}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            title: 'Services',
            tabBarIcon: ({ size, focused }) => (
              <MaterialIcons
                name="home-repair-service"
                size={size}
                color={focused ? '#000' : '#ccc'}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="store"
          options={{
            title: 'Marketplace',
            tabBarIcon: ({ size, focused }) => (
              <Ionicons
                name={focused ? 'storefront' : 'storefront-outline'}
                size={size}
                color={focused ? '#000' : '#ccc'}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="reels"
          options={{
            title: 'Reels',
            tabBarIcon: ({ size, focused }) => (
              <Ionicons
                name={focused ? 'play-circle' : 'play-circle-outline'}
                size={size}
                color={focused ? '#000' : '#ccc'}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ size, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={size}
                color={focused ? '#000' : '#ccc'}
              />
            ),
          }}
        />
      </Tabs>

      <PhoneVerificationDrawer
        visible={showPhoneDrawer}
        phone={session?.user?.phoneNumber}
        onVerified={handlePhoneVerified}
        onClose={handlePhoneClose}
        isCriticalMode={criticalModeActive}
      />

      <EmailandNameDrawer
        visible={showIdentityDrawer}
        onClose={handleIdentityClose}
        isCriticalMode={criticalModeActive}
      />
    </View>
  );
}

function _layout({}: Props) {
  return (
    <VerificationGateProvider>
      <GateAwareTabsLayout />
    </VerificationGateProvider>
  );
}

export default _layout;
