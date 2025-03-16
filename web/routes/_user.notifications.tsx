import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api } from "../api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { BellIcon, CheckIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";

export async function loader({ context }) {
  const notifications = await context.api.notification.findMany({
    filter: {
      recipientId: {
        equals: context.session.userID
      }
    },
    sort: { createdAt: "Descending" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      isRead: true,
      type: true,
      metadata: true,
      relatedPostId: true,
      sender: {
        id: true,
        firstName: true,
        lastName: true
      }
    }
  });

  return { notifications };
}

export default function Notifications() {
  const { notifications } = useLoaderData<typeof loader>();
  const [displayNotifications, setDisplayNotifications] = useState(notifications);
  const [votes, setVotes] = useState<Record<string, { upvotes: number, downvotes: number }>>(() => {
    const initialVotes: Record<string, { upvotes: number, downvotes: number }> = {};
    notifications.forEach(notification => {
      initialVotes[notification.id] = { upvotes: 0, downvotes: 0 };
    });
    return initialVotes;
  });

  const markAsRead = async (id: string) => {
    await api.notification.update({
      id,
      isRead: true
    });
    
    // Update the local state to reflect the change
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    
    setDisplayNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the notification to get the sender ID
    const notification = displayNotifications.find(n => n.id === id);
    
    if (notification && notification.sender) {
      // Find the sender's shareScore
      const senderScores = await api.shareScore.findMany({
        filter: {
          userId: {
            equals: notification.sender.id
          }
        },
        select: {
          id: true,
          score: true
        }
      });
      
      if (senderScores && senderScores.length > 0) {
        const scoreId = senderScores[0].id;
        
        // Update the share score by increasing it by 50 using the new action
        await api.shareScore.updateScoreFromVote(scoreId, {
          pointAdjustment: 50
        });
      }
    }
    
    // Delete the notification
    await api.notification.delete(id);
    toast.success("Upvote received! Sender received 50 points.");
    
    // Remove the notification from both state variables
    setDisplayNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Update votes state to remove the deleted notification
    const newVotes = {...votes};
    delete newVotes[id];
    setVotes(newVotes);
  };

  const handleDownvote = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the notification to get the sender ID
    const notification = displayNotifications.find(n => n.id === id);
    
    if (notification && notification.sender) {
      // Find the sender's shareScore
      const senderScores = await api.shareScore.findMany({
        filter: {
          userId: {
            equals: notification.sender.id
          }
        },
        select: {
          id: true,
          score: true
        }
      });
      
      if (senderScores && senderScores.length > 0) {
        const scoreId = senderScores[0].id;
        
        // Update the share score by decreasing it by 10 using the new action
        await api.shareScore.updateScoreFromVote(scoreId, {
          pointAdjustment: -10
        });
      }
    }
    
    // Delete the notification
    await api.notification.delete(id);
    toast.success("Downvote received. Sender lost 10 points.");
    
    // Remove the notification from both state variables
    setDisplayNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Update votes state to remove the deleted notification
    const newVotes = {...votes};
    delete newVotes[id];
    setVotes(newVotes);
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "post_completed":
        return { label: "Post Completed", variant: "default" as const };
      case "message_received":
        return { label: "New Message", variant: "secondary" as const };
      case "system":
        return { label: "System", variant: "outline" as const };
      default:
        return { label: type, variant: "default" as const };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <BellIcon className="h-6 w-6 mr-2" />
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>
      
      {displayNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BellIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">No notifications to display</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px] rounded-md">
          {displayNotifications.map((notification) => (
            <div key={notification.id} className="mb-4">
              <Card className={notification.isRead ? "opacity-75" : "border-2 border-primary"}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <Badge
                            variant={getNotificationTypeLabel(notification.type).variant}
                            className="h-6"
                          >
                            {getNotificationTypeLabel(notification.type).label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(notification.createdAt)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base">{notification.content}</p>
                        {notification.sender && (
                          <p className="text-sm text-muted-foreground mt-2">
                            From: {notification.sender.firstName} {notification.sender.lastName}
                          </p>
                        )}
                      </CardContent>
                    <CardFooter className="pt-2 flex justify-end items-center">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 mr-1"
                            onClick={(e) => handleUpvote(notification.id, e)}
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={(e) => handleDownvote(notification.id, e)}
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                  <Separator className="my-2" />
                </div>
              ))}
            </ScrollArea>
          )}
    </div>
  );
}