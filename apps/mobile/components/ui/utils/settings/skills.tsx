import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from 'expo-router'
import { ServerIcon } from 'lucide-react-native'
import { Skeleton } from '@/components/ui/skeleton'


type Props = {
    data: any
    isLoading: boolean
    session: any
}

export function Skills({data, isLoading, session}: Props) {


  return (
    <View>
        {isLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <View>
                {session?.user.role === 'PROVIDER' && (
                  <Card>
                    <CardHeader className="flex-row justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text>
                          <ServerIcon />{' '}
                        </Text>
                        <Text className="text-lg font-bold">Vos services</Text>
                      </View>

                      {data.provider && data?.provider?.skills?.length > 0 && (
                        <Link
                          asChild
                          href={{
                            pathname: '/(tabs)/settings/skills',
                            params: { providerId: data?.provider?.id as string },
                          }}>
                          <Button size="sm" className="rounded-full">
                            <Text className="text-white">Ajouter un service</Text>
                          </Button>
                        </Link>
                      )}
                    </CardHeader>

                    <CardContent className="w-full flex-col gap-4">
                      {data?.provider && data?.provider?.skills?.length > 0 ? (
                        <View>
                          {data?.provider?.skills?.map((service: any, idx: number) => {
                            if (idx < 3) {
                              return (
                                <View className="mb-1 flex-col gap-2" key={service.id}>
                                  <View className="flex-row items-center gap-0.5">
                                      <Pressable className="flex-col gap-0 p-0.5 rounded-2xl bg-accent " >
                                        <Text className="text-sm font-semibold">
                                          {service.title}
                                        </Text>
                                      </Pressable>
                                  </View>
                                </View>
                              );
                            }
                            return null;
                          })}
                        </View>
                      ) : (
                        <View className="w-full flex-col items-center justify-center gap-6">
                          <Text className="font-bold">
                            Vous n'avez pas encore ajouté les services que vous éffectuez
                          </Text>

                          <Link
                            asChild
                            href={{
                              pathname: '/(tabs)/settings/skills',
                              params: { providerId: data?.provider?.id as string },
                            }}>
                            <Button size={'lg'} className="rounded-full">
                              <Text className="text-white">Ajouter un service</Text>
                            </Button>
                          </Link>
                        </View>
                      )}
                    </CardContent>
                  </Card>
                )}
              </View>
            )}
    </View>
  )
}
