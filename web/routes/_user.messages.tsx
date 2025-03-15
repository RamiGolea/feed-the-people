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
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Type for a conversation group
type ConversationGroup = {
  partnerId: string;
  partnerName: string;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    read: boolean;
    post?: {
      id: string;
      title: string;
    } | null;
  };
  unreadCount: number;
};

export default function MessagesPage() {
  const user = useUser(api);
  const navigate = useNavigate();
  
  // Fetch messages where current user is either sender or recipient
  const [{ data: messages, fetching, error }] = useFindMany(api.message, {
    filter: {
      OR: [
        { senderId: { equals: user.id } },
        { recipientId: { equals: user.id } }
      ],
      status: { equals: "active" }
    },
    sort: { createdAt: "Descending" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      read: true,
      sender: {
        id: true,
        firstName: true,
        lastName: true,
      },
      recipient: {
        id: true,
        firstName: true,
        lastName: true,
      },
      post: {
        id: true,
        title: true,
      },
    },
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
  const conversationGroups: Record<string, ConversationGroup> = {};

  messages?.forEach((message) => {
    // Determine the conversation partner (the other person in the conversation)
    const isUserSender = message.sender?.id === user.id;
    const partnerId = isUserSender ? message.recipient?.id : message.sender?.id;
    
    if (!partnerId) return; // Skip if no partner

    // Get or create the conversation group
    if (!conversationGroups[partnerId]) {
      const partner = isUserSender ? message.recipient : message.sender;
      const partnerName = partner ? 
        `${partner.firstName || ''} ${partner.lastName || ''}`.trim() : 
        'Unknown User';

      conversationGroups[partnerId] = {
        partnerId,
        partnerName,
        lastMessage: {
          id: message.id,
          content: message.content || '',
          createdAt: message.createdAt,
          read: message.read || false,
          post: message.post,
        },
        unreadCount: (!isUserSender && !message.read) ? 1 : 0,
      };
    } else {
      // Update unread count if this is an unread message from partner
      if (!isUserSender && !message.read) {
        conversationGroups[partnerId].unreadCount += 1;
      }
      
      // Update last message if this message is newer
      const currentLastMessage = conversationGroups[partnerId].lastMessage;
      const currentMessageDate = new Date(currentLastMessage.createdAt);
      const thisMessageDate = new Date(message.createdAt);
      
      if (thisMessageDate > currentMessageDate) {
        conversationGroups[partnerId].lastMessage = {
          id: message.id,
          content: message.content || '',
          createdAt: message.createdAt,
          read: message.read || false,
          post: message.post,
        };
      }
    }
  });

  // Convert to array and sort by most recent message
  const sortedConversations = Object.values(conversationGroups)
    .sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - 
             new Date(a.lastMessage.createdAt).getTime();
    });

  const handleConversationClick = (partnerId: string) => {
    navigate(`/messages/new?userId=${partnerId}`);
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
                <div key={conversation.partnerId}>
                  <div 
                    className="flex flex-col p-4 hover:bg-muted cursor-pointer"
                    onClick={() => handleConversationClick(conversation.partnerId)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center">
                        <h3 className="font-medium">{conversation.partnerName}</h3>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage.content}
                    </p>
                    
                    {conversation.lastMessage.post && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="italic">About:</span> {conversation.lastMessage.post.title}
                      </div>
                    )}
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