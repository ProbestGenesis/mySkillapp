import { Button } from '@/components/ui/button'
import { MotiView } from 'moti'
import { ChevronRight, Sparkles, TrendingUp, Users } from 'lucide-react-native'
import React, { useCallback, useState } from 'react'
import { Dimensions, ScrollView, Text, View } from 'react-native'

interface PartnerLandingProps {
  onSkip: () => void
}

export function PartnerLanding({ onSkip }: PartnerLandingProps) {
  const [scrollIndex, setScrollIndex] = useState(0)
  const { width } = Dimensions.get('window')

  const slides = [
    {
      icon: Sparkles,
      title: 'Bienvenue au Programme Partenaire',
      description: 'Débloquez des publications illimitées et accédez à des outils premium pour développer votre entreprise.',
      color: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: TrendingUp,
      title: 'Publications Sans Limite',
      description: 'Publiez autant d\'annonces que vous le souhaitez, quand vous le souhaitez. Pas de restrictions de fréquence.',
      color: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      icon: Users,
      title: 'Portée Maximale',
      description: 'Vos annonces reçoivent plus de visibilité et atteignent plus de clients potentiels dans votre région.',
      color: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ]

  const handleScroll = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x
      const currentIndex = Math.round(contentOffsetX / width)
      setScrollIndex(Math.min(currentIndex, slides.length - 1))
    },
    [width, slides.length]
  )

  return (
    <View className="flex-1 bg-background">
      {/* Header with Skip Button */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onPress={onSkip}
          className="flex-row gap-1">
          <Text className="text-sm font-semibold text-foreground">Passer</Text>
          <ChevronRight size={16} className="text-foreground" />
        </Button>
      </View>

      {/* Slides Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        className="flex-1">
        {slides.map((slide, idx) => {
          const Icon = slide.icon
          return (
            <View
              key={idx}
              style={{ width }}
              className="flex-1 items-center justify-center px-6">
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 600 }}
                className="flex items-center gap-6">
                {/* Icon Background Circle */}
                <MotiView
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 10,
                    mass: 1,
                    overshootClamping: false,
                    restSpeedThreshold: 0.001,
                    restDisplacementThreshold: 0.001,
                    delay: 100,
                  }}
                  className={`h-28 w-28 items-center justify-center rounded-full ${slide.color}`}>
                  <Icon size={64} className="text-primary" />
                </MotiView>

                {/* Title */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'timing',
                    duration: 600,
                    delay: 200,
                  }}>
                  <Text className="text-center text-3xl font-bold text-foreground">
                    {slide.title}
                  </Text>
                </MotiView>

                {/* Description */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'timing',
                    duration: 600,
                    delay: 300,
                  }}>
                  <Text className="text-center text-base text-muted-foreground">
                    {slide.description}
                  </Text>
                </MotiView>
              </MotiView>
            </View>
          )
        })}
      </ScrollView>

      {/* Progress Indicators and CTA Footer */}
      <View className="gap-6 px-4 pb-8">
        {/* Dots Indicator */}
        <View className="flex-row justify-center gap-2">
          {slides.map((_, idx) => (
            <MotiView
              key={idx}
              from={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: scrollIndex === idx ? 1.2 : 1,
                opacity: scrollIndex === idx ? 1 : 0.5,
              }}
              transition={{ type: 'timing', duration: 300 }}
              className={`h-2 rounded-full ${
                scrollIndex === idx ? 'bg-primary w-8' : 'bg-muted w-2'
              }`}
            />
          ))}
        </View>

        {/* CTA Button */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 600,
            delay: 400,
          }}>
          <Button
            onPress={onSkip}
            className="w-full bg-primary">
            <Text className="text-base font-semibold text-white">
              {scrollIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
            {scrollIndex === slides.length - 1 && (
              <ChevronRight size={20} color="white" />
            )}
          </Button>
        </MotiView>

        {/* Trust Badge */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 600,
            delay: 500,
          }}
          className="flex-row items-center justify-center gap-2">
          <Text className="text-xs text-muted-foreground">
            ✓ Secure • Transparent • Reliable
          </Text>
        </MotiView>
      </View>
    </View>
  )
}
