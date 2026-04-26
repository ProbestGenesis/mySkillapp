import { Stack } from 'expo-router'
import React from 'react'

type Props = {}

function _layout({}: Props) {
  return (
    <Stack>
        <Stack.Screen name='index' options={{
          title: "Services"
        }} />
    </Stack>
  )
}

export default _layout