import { useTRPC } from "@/provider/appProvider";
import { useQuery } from "@tanstack/react-query";

export const useFetchUserWithProviderData = (userId: string) => {
    const trpc = useTRPC()
    const { data, isLoading, error } = useQuery({
        queryKey: ["userWithProviderData"],
        queryFn: () => trpc.user.getUserWithProviderData.queryOptions({userId})
    })
    return { data, isLoading, error }
}