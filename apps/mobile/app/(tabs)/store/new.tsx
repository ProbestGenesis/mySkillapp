import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { authClient, useSession } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useState, useMemo } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const MAX_IMAGES = 8

export default function StoreNewScreen() {
  const { data: session, isPending } = useSession();
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
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const insets = useSafeAreaInsets()

  const uploadMutation = useMutation(trpc.store.uploadStoreItemImage.mutationOptions())

  const createMutation = useMutation(
    trpc.store.createItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.store.listItems.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.store.getMyItems.queryKey() })
        router.replace('/(tabs)/store')
      },
    })
  )

  const pickImages = async () => {
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
      quality: 0.55,
      base64: true,
      selectionLimit: MAX_IMAGES - imageUrls.length,
    })
    if (result.canceled || !result.assets.length) return

    setUploading(true)
    setError('')
    try {
      const newUrls: string[] = [...imageUrls]
      for (const asset of result.assets) {
        if (newUrls.length >= MAX_IMAGES) break
        if (!asset.base64) continue
        const { imageUrl } = await uploadMutation.mutateAsync({
          base64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || 'store.jpg',
        })
        newUrls.push(imageUrl)
      }
      setImageUrls(newUrls)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Échec upload image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url))
  }

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
      imageUrls,
      city: city || undefined,
      district: district || undefined,
      phoneNumber: phoneNumber || undefined,
      whatsappNumber: whatsappNumber || undefined,
      contactEmail: contactEmail || undefined,
    })
  }


  if (!isPending && !session) {
    return (
      <SafeAreaView className="h-screen flex-1">
        <View className="h-full w-full flex-col items-center justify-center gap-2">
          <Text className="text-accent text-center text-lg">
            {' '}
            Vous devez vous connecter pour acceder a cette page{' '}
          </Text>
          <Button
            className="rounded-full"
            variant={'outline'}
            size={"lg"}
            onPress={() => {
              router.push('/auth');
            }}>
            {' '}
            <Text>Se connecter</Text>{' '}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 20 : insets.top + 10}
      className="flex-1"
    >
    <ScrollView className="flex-1 px-4 py-3">
      <View className="gap-3 pb-10 h-full ">
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

        <Text className="text-base font-semibold">Photos ({imageUrls.length}/{MAX_IMAGES})</Text>
        <Button variant="outline" onPress={pickImages} disabled={uploading || imageUrls.length >= MAX_IMAGES}>
          {isPending && uploading ? (
            <ActivityIndicator />
          ) : (
            <Text>Ajouter des photos</Text>
          )}
        </Button>
        <View className="flex-row flex-wrap gap-2">
          {imageUrls.map((url) => (
            <View key={url} className="relative">
              <Image source={{ uri: url }} style={{ width: 88, height: 88, borderRadius: 8 }} />
              <Pressable
                onPress={() => removeImage(url)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-white">×</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text className="text-base font-semibold">Votre Contact</Text>
        <Input placeholder="Téléphone" value={phoneNumber} onChangeText={setPhoneNumber} />

        {error ? <Text className="text-destructive">{error}</Text> : null}
        {createMutation.isError ? (
          <Text className="text-destructive">{createMutation.error?.message}</Text>
        ) : null}

        <Button onPress={onSubmit} disabled={createMutation.isPending || uploading}>
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-bold text-white">Publier</Text>
          )}
        </Button>


        <Text className='text-muted '>
          Bien que la vente de tout articles légales soit authorisé sur Skillmap; Les outils de travail seront mieux référencés.
        </Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
  )
}
