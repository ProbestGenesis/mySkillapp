import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import type { AppRouter } from '../../api/index.ts';

import { authClient } from '@/lib/auth-client';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export function AppProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: false,
        throwOnError: (error) => {
          if(error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
            authClient.signOut()
          }
          return false
        },
        
      }
    }
  }));
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: 'https://skillmapapp.netlify.app/trpc/',
          headers() {
            const headers = new Map<string, string>();
            const cookies = authClient.getCookie();
            if (cookies) {
              headers.set('Cookie', cookies);
            }
            return Object.fromEntries(headers);
          },
        }),
      ],
    })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
