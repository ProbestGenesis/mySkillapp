import { Stack } from 'expo-router'
import React from 'react'

type Props = {}

function _layout({}: Props) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}

export default _layout