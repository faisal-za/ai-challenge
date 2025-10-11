'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { useRouter } from 'next/navigation';
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { CopyIcon, ThumbsDownIcon } from 'lucide-react';
import {
    PromptInput,
    PromptInputBody,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
} from '@/components/ai-elements/prompt-input';
import { Actions, Action } from '@/components/ai-elements/actions';
import { ThumbsUpIcon } from 'lucide-react';
import { Response } from '@/components/ai-elements/response';
import { DefaultChatTransport } from 'ai';
import { Threads } from "@/app/actions"
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import TextType from "@/components/TextType"
import { Spinner } from '@/components/ui/shadcn-io/spinner';

const Component = ({ threadId = "", initialMessage = "" }) => {

    const [input, setInput] = useState("");
    const initialMessageSentRef = useRef(false);
    const router = useRouter();

    const { messages, status, sendMessage, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: { thread: threadId },
        }),

        onData: (data) => console.log('Chat data:', data),
        onError: (error) => console.error('Chat error:', error),
        onToolCall: (toolCall) => console.log('Tool call:', toolCall),
        onFinish: () => console.log('Chat finished'),
    });

    useEffect(() => {
        console.log("Chat status:", status);

        const intialMessages = Threads({ threadId })

        intialMessages.then((msgs) => {
            setMessages(msgs)
        })

    }, [threadId, setMessages])

    // Send initial message exactly once on component mount, then remove from URL
    useEffect(() => {
        if (initialMessage && threadId && !initialMessageSentRef.current) {
            console.log('Sending initial message once:', initialMessage);
            initialMessageSentRef.current = true;
            sendMessage({ text: initialMessage });

            // Remove initialMessage from URL to prevent resending on refresh
            router.replace(`/chat/${threadId}`, { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array - runs only once on mount

    return (
        <div className='w-full'>
            <Conversation className="relative size-full content-center" style={{ height: '70vh' }}>
                <ConversationContent>
                    {messages.length === 0 ? (
                        // <ConversationEmptyState
                        //     icon={<MessageSquareIcon className="size-6" />}
                        //     title="Start a conversation"
                        //     description="Messages will appear here as the conversation progresses."
                        // />
                        <Spinner />
                    ) : (
                        messages.map((item) => {
                            // Merge all reasoning parts into single text
                            const reasoningParts = item.parts.filter(p => p.type === 'reasoning');
                            const mergedReasoning = reasoningParts.length > 0 ? reasoningParts.map(p => p.text).join('\n\n') : null;

                            // Get non-reasoning parts
                            const otherParts = item.parts.filter(p => p.type !== 'reasoning');

                            return (<>
                                <Message from={item.role} key={item.id} className={`flex flex-col gap-2 ${item.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                                    {mergedReasoning && (
                                        <Reasoning isStreaming={false}>
                                            <ReasoningTrigger className='cursor-pointer' title={status == "streaming" ? "Thinking ..." : "Thought for 5s"} />
                                            <ReasoningContent>{mergedReasoning}</ReasoningContent>
                                        </Reasoning>
                                    )}
                                    {otherParts.map((part, index) => (
                                        <React.Fragment key={index}>
                                            {part.type === 'text' && (
                                                <MessageContent >
                                                    <Response className={status === "streaming" ? "animate-fade-in animate-duration-500" : ""}>{part.text}</Response>
                                                </MessageContent>
                                            )}
                                            {item.role === "assistant" && part.type === 'text' && (
                                                <Actions>
                                                    <Action label="Copy" className='cursor-pointer'>
                                                        <CopyIcon className="size-4" />
                                                    </Action>
                                                    <Action label="Like" className='cursor-pointer'>
                                                        <ThumbsUpIcon className="size-4" />
                                                    </Action>
                                                    <Action label="Dislike" className='cursor-pointer'>
                                                        <ThumbsDownIcon className="size-4" />
                                                    </Action>
                                                </Actions>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </Message>
                            </>);
                        })
                    )}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>
            {status == "streaming" && (
                <div className='py-4 px-5'>
                    <Spinner variant={"ellipsis"} className=' size-6' />
                </div>
            )}
            <PromptInput onSubmit={(e) => {
                if (input.trim()) {
                    sendMessage({ text: input });
                    setInput('');
                }
            }} className="px-4 relative">
                <PromptInputBody>
                    <PromptInputTextarea onChange={e => setInput(e.target.value)} value={input} />
                </PromptInputBody>
                <PromptInputToolbar>
                    <PromptInputSubmit
                        disabled={false}
                        status={'ready'}
                    />
                </PromptInputToolbar>
            </PromptInput>
        </div >
    );
};

export default Component;
