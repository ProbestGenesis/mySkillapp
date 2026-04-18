import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

export default function StoreItemDetailsScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>()
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [firstMessage, setFirstMessage] = useState('')

  const { data, isLoading } = useQuery({
    ...trpc.store.getItem.queryOptions({ itemId }),
    enabled: !!itemId,
  })

  const isOwner = useMemo(
    () => !!session?.user?.id && session.user.id === data?.ownerId,
    [session?.user?.id, data?.ownerId]
  )

  React.useEffect(() => {
    if (!data) return
    setTitle(data.title)
    setDescription(data.description)
    setPrice(String(data.price))
    setCity(data.city ?? '')
    setDistrict(data.district ?? '')
    setPhoneNumber(data.phoneNumber ?? '')
    setWhatsappNumber(data.whatsappNumber ?? '')
    setContactEmail(data.contactEmail ?? '')
  }, [data])

  const updateMutation = useMutation(
    trpc.store.updateItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.store.getItem.queryKey({ itemId }) })
        queryClient.invalidateQueries({ queryKey: trpc.store.listItems.queryKey() })
        setEditing(false)
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.store.deleteItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.store.listItems.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.store.getMyItems.queryKey() })
        router.replace('/(tabs)/store')
      },
    })
  )

  const startConversationMutation = useMutation(
    trpc.store.startConversation.mutationOptions({
      onSuccess: (conversation) => {
        router.push(`/(tabs)/store/messages/${conversation.id}`)
      },
    })
  )

  const onSave = () => {
    const parsedPrice = Number(price)
    if (!title || !description || Number.isNaN(parsedPrice)) return
    updateMutation.mutate({
      itemId,
      data: {
        title,
        description,
        price: parsedPrice,
        city: city || undefined,
        district: district || undefined,
        phoneNumber: phoneNumber || undefined,
        whatsappNumber: whatsappNumber || undefined,
        contactEmail: contactEmail || undefined,
      },
    })
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Annonce introuvable</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 px-4 py-3">
      <View className="gap-3 pb-10">
        <Card>
          <CardHeader>
            <CardTitle>{data.title}</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <Text>{data.description}</Text>
            <Text className="font-semibold">{data.price} FCFA</Text>
            <Text className="text-muted-foreground">
              {data.city || 'Ville N/A'} - {data.district || 'Quartier N/A'}
            </Text>
            <Text className="text-muted-foreground">Annonceur: {data.owner.name}</Text>
          </CardContent>
        </Card>

        {isOwner ? (
          <View className="gap-3">
            <Button variant="outline" onPress={() => setEditing((v) => !v)}>
              <Text>{editing ? 'Fermer édition' : 'Modifier'}</Text>
            </Button>

            {editing ? (
              <View className="gap-2">
                <Input value={title} onChangeText={setTitle} placeholder="Titre" />
                <Textarea value={description} onChangeText={setDescription} placeholder="Description" />
                <Input value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Prix" />
                <Input value={city} onChangeText={setCity} placeholder="Ville" />
                <Input value={district} onChangeText={setDistrict} placeholder="Quartier" />
                <Input value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Téléphone" />
                <Input value={whatsappNumber} onChangeText={setWhatsappNumber} placeholder="WhatsApp" />
                <Input value={contactEmail} onChangeText={setContactEmail} placeholder="Email" />
                <Button onPress={onSave} disabled={updateMutation.isPending}>
                  <Text className="font-bold text-white">Enregistrer</Text>
                </Button>
              </View>
            ) : null}

            <Button
              variant="destructive"
              onPress={() => deleteMutation.mutate({ itemId })}
              disabled={deleteMutation.isPending}>
              <Text className="font-bold text-white">Supprimer</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-2">
            <Text className="text-base font-semibold">Contacts annonceur</Text>
            <Text>Téléphone: {data.phoneNumber || 'Non renseigné'}</Text>
            <Text>WhatsApp: {data.whatsappNumber || 'Non renseigné'}</Text>
            <Text>Email: {data.contactEmail || 'Non renseigné'}</Text>

            <Textarea
              className="min-h-[100px]"
              placeholder="Votre message initial"
              value={firstMessage}
              onChangeText={setFirstMessage}
            />
            <Button
              onPress={() =>
                startConversationMutation.mutate({
                  itemId,
                  message: firstMessage || 'Bonjour, votre annonce est-elle toujours disponible ?',
                })
              }
              disabled={startConversationMutation.isPending}>
              <Text className="font-bold text-white">Contacter par messagerie</Text>
            </Button>
          </View>
        )}

        <Link href="/(tabs)/store/messages" asChild>
          <Button variant="outline">
            <Text>Mes discussions</Text>
          </Button>
        </Link>
      </View>
    </ScrollView>
  )
}
