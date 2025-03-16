import { useFindMany, useUser } from "@gadgetinc/react";
import { api } from "../api";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// Type for a conversation group
type ConversationGroup = {
  partnerIdentifier: string;
  partnerName: string;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
  };
};

export default function MessagesPage() {
  const user = useUser(api);
  const navigate = useNavigate();
  
  // Track which conversations have been viewed
  const [viewedConversations, setViewedConversations] = useState<Record<string, Date>>({});
  
  // Fetch messages where current user is either sender or recipient, with real-time updates
  const [{ data: messages, fetching, error }] = useFindMany(api.message, {
    filter: {
      OR: [
        { userId: { equals: user?.id } },
        { recipient: { equals: user?.id } }
      ],
    },
    sort: { createdAt: "Descending" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      recipient: true,
      user: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
    live: true, // Enable real-time updates
  });

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading your messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Error loading messages: {error.toString()}</p>
      </div>
    );
  }
  
  // Group messages by conversation partner
  const conversationGroups: Record<string, ConversationGroup & { hasNewMessages: boolean }> = {};

  messages?.forEach((message) => {
    // Determine the conversation partner (the other person in the conversation)
    const isUserSender = message.user?.id === user?.id;
    const partnerIdentifier = isUserSender ? message.recipient : message.user?.id;
    
    if (!partnerIdentifier) return; // Skip if no partner

    // Get or create the conversation group
    if (!conversationGroups[partnerIdentifier]) {
      let partnerName = 'Unknown User';
      
      if (isUserSender) {
        // If user is sender, partner is identified by recipient field
        partnerName = message.recipient || 'Unknown User';
      } else {
        // If user is recipient, partner is the sender (user)
        partnerName = message.user ? 
          `${message.user.firstName || ''} ${message.user.lastName || ''}`.trim() : 
          'Unknown User';
      }

      // Check if this is a new message (since last viewed)
      const lastViewed = viewedConversations[partnerIdentifier];
      const messageDate = new Date(message.createdAt);
      const hasNewMessages = !isUserSender && (!lastViewed || messageDate > lastViewed);

      conversationGroups[partnerIdentifier] = {
        partnerIdentifier,
        partnerName,
        hasNewMessages,
        lastMessage: {
          id: message.id,
          content: message.content || '',
          createdAt: message.createdAt,
        },
      };
    } else {
      // Update last message if this message is newer
      const currentLastMessage = conversationGroups[partnerIdentifier].lastMessage;
      const currentMessageDate = new Date(currentLastMessage.createdAt);
      const thisMessageDate = new Date(message.createdAt);
      
      if (thisMessageDate > currentMessageDate) {
        conversationGroups[partnerIdentifier].lastMessage = {
          id: message.id,
          content: message.content || '',
          createdAt: message.createdAt,
        };
        
        // Check if this is a new message (since last viewed)
        if (!isUserSender) {
          const lastViewed = viewedConversations[partnerIdentifier];
          const hasNewMessages = !lastViewed || thisMessageDate > lastViewed;
          conversationGroups[partnerIdentifier].hasNewMessages = hasNewMessages;
        }
      }
    }
  });

  // Convert to array and sort by most recent message
  const sortedConversations = Object.values(conversationGroups)
    .sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - 
             new Date(a.lastMessage.createdAt).getTime();
    });

  const handleConversationClick = (partnerIdentifier: string) => {
    // Mark conversation as viewed when clicked
    setViewedConversations(prev => ({
      ...prev,
      [partnerIdentifier]: new Date()
    }));
    navigate(`/messages/new?userId=${partnerIdentifier}`);
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>
            Your message conversations with other users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedConversations.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              No conversations yet. Start sharing food to connect with others!
            </p>
          ) : (
            <ScrollArea className="h-[500px]">
              {sortedConversations.map((conversation, index) => (
                <div key={conversation.partnerIdentifier}>
                  <div 
                    className="flex flex-col p-4 hover:bg-muted cursor-pointer"
                    onClick={() => handleConversationClick(conversation.partnerIdentifier)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{conversation.partnerName}</h3>
                        {conversation.hasNewMessages && (
                          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">New</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  {index < sortedConversations.length - 1 && <Separator />}
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
