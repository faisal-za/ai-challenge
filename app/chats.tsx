"use client"
import { Button } from "@/components/ui/button";
import dayjs from "dayjs"
import { StorageThreadType } from "@mastra/core";
import { useRouter, usePathname } from "next/navigation";
import { PlusIcon, MessageSquareIcon } from "lucide-react";
import {
    SidebarHeader,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

export default function Chats({ threads }: { threads: StorageThreadType[] | undefined }) {
    const router = useRouter();
    const pathname = usePathname();

    const handleNewChat = () => {
        router.push("/case");
    };

    const handleThreadSelect = (threadId: string) => {
        router.push(`/chat/${threadId}`);
    };

    return (
        <>
            <SidebarHeader>
                <h1 className="text-lg font-bold px-2">ICD-11 Diagnostic</h1>
                <Button
                    className='w-full cursor-pointer'
                    onClick={handleNewChat}
                >
                    <PlusIcon className="size-4" />
                    New Patient Case
                </Button>
            </SidebarHeader>

            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {threads?.map((item) => (
                            <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton
                                    onClick={() => handleThreadSelect(item.id)}
                                    isActive={pathname === `/chat/${item.id}`}
                                    className="flex flex-col items-start h-auto py-3 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <MessageSquareIcon className="size-4 shrink-0" />
                                        <span className='font-medium text-sm truncate flex-1'>{item.title}</span>
                                    </div>
                                    <span className='text-muted-foreground ml-6'>
                                        {dayjs(item.createdAt).format('MMM D, YYYY h:mm A')}
                                    </span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </>
    )
}