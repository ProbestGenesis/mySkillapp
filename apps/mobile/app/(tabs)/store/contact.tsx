import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MotiView } from 'moti';
import React from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { BadgeDollarSign, Clock, MessageCircle, Shield } from 'lucide-react-native';
import { Image } from 'expo-image';


const WHATSAPP_PHONE = 22899796474;

const WHATSAPP_MESSAGE = encodeURIComponent(
  "Bonjour, je souhaite devenir partenaire sur SKILLMAP pour disposé d'un quota de publication illimité"
);

const openWhatsApp = async () => {
  const url = `https://wa.me/${WHATSAPP_PHONE}?text=${WHATSAPP_MESSAGE}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://web.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${WHATSAPP_MESSAGE}`);
    }
  } catch {
    Alert.alert(
      'Impossible d\'ouvrir WhatsApp',
      'Veuillez vous assurer que WhatsApp est installé sur votre appareil.',
      [{ text: 'OK' }]
    );
  }
};

const INFO_ITEMS = [
  {
    icon: BadgeDollarSign,
    title: 'Procedure de payement',
    desc: 'Nous vous renseignons sur la procedure de payement',
  },
  
  {
    icon: MessageCircle,
    title: 'Assistance en temps réel',
    desc: 'Échangez directement avec notre équipe via WhatsApp',
  },
];

export default function ContactScreen() {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex-1"
      transition={{ type: 'timing', duration: 500 }}>
      <ScrollView className="bg-background h-full flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-4 py-6 pb-12">
          {/* Hero Section */}
          <View className="items-center gap-4 py-4">
            <View
              className="items-center justify-center rounded-full p-5"
              style={{ backgroundColor: '#25D36620' }}>
             
                <Image source={require("../../../assets/images/whatsapp.png")} style={{ width: 72, height: 72 }} contentFit="contain" />
              
            </View>
            <View className="gap-1.5 items-center">
              <Text className="text-foreground text-3xl font-bold text-center">Contactez-nous</Text>
              <Text className="text-muted-foreground text-base text-center">
                Notre équipe est disponible 24h/24 pour vous accompagner
              </Text>
            </View>
          </View>

          {/* WhatsApp CTA Card */}
          <Card className="border-2 border-primary/30 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Contacter via WhatsApp</CardTitle>
              <CardDescription>
                Appuyez sur le bouton ci-dessous pour nous envoyer un message
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="rounded-lg bg-black/5 dark:bg-white/5 p-4 gap-2">
                <Text className="text-muted-foreground text-xs font-medium">Message pré-rédigé</Text>
                <Text className="text-foreground text-sm leading-relaxed">
                  "Bonjour, je suis partenaire sur SkillMap et je souhaite vous contacter."
                </Text>
              </View>

              <Button
                onPress={openWhatsApp}
                className="w-full flex-row gap-2 rounded-full"
                style={{ backgroundColor: '#25D366' }}>
                <MessageCircle size={20} color="#ffffff" />
                <Text className="font-semibold text-white text-base">Ouvrir WhatsApp</Text>
              </Button>

              <Text className="text-muted-foreground text-xs text-center">
                En appuyant sur le bouton, WhatsApp s'ouvrira avec un message pré-rédigé.
              </Text>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pourquoi nous contacter ?</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              {INFO_ITEMS.map(({ icon: Icon, title, desc }, idx) => (
                <View key={idx} className="bg-secondary/20 flex-row gap-3 rounded-lg p-3 items-center">
                  <View className="bg-primary/10 rounded-full p-2">
                    <Icon size={18} className="text-primary" />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-foreground font-semibold">{title}</Text>
                    <Text className="text-muted-foreground text-xs">{desc}</Text>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </MotiView>
  );
}
