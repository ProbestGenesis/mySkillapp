import React, { useState } from 'react'
import { ScrollView, Pressable, Text } from 'react-native'
import { MotiView } from "moti"
import { services_btp } from '@/data/services'
import { Button } from '@/components/ui/button'
import { Badge } from '../../badge'
import { Search } from 'lucide-react-native'


type Props = {
  selectedService: string | null;
  onSelectService: (service: string | null) => void;
}

function ServicesBulles({ selectedService, onSelectService }: Props) {
    const [_showAll, setShowAll] = useState(false);

  return (
    <MotiView>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps={'handled'}>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 0 }}
              className="flex-row items-center gap-4 px-2">
              <Badge>
                <Pressable
                  onPress={() => onSelectService(null)}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    opacity: selectedService === null ? 1 : 0.7,
                  }}>
                  <Text className="text-xs leading-tight font-bold text-white">Tous</Text>
                </Pressable>
              </Badge>
              {services_btp.map((item, idx) => {
                  return (
                    <Badge key={idx.toString()}>
                      <Pressable
                        onPress={() => onSelectService(selectedService === item ? null : item)}
                        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          opacity: selectedService === item ? 1 : 0.7,
                        }}>
                        <Text className="text-xs leading-tight font-bold text-white">{item}</Text>
                      </Pressable>
                    </Badge>
                  );
              })}

            {/*  <Button variant="ghost" size={'sm'} onPress={() => setShowAll(true)}>
                <Search />
                <Text>Plus</Text>
              </Button>*/}
            </MotiView>
          </ScrollView>
    </MotiView>
  )
}

export default ServicesBulles