import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { profession } from '@/data/selectProfessionData';
import { postsSchema as formSchema } from '@/lib/zodSchema';
import { useTRPC } from '@/provider/appProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import z from 'zod';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../dialog';
import { Input } from '../../input';
import { Label } from '../../label';
import { Plus } from 'lucide-react-native';
import { Textarea } from '../../textarea';

type Props = {};

function AddPostBtn({}: Props) {
  const trpc = useTRPC();
  const { handleSubmit, control } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

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

  const { mutateAsync: createPost, isPending } = useMutation(trpc.post.createPost.mutationOptions());
  return (
    <Dialog>
      <DialogTrigger className="flex flex-col items-center gap-2.5" asChild>
        <Button className="rounded-full" size={"icon"} variant={"outline"}>
          <Plus className="dark:text-white" />
        </Button>
        
      </DialogTrigger> 

      <DialogContent className="w-[90%] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Demander un services</DialogTitle>

          <DialogDescription>
            Votre demande de service est adressée à tous les prestataires de votre zone.
          </DialogDescription>
        </DialogHeader>

        <View className='gap-3.5'>

          <Controller />
         {/* <Controller
            control={control}
            name="profession"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View className=''>
                <Label className="font-bold">Profession rechercher</Label>
                <Select onValueChange={(v: any) => onChange(v)} value={value} defaultValue={value}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selectionner votre profession" />
                  </SelectTrigger>
                  <SelectContent insets={contentInsets}>
                    <SelectGroup>
                      <SelectLabel>Professions</SelectLabel>
                      {profession.map((item) => (
                        <SelectItem key={item.value} label={item.label} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {error?.message && (
                  <Text className="mt-1 text-sm text-red-600">{error.message}</Text>
                )}
              </View>
            )}
          />*/}

          <Controller
            control={control}
            name="body"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View>
                <Label className=" font-bold">Decriver vos besoin</Label>
                <Textarea
                className='h-24 text-wrap max-w-full'
                  placeholder="Decriver vos besoin"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                />
                {error?.message && (
                  <Text className="mt-1 text-sm text-red-600">{error.message}</Text>
                )}
              </View>
            )}
          />
          <View className="w-full  flex-row pt-3.5 items-center justify-end gap-2.5">
            <DialogClose asChild>
              <Button className='rounded-full' variant={"outline"}>
                <Text>Annuler</Text>
              </Button>
            </DialogClose>
            <Button
              className='rounded-full'
              onPress={handleSubmit((data) => {
                createPost(data);
              })}>
              {isPending ?  <ActivityIndicator /> : <Text className='text-white'>Demander un service</Text>}
            </Button>
          </View>
        </View>
      </DialogContent>
    </Dialog>
  );
}

export default AddPostBtn;
