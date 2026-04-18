import { Stack } from 'expo-router'
import React from 'react'

type Props = {}

function StoreLayout({}: Props) {
  return (
    <Stack>
        <Stack.Screen name='index' options={{headerShown: false}} />
        <Stack.Screen name='new' options={{ title: 'Nouvelle annonce' }} />
        <Stack.Screen name='[itemId]' options={{ title: 'Détail annonce' }} />
        <Stack.Screen name='messages/index' options={{ title: 'Discussions' }} />
        <Stack.Screen name='messages/[conversationId]' options={{ title: 'Messagerie' }} />
    </Stack>
  )
}

export default StoreLayout