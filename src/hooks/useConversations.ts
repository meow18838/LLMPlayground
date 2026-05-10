import { useState, useCallback, useEffect } from "react";
import { Message, Conversation, Provider, Persona } from "@/types";
import { storageGet, storageSet } from "@/lib/storage";
import { BASE_URL, DEBUG } from "@/lib/config";

const CONVERSATIONS_KEY = "conversations";
const ACTIVE_CONV_KEY = "activeConversationId";

const DEFAULT_CHAT_MODEL = "llama-4-scout";
const DEFAULT_IMAGE_MODEL = "z-image";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;
const MAX_TITLE_LENGTH = 30;
const CHAT_ENDPOINT = "/chat/completions";
const IMAGE_ENDPOINT = "/images/generations";

function resolveApiUrl(provider?: Provider): string {
  const base = provider?.isInitial ? BASE_URL : (provider?.url ?? BASE_URL);
  return `${base}${CHAT_ENDPOINT}`;
}

function buildAuthHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return headers;
}

function restoreDates(convs: Conversation[]): Conversation[] {
  return convs.map((c) => ({
    ...c,
    lastUpdated: new Date(c.lastUpdated),
    messages: c.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  }));
}

export interface UseConversationsOptions {
  personas?: Persona[];
  config?: Provider;
}

