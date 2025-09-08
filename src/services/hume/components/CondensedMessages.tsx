import { UserAvatar } from '@/features/users/components/userAvatar'
import { cn } from '@/lib/utils'
import { BrainCircuitIcon } from 'lucide-react'
import React from 'react'

const CondensedMessages = ({
    messages,
    user,
    maxFft = 0,
    className,
} : {
    messages: { isUser: boolean, content: string[] }[],
    user: { name: string, imageUrl: string },
    maxFft?: number,
    className?: string,
}) => {
  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
        {messages.map((message, index) => {
            const shouldAnimate = index === messages.length - 1 && maxFft > 0

            return (
                <div
                    key={index}
                    className={cn(
                        "flex items-center gap-5 border pl-4 pr-6 py-4 rounded max-w-3/4",
                        message.isUser ? "self-end" : "self-start"
                    )}
                >
                    {message.isUser ? (
                        <UserAvatar user={user} className="size-6 flex-shrink-0" />
                    ) : (
                        <div className="relative">
                            <div
                                className={cn(
                                    "absolute inset-0 border-muted border-4 rounded-full",
                                    shouldAnimate ? "animate-ping" : "hidden"
                                )}
                            />
                            <BrainCircuitIcon
                                className="size-6 flex-shrink-0 relative"
                                style={shouldAnimate ? { scale: maxFft / 8 + 1 } : undefined}
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        {message.content.map((text, i) => (
                            <span key={i}>{text}</span>
                        ))}
                    </div>
                </div>
            )
        })}
    </div>
  )
}

export default CondensedMessages