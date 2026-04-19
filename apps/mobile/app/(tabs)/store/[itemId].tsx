import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import {
  Edit,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Trash2,
  User,
} from 'lucide-react-native'
import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const MAX_IMAGES = 8

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
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [firstMessage, setFirstMessage] = useState('')

    const insets = useSafeAreaInsets();
    const contentInsets = {
      top: insets.top,
      bottom: Platform.select({
        ios: insets.bottom,
        android: insets.bottom + 24,
      }),
      left: 12,
      right: 12,
    };

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
    setImageUrls(Array.isArray(data.imageUrls) ? data.imageUrls : [])
  }, [data])

  const uploadMutation = useMutation(trpc.store.uploadStoreItemImage.mutationOptions())

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
        imageUrls,
      },
    })
  }

  const pickMoreImages = async () => {
    if (imageUrls.length >= MAX_IMAGES) {
      Alert.alert('Limite', `Maximum ${MAX_IMAGES} images.`)
      return
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission', "L'accès à la galerie est nécessaire.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.75,
      base64: true,
      selectionLimit: MAX_IMAGES - imageUrls.length,
    })
    if (result.canceled || !result.assets.length) return
    setUploadingImages(true)
    try {
      const next = [...imageUrls]
      for (const asset of result.assets) {
        if (next.length >= MAX_IMAGES) break
        if (!asset.base64) continue
        const { imageUrl } = await uploadMutation.mutateAsync({
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'store.jpg',
        })
        next.push(imageUrl)
      }
      setImageUrls(next)
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url))
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={insets.top} >
    <ScrollView className="flex-1 bg-background">
      <View className="pb-10">
        {/* Image Gallery Section */}
        {data.imageUrls?.length ? (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="max-h-80"
              scrollEventThrottle={16}>
              <View className="flex-row">
                {data.imageUrls.map((uri) => (
                  <View key={uri} style={{ width: 400 }} className="pr-1">
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', aspectRatio: 1.2 }}
                      contentFit="cover"
                      cachePolicy="memory"
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Image Indicators */}
            {data.imageUrls.length > 1 && (
              <View className="flex-row items-center justify-center gap-1.5 bg-black/40 py-3">
                {data.imageUrls.map((_, idx) => (
                  <View
                    key={idx}
                    className={`rounded-full transition-all ${
                      idx === 0 ? 'h-2 w-8 bg-white' : 'h-2 w-2 bg-white/50'
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="aspect-video w-full items-center justify-center bg-muted">
            <Text className="text-sm text-muted-foreground">Aucune photo</Text>
          </View>
        )}

        <View className="gap-4 px-4 py-4">
          {/* Title and Price Section */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">{data.title}</Text>
            <Text className="text-4xl font-extrabold text-primary">
              {data.price.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>

          {/* Location Section */}
          <View className="flex-row items-center gap-2">
            <MapPin size={20}  strokeWidth={2} />
            <Text className="text-base text-muted-foreground">
              {data.city || 'Ville N/A'} {data.district && `- ${data.district}`}
            </Text>
          </View>

          {/* Description Card */}
          <Card>
            <CardHeader className="">
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="leading-6 text-foreground">{data.description}</Text>
            </CardContent>
          </Card>

          {/* Seller Info Card */}
          <Card>
            <CardHeader className="">
              <CardTitle className="text-base">Vendeur</CardTitle>
            </CardHeader>
            <CardContent className="flex-row items-center ">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Avatar alt={`${data.owner.name} profil picture`} className="h-12 w-12">
                    <AvatarImage source={{ uri: data.owner.image ?? '' }} />
                    <AvatarFallback>{data.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {data.owner.name}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {isOwner ? (
            <View className="gap-3">
              {/* Edit Toggle Button */}
         {/*     <Button
                variant="outline"
                onPress={() => setEditing((v) => !v)}
                className="flex-row">
                <Edit size={18} strokeWidth={2} />
                <Text>{editing ? 'Fermer édition' : 'Modifier'}</Text>
              </Button>*/}

              {editing ? (
                <View className="gap-4">
                  {/* Basic Info Section */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-foreground">Informations générales</Text>
                    <Input
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Titre de l'annonce"
                    />
                    <Textarea
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Description détaillée"
                      numberOfLines={4}
                    />
                    <Input
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      placeholder="Prix (FCFA)"
                    />
                  </View>

                  {/* Location Section */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-foreground">Localisation</Text>
                    <Input value={city} onChangeText={setCity} placeholder="Ville" />
                    <Input value={district} onChangeText={setDistrict} placeholder="Quartier" />
                  </View>

                  {/* Contact Section */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-foreground">Moyens de contact</Text>
                    <Input
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Téléphone"
                      keyboardType="phone-pad"
                    />
                    <Input
                      value={whatsappNumber}
                      onChangeText={setWhatsappNumber}
                      placeholder="WhatsApp"
                      keyboardType="phone-pad"
                    />
                    <Input
                      value={contactEmail}
                      onChangeText={setContactEmail}
                      placeholder="Email"
                      keyboardType="email-address"
                    />
                  </View>

                  {/* Media Section */}
                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-foreground">
                        Photos ({imageUrls.length}/{MAX_IMAGES})
                      </Text>
                    </View>
                    <Button
                      variant="outline"
                      onPress={pickMoreImages}
                      disabled={uploadingImages}
                      className="flex-row">
                      <Text>
                        {uploadingImages ? 'Ajout en cours…' : 'Ajouter des photos'}
                      </Text>
                    </Button>

                    {imageUrls.length > 0 && (
                      <View className="flex-row flex-wrap gap-2">
                        {imageUrls.map((url) => (
                          <View key={url} className="relative">
                            <Image
                              source={{ uri: url }}
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 8,
                              }}
                            />
                            <Pressable
                              onPress={() => removeImage(url)}
                              className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-destructive">
                              <Text className="text-xs font-bold text-white">×</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Save Button */}
                  <Button
                    onPress={onSave}
                    disabled={updateMutation.isPending}
                    className="mt-2">
                    <Text className="font-bold text-white">
                      {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
                    </Text>
                  </Button>
                </View>
              ) : null}

              {/* Delete Button */}
              <Button
                variant="destructive"
                onPress={() =>
                  Alert.alert(
                    'Supprimer l\'annonce',
                    'Êtes-vous sûr de vouloir supprimer cette annonce ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Supprimer',
                        onPress: () => deleteMutation.mutate({ itemId }),
                        style: 'destructive',
                      },
                    ]
                  )
                }
                disabled={deleteMutation.isPending}
                className="flex-row">
                <Trash2 size={18} color="white" strokeWidth={2} />
                <Text className="font-bold text-white">
                  {deleteMutation.isPending ? 'Suppression…' : 'Supprimer l\'annonce'}
                </Text>
              </Button>
            </View>
          ) : (
            <View className="gap-3">
              {/* Contact Methods Section */}
              <Text className="text-lg font-bold text-foreground">Contacter l'annonceur</Text>

              {/* Phone Contact */}
              {data.phoneNumber && (
                <View className="rounded-lg border border-border bg-card p-3">
                  <View className="flex-row items-center gap-3">
                    <View className="rounded-full bg-primary/10 p-2">
                      <Phone size={20}  strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground">Téléphone</Text>
                      <Text className="font-semibold text-foreground">{data.phoneNumber}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* WhatsApp Contact */}
              {data.whatsappNumber && (
                <View className="rounded-lg border border-border bg-card p-3">
                  <View className="flex-row items-center gap-3">
                    <View className="rounded-full bg-primary/10 p-2">
                      <MessageCircle
                        size={20}
                        strokeWidth={2}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground">WhatsApp</Text>
                      <Text className="font-semibold text-foreground">
                        {data.whatsappNumber}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Message Input */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Votre message</Text>
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Bonjour, votre annonce est-elle toujours disponible ?"
                  value={firstMessage}
                  onChangeText={setFirstMessage}
                  numberOfLines={4}
                />
              </View>

              {/* Message Button */}
              <Button
                onPress={() =>
                  startConversationMutation.mutate({
                    itemId,
                    message:
                      firstMessage.trim() || 'Bonjour, votre annonce est-elle toujours disponible ?',
                  })
                }
                disabled={startConversationMutation.isPending}
                className="flex-row">
                <MessageCircle size={18} color="white" strokeWidth={2} />
                <Text className="font-bold text-white">
                  {startConversationMutation.isPending ? 'Envoi…' : 'Contacter par messagerie'}
                </Text>
              </Button>
            </View>
          )}

          {/* Messages Link */}
          <Link href="/(tabs)/store/messages" asChild>
            <Button variant="outline" className="flex-row">
              <MessageCircle size={18} strokeWidth={2} />
              <Text>Mes discussions</Text>
            </Button>
          </Link>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  )
}
