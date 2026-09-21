import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PanelLeft, ChevronDown, Plus, Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { ChatGPTLogo } from "./logo"
import type { Conversation } from "@/types/chat"

interface HeaderProps {
  activeConversation: Conversation | null
  onOpenSidebar: () => void
  onNewChat: () => void
}

export function Header({ activeConversation, onOpenSidebar, onNewChat }: HeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card md:hidden"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label="Chat AI menu"
              className="gap-1.5 h-9 px-2 text-foreground hover:bg-card font-semibold text-[15px]"
            >
              <ChatGPTLogo className="h-5 w-5" />
              <span className="hidden sm:inline">Chat AI</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-card border-border text-foreground"
          >
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-sm font-medium"
              onClick={onNewChat}
            >
              <Plus className="h-4 w-4" />
              New chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {activeConversation && (
          <span className="hidden lg:inline text-[13px] text-muted-foreground truncate max-w-75">
            {activeConversation.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              aria-label="Start a new chat (Ctrl+N)"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New chat (Ctrl+N)</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
