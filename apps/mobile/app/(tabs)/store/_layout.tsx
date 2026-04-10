import { Stack } from 'expo-router'
import React from 'react'

type Props = {}

function StoreLayout({}: Props) {
  return (
    <Stack>
        <Stack.Screen name='index' options={{headerShown: false}} />
    </Stack>
  )
}

export default StoreLayout