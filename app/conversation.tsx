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
import { CopyIcon, ThumbsDownIcon, MessageSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const shouldFetchMessagesRef = useRef(!initialMessage); // Only fetch if NO initial message
    const router = useRouter();

    const { messages, status, sendMessage, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: { thread: threadId },
        }),

        onData: (data) => console.log('[CONV] Chat data:', data),
        onError: (error) => console.error('[CONV] Chat error:', error),
        onToolCall: (toolCall) => console.log('[CONV] Tool call:', toolCall),
        onFinish: () => {
            console.log('[CONV] Chat finished');
            // Now that initial exchange is complete, enable fetching for future navigations
            shouldFetchMessagesRef.current = true;
        },
    });

    useEffect(() => {
        console.log("[CONV] Effect triggered - threadId:", threadId);
        console.log("[CONV] shouldFetchMessagesRef:", shouldFetchMessagesRef.current);
        console.log("[CONV] Chat status:", status);

        // Only fetch messages if we should (no initial message to send)
        if (!shouldFetchMessagesRef.current) {
            console.log('[CONV] Skipping fetch - initial message will be sent instead');
            return;
        }

        const loadMessages = async () => {
            console.log('[CONV] Fetching messages from thread');
            const msgs = await Threads({ threadId });
            console.log('[CONV] Fetched messages count:', msgs.length);
            setMessages(msgs);
            console.log('[CONV] Messages set in state');
        };

        if (threadId) {
            loadMessages();
        }
    }, [threadId, setMessages])

    useEffect(() => {
        if (initialMessage && threadId && !initialMessageSentRef.current) {
            console.log('[CONV] Sending initial message once:', initialMessage);
            initialMessageSentRef.current = true;
            sendMessage({ text: initialMessage });

            // Remove initialMessage from URL to prevent resending on refresh
            router.replace(`/chat/${threadId}`, { scroll: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array - runs only once on mount

    useEffect(() => {
        console.log("Messages", messages)
    }, [messages])

    return (
        <div className='w-full'>
            <Conversation className="relative size-full content-center" style={{ height: '70vh' }}>
                <ConversationContent>
                    {messages.length === 0 ? (
                        <ConversationEmptyState
                            icon={<MessageSquareIcon className="size-6" />}
                            title="Diabetes Risk Assessment"
                            description="Patient risk analysis will appear here after form submission."
                        >
                            <Spinner />
                        </ConversationEmptyState>
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
                                                <MessageContent>
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
            <div className="px-4 py-3 border-t bg-background flex justify-center">
                <Button
                    onClick={() => router.push('/case')}
                    variant="default"
                    size="lg"
                    className="w-full max-w-md cursor-pointer"
                    disabled={status === "streaming"}
                >
                    <MessageSquareIcon className="size-4 mr-2" />
                    New Patient Assessment
                </Button>
            </div>
        </div >
    );
};

export default Component;
