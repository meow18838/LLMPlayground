export interface Persona {
  id: string;
  name: string;
  avatar: string;
  systemPrompt: string;
  accentColor?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  personaId?: string;
  lastUpdated: Date;
}

export interface ProviderConfig {
  url: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  model: string;
}

export interface Provider {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  model: string;
  isInitial: boolean;
}

export interface Theme {
  name: string;
  isDark?: boolean;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

export interface ThemeGroup {
  name: string;
  light: Theme;
  dark: Theme;
}
