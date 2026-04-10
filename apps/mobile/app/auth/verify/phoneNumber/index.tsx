import { View, Text } from 'react-native'
import React from 'react'
import PhoneVerificationDrawer from '@/components/ui/utils/auth/phoneVerificationDrawer'
import { useLocalSearchParams } from 'expo-router'

type Props = {}

function index({}: Props) {
  const { phoneNumber } = useLocalSearchParams();
  return (
    <PhoneVerificationDrawer visible={true} phone={phoneNumber as string} onVerified={() => {}} onClose={() => {}} />
  )
}

export default index