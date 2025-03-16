import { useEffect, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { BellIcon, CheckIcon } from "lucide-react";

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
        firstName: true,
        lastName: true
      }
    }
  });

  return { notifications };
}

export default function Notifications() {
  const { notifications } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("all");
  const [displayNotifications, setDisplayNotifications] = useState(notifications);
  
  useEffect(() => {
    if (activeTab === "all") {
      setDisplayNotifications(notifications);
    } else if (activeTab === "unread") {
      setDisplayNotifications(notifications.filter(notification => !notification.isRead));
    } else if (activeTab === "read") {
      setDisplayNotifications(notifications.filter(notification => notification.isRead));
    }
  }, [activeTab, notifications]);

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
      
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
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
                    <Link to={`/post-detail/${notification.relatedPostId}`} className="block">
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
                    </Link>
                    <CardFooter className="pt-2 flex justify-between">
                      <div className="flex-1">
                        {notification.relatedPostId && (
                          <Link
                            to={`/post-detail/${notification.relatedPostId}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={(e) => {
                            e.preventDefault();
                            markAsRead(notification.id);
                          }}
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Mark as read
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                  <Separator className="my-2" />
                </div>
              ))}
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}