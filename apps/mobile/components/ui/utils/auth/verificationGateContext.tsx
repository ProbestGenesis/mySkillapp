import React, { createContext, useContext, useMemo, useState } from 'react';

export type VerificationGateTarget = 'auto' | 'phone' | 'identity';

type VerificationGateRequest = {
  target: VerificationGateTarget;
  at: number;
};

type VerificationGateContextValue = {
  criticalRequest: VerificationGateRequest | null;
  requestCriticalVerification: (target?: VerificationGateTarget) => void;
  clearCriticalVerification: () => void;
};

const VerificationGateContext = createContext<VerificationGateContextValue | null>(null);

export function VerificationGateProvider({ children }: { children: React.ReactNode }) {
  const [criticalRequest, setCriticalRequest] = useState<VerificationGateRequest | null>(null);

  const value = useMemo<VerificationGateContextValue>(
    () => ({
      criticalRequest,
      requestCriticalVerification: (target = 'auto') => {
        setCriticalRequest({
          target,
          at: Date.now(),
        });
      },
      clearCriticalVerification: () => setCriticalRequest(null),
    }),
    [criticalRequest]
  );

  return (
    <VerificationGateContext.Provider value={value}>{children}</VerificationGateContext.Provider>
  );
}

export function useVerificationGate() {
  const context = useContext(VerificationGateContext);

  if (!context) {
    throw new Error('useVerificationGate must be used inside VerificationGateProvider');
  }

  return context;
}
