import { useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import type { Message } from "@/types/chat"

interface ChatMessageProps {
  message: Message
  isLast?: boolean
  isStreaming?: boolean
  onRetry?: () => void
}

function CopyButton({
  text,
  variant = "code",
}: {
  text: string
  variant?: "code" | "message"
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  if (variant === "message") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="absolute top-3 right-3 h-8 w-8 rounded-md bg-muted-hover text-muted-foreground hover:bg-muted-hover-strong hover:text-foreground transition-all opacity-0 group-hover/code:opacity-100"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

function CodeBlock({
  language,
  children,
}: {
  language?: string
  children: ReactNode
}) {
  const codeText = typeof children === "string"
    ? children.replace(/\n$/, "")
    : typeof children === "object" && children !== null && "props" in children
      ? (children as React.ReactElement<{ children?: React.ReactNode }>).props?.children || String(children)
      : String(children)

  return (
    <div className="group/code relative my-4 rounded-xl border border-border-subtle overflow-hidden bg-code-bg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-code-header border-b border-border-subtle">
        <Badge
          variant="secondary"
          className="bg-badge-bg text-muted-foreground text-[11px] font-mono px-2 py-0.5"
        >
          {language || "code"}
        </Badge>
        <CopyButton text={typeof codeText === "string" ? codeText : String(codeText)} />
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-[1.7]">
        <code className={`hljs font-mono${language ? ` language-${language}` : ""}`}>
          {children}
        </code>
      </pre>
    </div>
  )
}

function MessageActions({
  content,
  onRetry,
  isLast,
}: {
  content: string
  onRetry?: () => void
  isLast: boolean
}) {
  const [liked, setLiked] = useState<boolean | null>(null)

  return (
    <div className="flex items-center gap-1 mt-3 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton text={content} variant="message" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setLiked(liked === true ? null : true)}
      >
        <ThumbsUp
          className={`h-3.5 w-3.5 ${liked === true ? "fill-primary text-primary" : ""}`}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setLiked(liked === false ? null : false)}
      >
        <ThumbsDown
          className={`h-3.5 w-3.5 ${liked === false ? "fill-destructive text-destructive" : ""}`}
        />
      </Button>
      {isLast && onRetry && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onRetry}
          title="Retry"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="text-[15px] text-foreground/90 leading-[1.75]">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            if (match) {
              return <CodeBlock language={match[1]}>{children}</CodeBlock>
            }
            return (
              <code
                className="rounded-md bg-badge-bg px-1.5 py-0.5 text-[13px] text-foreground/80 font-mono border border-border"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre({ children }) {
            return <>{children}</>
          },
          h1({ children }) {
            return (
              <h1 className="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-border-subtle text-foreground">
                {children}
              </h1>
            )
          },
          h2({ children }) {
            return (
              <h2 className="text-xl font-semibold mt-6 mb-3 pb-1.5 border-b border-border-subtle text-foreground">
                {children}
              </h2>
            )
          },
          h3({ children }) {
            return (
              <h3 className="text-lg font-semibold mt-5 mb-2 text-foreground">
                {children}
              </h3>
            )
          },
          h4({ children }) {
            return (
              <h4 className="text-base font-semibold mt-4 mb-2 text-foreground">
                {children}
              </h4>
            )
          },
          p({ children }) {
            return <p className="mb-4 last:mb-0">{children}</p>
          },
          ul({ children }) {
            return (
              <ul className="list-disc pl-6 mb-4 space-y-1.5 marker:text-muted-foreground">
                {children}
              </ul>
            )
          },
          ol({ children }) {
            return (
              <ol className="list-decimal pl-6 mb-4 space-y-1.5 marker:text-muted-foreground">
                {children}
              </ol>
            )
          },
          li({ children }) {
            return <li className="leading-[1.75]">{children}</li>
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors"
              >
                {children}
              </a>
            )
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary/60 pl-4 my-4 text-muted-foreground italic">
                {children}
              </blockquote>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-border-subtle">
                <table className="w-full text-sm">{children}</table>
              </div>
            )
          },
          thead({ children }) {
            return (
              <thead className="bg-table-header border-b border-border-subtle">
                {children}
              </thead>
            )
          },
          th({ children }) {
            return (
              <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="px-4 py-2.5 border-t border-border-subtle">{children}</td>
            )
          },
          hr() {
            return <hr className="my-6 border-border-subtle" />
          },
          strong({ children }) {
            return (
              <strong className="font-semibold text-foreground">{children}</strong>
            )
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}

export function ChatMessage({ message, isLast = false, isStreaming = false, onRetry }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isEmpty = !isUser && !message.content
  const isStreamTarget = isStreaming && isLast && !isUser

  const [displayContent, setDisplayContent] = useState(message.content)
  const bufferRef = useRef(message.content)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    bufferRef.current = message.content

    if (!isStreamTarget) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setDisplayContent(message.content)
      return
    }

    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        setDisplayContent(bufferRef.current)
        timerRef.current = null
      }, 250)
    }

    return () => {}
  }, [message.content, isStreamTarget])

  useEffect(() => {
    if (!isStreamTarget && timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setDisplayContent(message.content)
    }
  }, [isStreamTarget, message.content])

  const contentToRender = isStreamTarget ? displayContent : message.content

  return (
    <div className="group flex gap-4 px-4 py-5 md:px-[74px] w-full max-w-4xl mx-auto transition-colors">
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isUser
              ? "bg-gradient-to-br from-user to-user-end"
              : "bg-gradient-to-br from-primary to-primary-end"
          }`}
        >
          {isUser ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 text-primary-foreground"
            >
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold leading-none mb-2">
          {isUser ? "You" : "Chat AI"}
        </div>
        {isEmpty ? null : isUser ? (
          <div className="text-[15px] text-foreground/90 whitespace-pre-wrap leading-[1.75]">
            {message.content}
          </div>
        ) : (
          <>
            <MarkdownContent content={contentToRender} />
            <MessageActions
              content={message.content}
              onRetry={onRetry}
              isLast={isLast}
            />
          </>
        )}
      </div>
    </div>
  )
}
