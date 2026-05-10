import { Persona } from "@/types";

export const samplePersonas: Persona[] = [
  {
    id: "1",
    name: "Assistant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=assistant",
    systemPrompt: "You are a helpful assistant.",
  },
  {
    id: "2",
    name: "Coding",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Coding",
    systemPrompt: "You are a senior software engineer. You write clean, efficient, well-tested code and explain your reasoning concisely.",
  },
  {
    id: "3",
    name: "Partner",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sexy",
    systemPrompt: "You are a supportive partner. You give thoughtful advice, emotional support.",
  },
];
