
import { useTRPC } from "@/provider/appProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createProvider } from "../../../../packages/lib/zodSchema";


const trpc = useTRPC()
export const useCreateProvider = useMutation(trpc.user.createProvider.mutationOptions())