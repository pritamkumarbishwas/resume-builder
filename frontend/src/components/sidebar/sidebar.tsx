import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types/chat"

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
  onRename?: (id: string, title: string) => void
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const groups: { label: string; items: Conversation[] }[] = []
  const todayItems: Conversation[] = []
  const yesterdayItems: Conversation[] = []
  const previous7Days: Conversation[] = []
  const previous30Days: Conversation[] = []
  const older: Conversation[] = []

  for (const conv of conversations) {
    const d = new Date(conv.updatedAt)
    if (d >= today) todayItems.push(conv)
    else if (d >= yesterday) yesterdayItems.push(conv)
    else if (d >= sevenDaysAgo) previous7Days.push(conv)
    else if (d >= thirtyDaysAgo) previous30Days.push(conv)
    else older.push(conv)
  }

  if (todayItems.length) groups.push({ label: "Today", items: todayItems })
  if (yesterdayItems.length) groups.push({ label: "Yesterday", items: yesterdayItems })
  if (previous7Days.length) groups.push({ label: "Previous 7 Days", items: previous7Days })
  if (previous30Days.length) groups.push({ label: "Previous 30 Days", items: previous30Days })
  if (older.length) groups.push({ label: "Older", items: older })

  return groups
}

function RenameInput({
  initialTitle,
  onSave,
  onCancel,
}: {
  initialTitle: string
  onSave: (title: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSave = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== initialTitle) {
      onSave(trimmed)
    } else {
      onCancel()
    }
  }, [value, initialTitle, onSave, onCancel])

  return (
    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") onCancel()
        }}
        onBlur={handleSave}
        aria-label="Rename conversation"
        className="flex-1 h-7 px-2 text-[13px] bg-sidebar border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-green-500 hover:text-green-400"
        onClick={handleSave}
        aria-label="Save rename"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onCancel}
        aria-label="Cancel rename"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function DeleteConfirmDialog({
  conversationTitle,
  messageCount,
  onConfirm,
  onCancel,
}: {
  conversationTitle: string
  messageCount: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const isMac =
    typeof navigator !== "undefined" && navigator.platform?.includes("Mac")
  const shortcutHint = isMac ? "\u2318\u232B" : "Ctrl+\u232B"

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onCancel()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[360px] rounded-2xl border border-border bg-card p-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          onEscapeKeyDown={onCancel}
          onPointerDownOutside={onCancel}
        >
          {/* Icon */}
          <div className="flex justify-center pt-6 pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-2 text-center">
            <DialogPrimitive.Title
              id="delete-dialog-title"
              className="text-foreground font-semibold text-[15px] mb-1"
            >
              Delete chat?
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="delete-dialog-desc"
              className="text-muted-foreground text-[13px] leading-relaxed"
            >
              <span className="text-foreground font-medium truncate block max-w-full">
                {conversationTitle.length > 40
                  ? conversationTitle.slice(0, 40) + "..."
                  : conversationTitle}
              </span>
              <span className="mt-1 block">
                {messageCount === 1
                  ? "1 message will be permanently deleted."
                  : `${messageCount} messages will be permanently deleted.`}
              </span>
            </DialogPrimitive.Description>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-b-2xl">
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Button
                variant="destructive"
                className="flex-1 gap-1.5"
                onClick={onConfirm}
              >
                Delete
                <kbd className="hidden sm:inline text-[10px] font-mono opacity-60 ml-1">
                  {shortcutHint}
                </kbd>
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

const ConversationItem = React.memo(function ConversationItem({
  conv,
  isActive,
  isRenaming,
  onSelect,
  onRename,
  onStartRename,
  onStartDelete,
}: {
  conv: Conversation
  isActive: boolean
  isRenaming: boolean
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
  onStartRename: (id: string) => void
  onStartDelete: (id: string) => void
}) {
  return (
    <div
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => {
        if (!isRenaming) onSelect(conv.id)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(conv.id)
        }
      }}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-colors min-w-0",
        isActive
          ? "bg-card text-foreground"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      {isRenaming ? (
        <RenameInput
          initialTitle={conv.title}
          onSave={(title) => onRename(conv.id, title)}
          onCancel={() => onStartRename("")}
        />
      ) : (
        <>
          <span className="flex-1 truncate text-[13px] leading-tight">
            {conv.title}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Options for ${conv.title}`}
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={4}
              className="w-48 bg-card border-border text-foreground"
            >
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onStartRename(conv.id)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation()
                  onStartDelete(conv.id)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
})

export function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onNewChat,
  onRename,
}: SidebarProps) {
  const [search, setSearch] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q))
  }, [conversations, search])

  const groups = useMemo(
    () => groupConversations(filteredConversations),
    [filteredConversations],
  )

  const focusSearch = useCallback(() => {
    setTimeout(() => searchRef.current?.focus(), 50)
  }, [])

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      if (!prev) {
        focusSearch()
      } else {
        setSearch("")
      }
      return !prev
    })
  }, [focusSearch])

  // Ctrl+K / Cmd+K to toggle search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        handleToggleSearch()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleToggleSearch])

  // Escape key closes search
  useEffect(() => {
    if (!showSearch) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearch(false)
        setSearch("")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showSearch])

  const handleStartRename = useCallback((id: string | null) => {
    setRenamingId(id)
  }, [])

  const handleStartDelete = useCallback((id: string | null) => {
    setDeletingId(id)
  }, [])

  const deletingConversation = useMemo(
    () => conversations.find((c) => c.id === deletingId) ?? null,
    [conversations, deletingId],
  )

  return (
    <aside className="flex flex-col h-full w-[260px] bg-sidebar overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 pr-3">
        <Button
          variant="ghost"
          onClick={onNewChat}
          aria-label="Start a new chat"
          className="gap-2 h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-card shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="text-[13px]">New chat</span>
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSearch}
              aria-label="Search chats (Ctrl+K)"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-card"
            >
              <Search className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Search chats (Ctrl+K)</TooltipContent>
        </Tooltip>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              aria-label="Search chats"
              className="w-full h-8 rounded-lg border border-border bg-card pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("")
                  searchRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conversation list */}
      <ScrollArea className="flex-1 min-h-0">
        <nav aria-label="Chat history" className="px-2 py-1 w-full min-w-0">
          {groups.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {search ? "No chats found" : "No conversations yet"}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-2" role="group" aria-label={group.label}>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </div>
                <div role="listbox" aria-label={group.label}>
                  {group.items.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={conv.id === activeConversationId}
                      isRenaming={renamingId === conv.id}
                      onSelect={onSelect}
                      onRename={(id, title) => {
                        onRename?.(id, title)
                        setRenamingId(null)
                      }}
                      onStartRename={handleStartRename}
                      onStartDelete={handleStartDelete}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-border p-2">
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 w-full cursor-pointer hover:bg-card transition-colors text-left"
          aria-label="User profile"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              U
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 text-[13px] text-foreground truncate">User</span>
        </button>
      </div>

      {/* Delete confirmation */}
      {deletingId && deletingConversation && (
        <DeleteConfirmDialog
          conversationTitle={deletingConversation.title}
          messageCount={deletingConversation.messages.length}
          onConfirm={() => {
            onDelete(deletingId)
            setDeletingId(null)
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </aside>
  )
}
