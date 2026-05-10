import { useState, useEffect } from 'react'
import { useConversations, usePersonas, useProviders, useTheme } from '@/hooks'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { CreatePersonaModal } from '@/components/modals/CreatePersonaModal'
import type { Persona } from '@/types'

function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [createPersonaOpen, setCreatePersonaOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  const { personas, activePersonaId, setActivePersonaId, addPersona, updatePersona, deletePersona } = usePersonas()
  const {
    providers,
    activeProvider,
    activeProviderId,
    setActiveProviderId,
    addProvider,
    updateProvider,
    deleteProvider,
    updateActiveProviderModel,
  } = useProviders()
  const {
    selectedTheme,
    setSelectedTheme,
    themes,
    customThemes,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
  } = useTheme()

  useEffect(() => {
    const url = `${activeProvider.url.replace(/\/+$/, '')}/models`

    fetch(url, {
      headers: {
        ...(activeProvider.apiKey ? { Authorization: `Bearer ${activeProvider.apiKey}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        const ids: string[] = Array.isArray(data.data)
          ? data.data.map((m: { id?: string }) => m.id).filter(Boolean)
          : []
        setAvailableModels(ids)
        if (ids.length > 0 && !activeProvider.model) {
          updateActiveProviderModel(ids[0])
        }
      })
      .catch(() => {
        setAvailableModels([])
      })
  }, [activeProviderId, activeProvider.url, activeProvider.apiKey])

  const conv = useConversations({
    personas,
    config: activeProvider,
  })

  const activeConvPersonaId = conv.activeConversation?.personaId;
  const convPersona = activeConvPersonaId
    ? personas.find(p => p.id === activeConvPersonaId) ?? personas.find(p => p.id === "1")
    : personas.find(p => p.id === "1")

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden flex">
      <Sidebar
        open={sidebarOpen}
        onNewConversation={() => conv.handleNewConversation(activePersonaId ?? "1")}
        conversations={conv.conversations}
        activeConversationId={conv.activeConversationId}
        onSelectConversation={conv.setActiveConversationId}
        onDeleteConversation={conv.handleDeleteConversation}
        personas={personas}
        activePersonaId={activePersonaId}
        onStartChatWithPersona={(personaId) => {
          setActivePersonaId(personaId)
          conv.handleNewConversation(personaId)
        }}
        onOpenConfig={(p) => setEditingPersona(p)}
        onCreatePersona={() => setCreatePersonaOpen(true)}
        providers={providers}
        activeProviderId={activeProviderId}
        onSetActiveProvider={setActiveProviderId}
        onAddProvider={addProvider}
        onUpdateProvider={updateProvider}
        onDeleteProvider={deleteProvider}
        themes={themes}
        customThemes={customThemes}
        selectedTheme={selectedTheme}
        onSelectTheme={setSelectedTheme}
        onAddCustomTheme={addCustomTheme}
        onDeleteCustomTheme={deleteCustomTheme}
        onUpdateCustomTheme={updateCustomTheme}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader
          persona={convPersona}
          personas={personas}
          onPersonaChange={(personaId) => {
            if (conv.activeConversationId) {
              conv.handleUpdateConversation(conv.activeConversationId, { personaId })
            }
          }}
          activeModel={activeProvider.model}
          onModelChange={updateActiveProviderModel}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          models={availableModels}
        />
        <ChatMessages
          messages={conv.activeConversation?.messages || []}
          persona={convPersona}
          isStreaming={conv.isStreaming}
          onGenerateImage={conv.handleGenerateImage}
          onEditMessage={conv.handleEditMessage}
          onRegenerate={conv.handleRegenerateLastMessage}
        />
        {conv.error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center border-t border-destructive/20">
            {conv.error}
          </div>
        )}
        <ChatInput
          value={conv.inputValue}
          onChange={conv.setInputValue}
          onSend={conv.handleSendMessage}
          isStreaming={conv.isStreaming}
        />
      </div>

      <CreatePersonaModal
        persona={editingPersona}
        onCreate={addPersona}
        onUpdate={updatePersona}
        onDelete={deletePersona}
        onStartChat={(personaId) => {
          setEditingPersona(null)
          setActivePersonaId(personaId)
          conv.handleNewConversation(personaId)
        }}
        open={createPersonaOpen || !!editingPersona}
        onOpenChange={(open) => {
          if (!open) {
            setCreatePersonaOpen(false)
            setEditingPersona(null)
          }
        }}
      />
    </div>
  )
}

export default Chat