export function useConversations(options?: UseConversationsOptions) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = storageGet<Conversation[]>(CONVERSATIONS_KEY, []);
    if (saved.length > 0) return restoreDates(saved);
    return [{ id: "1", title: "New Conversation", messages: [], lastUpdated: new Date() }];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    const savedId = storageGet<string | undefined>(ACTIVE_CONV_KEY, undefined);
    if (savedId) return savedId;
    const saved = storageGet<Conversation[]>(CONVERSATIONS_KEY, []);
    return saved.length > 0 ? saved[0].id : "1";
  });

  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { storageSet(CONVERSATIONS_KEY, conversations); }, [conversations]);
  useEffect(() => { storageSet(ACTIVE_CONV_KEY, activeConversationId); }, [activeConversationId]);

  // Consistency: se activeId nao existe no array, corrige pro primeiro
  const activeExists = conversations.some((c) => c.id === activeConversationId);
  useEffect(() => {
    if (activeExists || conversations.length === 0) return;
    setActiveConversationId(conversations[0].id);
  }, [activeExists, conversations]);

  const activeConversation = activeExists
    ? conversations.find((c) => c.id === activeConversationId)
    : conversations[0];

  useEffect(() => {
    if (!DEBUG) return;
    const ids = conversations.map((c) => `${c.id}(${c.messages.length}msgs)`).join(", ");
    console.log(`[LLM] state: activeId=${activeConversationId} found=${!!activeConversation} convs=[${ids}]`);
  }, [conversations, activeConversationId, activeConversation]);

  // ─── Core send logic ────────────────────────────────────────────────────────
  // Sends `content` as a user message appended after `priorMessages` in `convId`.
  // Handles the full streaming lifecycle.
  const doSend = useCallback(async (
    content: string,
    priorMessages: Message[],
    convId: string,
  ) => {
    setIsStreaming(true);
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === convId
          ? {
            ...conv,
            messages: [...priorMessages, userMessage],
            lastUpdated: new Date(),
            // Only update title if this is the first message in the conversation
            title: priorMessages.length === 0 ? content.slice(0, MAX_TITLE_LENGTH) : conv.title,
          }
          : conv
      )
    );

    const allMessages = [...priorMessages, userMessage];
    const conversation = conversations.find(c => c.id === convId);
    const convPersona = options?.personas?.find((p) => p.id === conversation?.personaId) || options?.personas?.find((p) => p.id === "1");
    const systemPrompt = convPersona?.systemPrompt;
    const config = options?.config;
    const assistantMessageId = (Date.now() + 1).toString();
    let fullContent = "";

    const addOrUpdateAssistant = (newContent: string) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== convId) return conv;
          const exists = conv.messages.some((m) => m.id === assistantMessageId);
          return {
            ...conv,
            messages: exists
              ? conv.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, content: newContent } : m
              )
              : [
                ...conv.messages,
                {
                  id: assistantMessageId,
                  role: "assistant" as const,
                  content: newContent,
                  timestamp: new Date(),
                },
              ],
          };
        })
      );
    };

    try {
      const headers = buildAuthHeaders(config?.apiKey);
      const model = config?.model ?? DEFAULT_CHAT_MODEL;
      const temperature = config?.temperature ?? DEFAULT_TEMPERATURE;
      const maxTokens = config?.maxTokens ?? DEFAULT_MAX_TOKENS;
      const stream = config?.stream ?? true;
      const url = resolveApiUrl(config);

      const body = {
        model,
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          ...allMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
        stream,
        temperature,
        max_tokens: maxTokens,
      };

      if (DEBUG) {
        console.log(
          `[LLM] → POST ${url}\n[LLM]   model=${model} messages=${body.messages.length} stream=${stream} temp=${temperature} max_tokens=${maxTokens}`,
        );
      }

      const startTime = DEBUG ? performance.now() : 0;
      const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });

      if (DEBUG) {
        console.log(`[LLM] ← ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errText = await response.text();
        if (DEBUG) console.log(`[LLM] error body: ${errText}`);
        let errMsg = `HTTP ${response.status}`;
        try { errMsg = JSON.parse(errText).error?.message || errMsg; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }

      if (stream) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let chunkCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  chunkCount++;
                  if (DEBUG) console.log(`[LLM] chunk #${chunkCount}: ${JSON.stringify(delta)}`);
                  fullContent += delta;
                  addOrUpdateAssistant(fullContent);
                }
              } catch { /* skip malformed chunks */ }
            }
          }
        }

        if (DEBUG) {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
          console.log(`[LLM] done (${chunkCount} chunks, ${elapsed}s)`);
        }
      } else {
        const data = await response.json();
        fullContent = data.choices?.[0]?.message?.content ?? "";
        addOrUpdateAssistant(fullContent);

        if (DEBUG) {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
          console.log(`[LLM] done (non-streaming, ${elapsed}s) content=${fullContent.length}chars`);
        }
      }
    } catch (e) {
      if (DEBUG) console.log(`[LLM] error:`, e);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsStreaming(false);
    }
  }, [options?.personas, options?.config, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Public handlers ─────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;
    const content = inputValue.trim();
    setInputValue("");
    await doSend(content, activeConversation?.messages ?? [], activeConversationId);
  }, [inputValue, isStreaming, doSend, activeConversation, activeConversationId]);

  /** Edit a user message: truncates history to before that message and re-sends. */
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (isStreaming || !newContent.trim()) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;
    const msgIdx = conv.messages.findIndex((m) => m.id === messageId);
    if (msgIdx === -1) return;
    const priorMessages = conv.messages.slice(0, msgIdx);
    await doSend(newContent.trim(), priorMessages, activeConversationId);
  }, [isStreaming, conversations, activeConversationId, doSend]);

  /** Remove the last assistant response and re-send the last user message. */
  const handleRegenerateLastMessage = useCallback(async () => {
    if (isStreaming) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;
    let lastUserIdx = -1;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === "user") { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;
    const lastUserContent = conv.messages[lastUserIdx].content;
    const priorMessages = conv.messages.slice(0, lastUserIdx);
    await doSend(lastUserContent, priorMessages, activeConversationId);
  }, [isStreaming, conversations, activeConversationId, doSend]);

  const handleNewConversation = useCallback((personaId?: string) => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      personaId,
      lastUpdated: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const newConv: Conversation = {
          id: Date.now().toString(),
          title: "New Conversation",
          messages: [],
          lastUpdated: new Date(),
        };
        return [newConv];
      }
      return remaining;
    });
  }, []);

  const handleUpdateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleGenerateImage = useCallback(async (messageId: string) => {
    const conv = conversations.find((c) => c.id === activeConversationId);
    const msg = conv?.messages.find((m) => m.id === messageId);
    if (!conv || !msg) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, isGeneratingImage: true } : m
            ),
          }
          : c
      )
    );

    try {
      const imageEndpoint = resolveApiUrl(options?.config).replace(CHAT_ENDPOINT, IMAGE_ENDPOINT);
      const headers = buildAuthHeaders(options?.config?.apiKey);

      const imageBody = {
        model: DEFAULT_IMAGE_MODEL,
        prompt: msg.content,
        n: 1,
        size: "1024x1024",
        response_format: "url",
        aspectRatio: "16:9",
      };

      if (DEBUG) {
        console.log(`[LLM] → POST ${imageEndpoint}\n[LLM]   model=${DEFAULT_IMAGE_MODEL} prompt="${msg.content.slice(0, 50)}"`);
      }

      const response = await fetch(imageEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(imageBody),
      });

      if (DEBUG) console.log(`[LLM] ← ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errText = await response.text();
        if (DEBUG) console.log(`[LLM] error body: ${errText}`);
        throw new Error("Failed to generate image");
      }
      const data = await response.json();
      if (DEBUG) console.log(`[LLM] image response:`, data);
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) throw new Error("No image URL in response");

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, isGeneratingImage: false, imageUrl }
                  : m
              ),
            }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, isGeneratingImage: false } : m
              ),
            }
            : c
        )
      );
    }
  }, [activeConversationId, conversations, options?.config]);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    setActiveConversationId,
    inputValue,
    setInputValue,
    isStreaming,
    error,
    handleSendMessage,
    handleEditMessage,
    handleRegenerateLastMessage,
    handleNewConversation,
    handleDeleteConversation,
    handleUpdateConversation,
    handleGenerateImage,
  };
}