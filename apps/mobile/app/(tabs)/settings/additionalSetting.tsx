import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { signOut, useSession } from '@/lib/auth-client';
import { useTRPC } from '@/provider/appProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ReceiptText } from 'lucide-react-native';
import * as React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';


export default function AdditionalSetting() {

  const { data: session, isPending  } = useSession()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [success, setSuccess] = React.useState({ok: false, message: ''})
  const [deleteUserDialog, setDeleteuserDialog] = React.useState(false)

  const {mutate: deleteUser, isPending: deleteUserProcessing}= useMutation({
    ...trpc.user.deleteUser.mutationOptions(),
    onSuccess: () => {
      queryClient.clear()
      setSuccess({ok: true, message: 'Votre compte a été supprimé avec succès.'})
      signOut()
    },
    onError: () => {
      setSuccess({ok: false, message: 'Une erreur est survenue lors de la suppression de votre compte. Veuillez réessayer.'})
    }
  }) 
  return (
    <View className="flex-col gap-2.5 px-2 py-4">
      <Button variant={'outline'}>
        <ReceiptText className="text-blue-400" />
        <Text className="text-blue-400 dark:text-white">
          Nos conditions générales d'utilisation
        </Text>
      </Button>
      <Dialog open={deleteUserDialog} onOpenChange={(open) => setDeleteuserDialog(open)}>
          <Button variant={'destructive'} onPress={() => {setDeleteuserDialog(true)}}>
            <Text className="text-white">Supprimer son compte</Text>
          </Button>
        

        <DialogContent>
          <DialogHeader>
            <View className="items-center">
              <View className="bg-destructive/10 rounded-full p-4">
                <AlertCircle size={32} className="text-destructive" />
              </View>
              <DialogTitle className="text-destructive mt-4 text-center text-xl font-bold">
                Suppression de compte
              </DialogTitle>
              <Text className="text-muted-foreground mt-2 text-center">
                Souhaitez vous vraiment supprimer votre compte ? Cette action est irréversible et
                entraînera la perte de toutes vos données.
              </Text>
            </View>
          </DialogHeader>

          <DialogFooter>
            <View className="flex-row gap-3">
              <DialogClose asChild>
                <Button variant="ghost" className="flex-1">
                  <Text>Retour</Text>
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                className="flex-1 rounded-full"
                onPress={() => deleteUser()}
                >
                <Text className="font-bold text-white">
                  {deleteUserProcessing ? <ActivityIndicator color="white" /> : 'Supprimer'}
                </Text>
              </Button>
            </View>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
