import { useState, useCallback } from "react";
import { Provider, ProviderConfig } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";
import { BASE_URL } from "@/lib/config";

const PROVIDERS_KEY = "providers";
const OLD_CONFIG_KEY = "providerConfig";

interface ProvidersState {
  providers: Provider[];
  activeProviderId: string;
}

const INITIAL_PROVIDER: Provider = {
  id: "initial",
  name: "Default",
  url: BASE_URL,
  apiKey: "",
  temperature: 0.7,
  maxTokens: 2048,
  stream: true,
  model: "",
  isInitial: true,
};

function loadState(): ProvidersState {
  const saved = storageGet<ProvidersState | null>(PROVIDERS_KEY, null);
  if (saved && saved.providers.length > 0) return saved;

  const oldConfig = storageGet<ProviderConfig | null>(OLD_CONFIG_KEY, null);
  const initial: Provider = {
    ...INITIAL_PROVIDER,
    apiKey: oldConfig?.apiKey ?? "",
    temperature: oldConfig?.temperature ?? 0.7,
    maxTokens: oldConfig?.maxTokens ?? 2048,
    model: oldConfig?.model ?? "",
  };

  const state: ProvidersState = { providers: [initial], activeProviderId: "initial" };
  storageSet(PROVIDERS_KEY, state);
  return state;
}

export function useProviders() {
  const [state, setState] = useState<ProvidersState>(loadState);

  const persist = (next: ProvidersState) => {
    setState(next);
    storageSet(PROVIDERS_KEY, next);
  };

  const activeProvider = state.providers.find((p) => p.id === state.activeProviderId) ?? state.providers[0];
  const initialProvider = state.providers.find((p) => p.isInitial) ?? state.providers[0];

  const setActiveProviderId = useCallback((id: string) => {
    persist({ ...state, activeProviderId: id });
  }, [state]);

  const addProvider = useCallback((data: Omit<Provider, "id" | "isInitial">) => {
    const newProvider: Provider = {
      ...data,
      id: Date.now().toString(),
      isInitial: false,
    };
    persist({
      providers: [...state.providers, newProvider],
      activeProviderId: state.activeProviderId,
    });
  }, [state]);

  const updateProvider = useCallback((id: string, updates: Partial<Omit<Provider, "id" | "isInitial">>) => {
    const providers = state.providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    persist({ ...state, providers });
  }, [state]);

  const deleteProvider = useCallback((id: string) => {
    const target = state.providers.find((p) => p.id === id);
    if (!target || target.isInitial) return;

    const providers = state.providers.filter((p) => p.id !== id);
    const activeProviderId = state.activeProviderId === id ? "initial" : state.activeProviderId;
    persist({ providers, activeProviderId });
  }, [state]);

  const updateActiveProviderModel = useCallback((model: string) => {
    const providers = state.providers.map((p) =>
      p.id === state.activeProviderId ? { ...p, model } : p
    );
    persist({ ...state, providers });
  }, [state]);

  return {
    providers: state.providers,
    activeProvider,
    activeProviderId: state.activeProviderId,
    initialProvider,
    setActiveProviderId,
    addProvider,
    updateProvider,
    deleteProvider,
    updateActiveProviderModel,
  };
}
