import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useQuery } from '@tanstack/react-query'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

export default function StoreIndexScreen() {
  const trpc = useTRPC()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch, isRefetching } = useQuery(
    trpc.store.listItems.queryOptions({ search })
  )

  const { data: myItems } = useQuery({
    ...trpc.store.getMyItems.queryOptions(),
    enabled: !!session?.user?.id,
  })

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 px-4 py-3">
      <View className="gap-3 pb-10">
        <Text className="text-2xl font-bold">Boutique</Text>
        <Input placeholder="Rechercher une annonce" value={search} onChangeText={setSearch} />
        <View className="flex-row gap-2">
          <Button variant="outline" onPress={() => refetch()} disabled={isRefetching}>
            <Text>Actualiser</Text>
          </Button>
          {session ? (
            <Link href="/(tabs)/store/new" asChild>
              <Button>
                <Text className="font-bold text-white">Créer annonce</Text>
              </Button>
            </Link>
          ) : (
            <Button variant="outline" onPress={() => router.push('/auth')}>
              <Text>Se connecter</Text>
            </Button>
          )}
          {session ? (
            <Link href="/(tabs)/store/messages" asChild>
              <Button variant="outline">
                <Text>Messagerie</Text>
              </Button>
            </Link>
          ) : null}
        </View>

        {session ? (
          <View className="rounded-xl border border-border p-3">
            <Text className="font-semibold">Mes annonces: {myItems?.length ?? 0}</Text>
          </View>
        ) : null}

        {data?.length ? (
          data.map((item) => (
            <Link key={item.id} href={`/(tabs)/store/${item.id}`} asChild>
              <Card>
                <CardContent className="gap-1 pt-4">
                  <Text className="text-base font-semibold">{item.title}</Text>
                  <Text numberOfLines={2} className="text-muted-foreground">
                    {item.description}
                  </Text>
                  <Text className="font-bold">{item.price} FCFA</Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.owner.name} - {item.city || 'Ville N/A'}
                  </Text>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Text className="text-muted-foreground">Aucune annonce disponible.</Text>
        )}
      </View>
    </ScrollView>
  )
}