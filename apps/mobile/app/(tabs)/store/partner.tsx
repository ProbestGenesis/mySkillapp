import { PartnerLanding } from '@/components/store/partner-landing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/provider/appProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { MotiView } from 'moti'
import {
  CheckCircle,
  Clock,
  CreditCard,
  X,
  Zap,
} from 'lucide-react-native'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

type SubscriptionStatus = 'paid' | 'pending' | 'expired' | 'cancelled'

const getStatusColor = (status: SubscriptionStatus) => {
  const colors: Record<SubscriptionStatus, { bg: string; text: string; icon: React.ComponentType<any> }> = {
    paid: { bg: 'bg-green-500/15', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
    pending: { bg: 'bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400', icon: Clock },
    expired: { bg: 'bg-red-500/15', text: 'text-red-700 dark:text-red-400', icon: X },
    cancelled: { bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-400', icon: X },
  }
  return colors[status] || colors.pending
}

export default function StorePartnerScreen() {
  const [showLanding, setShowLanding] = useState(true)
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: publishingStatus, isLoading: loadingStatus } = useQuery({
    ...trpc.store.getPublishingStatus.queryOptions(),
    enabled: !!session?.user?.id,
  })

  const { data: history, isLoading: loadingHistory } = useQuery({
    ...trpc.store.listPartnerSubscriptions.queryOptions(),
    enabled: !!session?.user?.id,
  })

  const simulatePaymentMutation = useMutation(
    trpc.store.simulatePartnerPayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.store.getPublishingStatus.queryKey() })
        queryClient.invalidateQueries({ queryKey: trpc.store.listPartnerSubscriptions.queryKey() })
      },
    })
  )

  if (!session) {
    router.replace('/auth')
    return null
  }

  // Show landing page if not yet dismissed
  if (showLanding) {
    return <PartnerLanding onSkip={() => setShowLanding(false)} />
  }

  if (loadingStatus || loadingHistory) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const isPartner = publishingStatus?.isPartner ?? false
  const monthlyPrice = history?.monthlyPriceFcfa ?? 5000
  const expirationDate = publishingStatus?.partnerUntil
    ? new Date(publishingStatus.partnerUntil).toLocaleDateString()
    : '-'
  const hasSubscriptions = (history?.subscriptions?.length ?? 0) > 0

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='flex-1 h-full'
      transition={{ type: 'timing', duration: 500 }}>
    <ScrollView
      className="flex-1 bg-background h-full"
      showsVerticalScrollIndicator={false}>
      <View className="gap-6 px-4 h-full py-6 pb-12">
        {/* Header Section */}
        <View className="gap-2">
          <Text className="text-4xl font-bold text-foreground">Partenaire Boutique</Text>
          <Text className="text-base text-muted-foreground">
            Gérez votre abonnement et publiez sans limite
          </Text>
        </View>

        {/* Premium Status Card */}
        <Card
          className={`overflow-hidden border-2 ${
            isPartner
              ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-primary/0'
              : 'border-secondary/30 bg-gradient-to-br from-secondary/30 to-secondary/10'
          }`}>
          <CardHeader className="pb-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-2">
                <CardTitle className="text-2xl">
                  {isPartner ? 'Abonnement Actif' : 'Devenir Partenaire'}
                </CardTitle>
                <CardDescription className="text-sm">
                  {isPartner
                    ? 'Profitez des publications illimitées'
                    : 'Débloquez les publications sans limite'}
                </CardDescription>
              </View>
              <Badge
                variant={isPartner ? 'default' : 'secondary'}
                className="shrink-0">
                <Text className="font-semibold">
                  {isPartner ? '⭐ Partenaire' : 'Particulier'}
                </Text>
              </Badge>
            </View>
          </CardHeader>

          <CardContent className="gap-4">
            {/* Status Details Grid */}
            <View className="gap-4 rounded-lg bg-black/5 p-4 dark:bg-white/5">
              <View className="flex-row justify-between">
                <View className="flex-1 gap-1">
                  <Text className="text-xs font-medium text-muted-foreground">Type d'abonnement</Text>
                  <Text className="text-lg font-bold text-foreground">
                    {isPartner ? 'Partenaire' : 'Particulier'}
                  </Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xs font-medium text-muted-foreground">Tarif mensuel</Text>
                  <Text className="text-lg font-bold text-primary">
                    {monthlyPrice.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>

              <View className="gap-1 border-t border-border pt-3">
                <Text className="text-xs font-medium text-muted-foreground">
                  {isPartner ? 'Expire le' : 'À partir de'}
                </Text>
                <Text className="text-base font-semibold text-foreground">{expirationDate}</Text>
              </View>
            </View>

            {/* CTA Button */}
            <Button
              onPress={() => simulatePaymentMutation.mutate()}
              disabled={simulatePaymentMutation.isPending}
              className={isPartner ? '' : 'bg-primary'}>
              <CreditCard size={20} color="white" />
              <Text className="font-semibold text-white">
                {simulatePaymentMutation.isPending
                  ? 'Traitement...'
                  : isPartner
                    ? 'Renouveler l\'abonnement'
                    : 'Payer abonnement (simulation)'}
              </Text>
            </Button>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        {!isPartner && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex-row items-center gap-2 text-xl">
                <Zap size={20} className="text-primary" />
                Avantages du programme
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              {[
                { icon: '♾️', title: 'Publications illimitées', desc: 'Publiez autant que vous le souhaitez' },
                { icon: '⚡', title: 'Priorité accrue', desc: 'Vos annonces sont plus visibles' },
                { icon: '🎯', title: 'Meilleur ciblage', desc: 'Atteignez plus de clients potentiels' },
              ].map((benefit, idx) => (
                <View key={idx} className="flex-row gap-3 rounded-lg bg-secondary/20 p-3">
                  <Text className="text-lg">{benefit.icon}</Text>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-semibold text-foreground">{benefit.title}</Text>
                    <Text className="text-xs text-muted-foreground">{benefit.desc}</Text>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Subscription History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex-row items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              Historique des abonnements
            </CardTitle>
            <CardDescription>
              {hasSubscriptions
                ? `${history?.subscriptions?.length} abonnement(s) trouvé(s)`
                : 'Pas encore d\'abonnement'}
            </CardDescription>
          </CardHeader>

          <CardContent className="gap-2">
            {hasSubscriptions ? (
              <View className="gap-3">
                {history?.subscriptions?.map((sub: any, idx: number) => {
                  const status = (sub.status?.toLowerCase() ?? 'pending') as SubscriptionStatus
                  const statusColor = getStatusColor(status)
                  const StatusIcon = statusColor.icon

                  return (
                    <View
                      key={sub.id}
                      className={`overflow-hidden rounded-lg border border-border transition-all ${statusColor.bg} active:opacity-70`}>
                      <View className="flex-row items-start gap-3 p-4">
                        <View className={`mt-1 rounded-full p-2 ${statusColor.bg}`}>
                          <StatusIcon size={16} className={statusColor.text} />
                        </View>

                        <View className="flex-1 gap-2">
                          <View className="flex-row items-center justify-between gap-2">
                            <Text className="font-bold text-foreground">
                              {sub.amountFcfa?.toLocaleString()} FCFA
                            </Text>
                            <Badge
                              variant={
                                status === 'paid'
                                  ? 'default'
                                  : status === 'expired'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="capitalize">
                              <Text className="text-xs font-semibold">{status}</Text>
                            </Badge>
                          </View>

                          <View className="gap-1">
                            <Text className="text-xs text-muted-foreground font-medium">
                              {new Date(sub.startsAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              → {new Date(sub.endsAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {idx < (history?.subscriptions?.length ?? 0) - 1 && (
                        <View className="h-px bg-border" />
                      )}
                    </View>
                  )
                })}
              </View>
            ) : (
              <View className="gap-3 rounded-lg bg-secondary/30 p-6">
                <Text className="text-center text-base font-semibold text-foreground">
                  Aucun abonnement pour le moment
                </Text>
                <Text className="text-center text-sm text-muted-foreground">
                  Commencez votre abonnement pour accéder aux publications illimitées
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
    </MotiView>
  )
}
