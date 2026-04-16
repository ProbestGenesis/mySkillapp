import { useTRPC } from "@/provider/appProvider";
import { useMutation } from "@tanstack/react-query";
import { createProvider } from "../../../../packages/lib/zodSchema";

export const useCreateProvider = () => {
  const trpc = useTRPC();
  return useMutation(trpc.user.createProvider.mutationOptions());
};