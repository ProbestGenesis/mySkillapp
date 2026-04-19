import { Card, CardContent } from '@/components/ui/card'
import { Image } from 'expo-image'
import { Link } from 'expo-router'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

interface ProductCardProps {
  id: string
  title: string
  price: number
  imageUrl?: string
  ownerName: string
  ownerId: string
  currentUserId?: string
}

export function ProductCard({
  id,
  title,
  price,
  imageUrl,
  ownerName,
  ownerId,
  currentUserId,
}: ProductCardProps) {
  const isOwnItem = currentUserId === ownerId

  return (
    <Link href={`/(tabs)/store/${id}`} asChild>
      <Pressable className="w-[48%]">
        <Card className="overflow-hidden pt-0 transition-shadow duration-200 active:shadow-md">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', aspectRatio: 1 }}
              contentFit="cover"
              placeholder="lightgray"
            />
          ) : (
            <View className="w-full items-center justify-center bg-muted" style={{ aspectRatio: 1 }}>
              <Text className="text-xs text-muted-foreground font-medium">Aucune photo</Text>
            </View>
          )}

          <CardContent className="gap-1.5 p-2">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-[10px] font-semibold text-primary">
                {isOwnItem ? 'Mes annonces' : 'Autres'}
              </Text>
            </View>

            <Text className="text-xs font-bold leading-tight" numberOfLines={2}>
              {title}
            </Text>

            <View className="gap-1">
              <Text className="text-sm font-extrabold text-primary">
                {price.toLocaleString()} FCFA
              </Text>
              <Text className="text-[10px] text-muted-foreground font-medium" numberOfLines={1}>
                {ownerName}
              </Text>
            </View>
          </CardContent>
        </Card>
      </Pressable>
    </Link>
  )
}
