import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

export default function StoreNewScreen() {
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [error, setError] = useState('')

  const createMutation = useMutation(
    trpc.store.createItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.store.listItems.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.store.getMyItems.queryKey() })
        router.replace('/(tabs)/store')
      },
    })
  )

  const onSubmit = () => {
    setError('')
    const parsedPrice = Number(price)
    if (!title || !description || !price || Number.isNaN(parsedPrice)) {
      setError('Veuillez remplir correctement les champs obligatoires.')
      return
    }
    createMutation.mutate({
      title,
      description,
      price: parsedPrice,
      city: city || undefined,
      district: district || undefined,
      phoneNumber: phoneNumber || undefined,
      whatsappNumber: whatsappNumber || undefined,
      contactEmail: contactEmail || undefined,
    })
  }

  if (!session) {
    router.replace('/auth')
    return null
  }

  return (
    <ScrollView className="flex-1 px-4 py-3">
      <View className="gap-3 pb-10">
        <Text className="text-xl font-bold">Nouvelle annonce</Text>
        <Input placeholder="Titre" value={title} onChangeText={setTitle} />
        <Textarea
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          className="min-h-[120px]"
        />
        <Input placeholder="Prix (FCFA)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <Input placeholder="Ville (optionnel)" value={city} onChangeText={setCity} />
        <Input placeholder="Quartier (optionnel)" value={district} onChangeText={setDistrict} />
        <Text className="text-base font-semibold">Options de contact annonceur</Text>
        <Input placeholder="Téléphone" value={phoneNumber} onChangeText={setPhoneNumber} />
        <Input placeholder="WhatsApp" value={whatsappNumber} onChangeText={setWhatsappNumber} />
        <Input placeholder="Email" value={contactEmail} onChangeText={setContactEmail} />

        {error ? <Text className="text-destructive">{error}</Text> : null}
        {createMutation.isError ? (
          <Text className="text-destructive">{createMutation.error?.message}</Text>
        ) : null}

        <Button onPress={onSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-bold text-white">Publier</Text>
          )}
        </Button>
      </View>
    </ScrollView>
  )
}
