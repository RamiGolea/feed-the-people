import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { useActionForm, useFindFirst, useFindMany, useUser } from "@gadgetinc/react";
import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { api } from "../api";
import type { AuthOutletContext } from "./_user";
import { 
  CalendarDaysIcon, 
  ArrowRightCircleIcon, 
  ClockIcon, 
  InfoIcon, 
  UserIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  SearchIcon 
} from "lucide-react";

export default function () {
  const { user: contextUser } = useOutletContext<AuthOutletContext>();
  const user = useUser(api); // Get the most up-to-date user data
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's share score
  const [{ data: shareScore, fetching: fetchingShareScore }, refreshShareScore] = useFindFirst(
    api.shareScore,
    {
      filter: { user: { equals: user.id } },
    }
  );

  // Fetch posts created by the user
  const [{ data: posts, fetching: fetchingPosts }, refreshPosts] = useFindMany(api.post, {
    filter: { user: { equals: user.id }, status: { equals: "Active" } },
  });
  
  // Refresh data when the refresh trigger changes
  useEffect(() => {
    refreshShareScore();
    refreshPosts();
  }, [refreshTrigger, refreshShareScore, refreshPosts]);

  const hasName = user.firstName || user.lastName;
  const title = hasName ? `${user.firstName} ${user.lastName}` : user.email;
  const initials = hasName
    ? (user.firstName?.slice(0, 1) ?? "") + (user.lastName?.slice(0, 1) ?? "")
    : "";

  const postsCount = posts?.length || 0;
  const shareScoreValue = shareScore?.score || 0;
  // Max value for the progress indicator (using 100 as default)
  const maxScore = 100;
  const progressValue = (shareScoreValue / maxScore) * 100;
  
  // Format dates for account information
  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="rounded-lg shadow p-6 bg-background border mb-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.googleImageUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {hasName && <p className="text-gray-600">{user.email}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {!user.googleProfileId && (
              <Button
                variant="ghost"
                onClick={() => setIsChangingPassword(true)}
                className="text-green-700 hover:text-green-800 hover:bg-green-50"
              >
                Change password
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              className="text-green-700 hover:text-green-800 hover:bg-green-50"
            >
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Tabbed interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-green-50 border border-green-100">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Activity
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Preferences
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-6">
          {/* About Me section */}
          <h2 className="text-xl font-semibold mb-4">About Me</h2>
          <Card className="mb-6 border-green-100">
            <CardContent className="pt-6">
              {user.bio ? (
                <p className="text-sm">{user.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No bio added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Account Information section */}
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <Card className="mb-6 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-green-600" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium w-1/3">Email Verification:</span>
                  <span className="text-sm flex items-center">
                    {user.emailVerified ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1 text-green-600" /> 
                        <span className="text-green-700">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 mr-1 text-amber-600" /> 
                        <span className="text-amber-700">Not Verified</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-1/3">Account Created:</span>
                  <span className="text-sm">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium w-1/3">Last Sign-in:</span>
                  <span className="text-sm">{formatDate(user.lastSignedIn)}</span>
                </div>
                {user.googleProfileId && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium w-1/3">Google Account:</span>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">Connected</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dashboard section */}
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Share Score Card */}
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center">
                        Share Score
                        <InfoIcon className="h-4 w-4 ml-1.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-80">
                        <p>Your share score increases when you share food with others. Higher scores unlock special features and recognition!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fetchingShareScore ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Score</span>
                      <span className="text-sm font-medium">{shareScoreValue}</span>
                    </div>
                    <Progress 
                      value={progressValue} 
                      className="h-2.5" 
                      indicatorColor="bg-green-600"
                    />
                    {shareScore?.rank && (
                      <p className="text-sm text-muted-foreground pt-2">
                        Current rank: <span className="text-green-700 font-medium">{shareScore.rank}</span>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Posts Count Card */}
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center">
                        People Helped
                        <InfoIcon className="h-4 w-4 ml-1.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-80">
                        <p>This shows the number of active food shares you've created to help people in your community.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fetchingPosts ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl font-bold text-green-600">{postsCount}</span>
                    <p className="text-sm text-muted-foreground mt-2">
                      Active food shares
                    </p>
                    <Button 
                      asChild 
                      variant="outline" 
                      className="mt-4 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                    >
                      <Link to="/search?filter=my">
                        <SearchIcon className="h-4 w-4 mr-2" />
                        View My Posts
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Activity Tab Content */}
        <TabsContent value="activity" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Activity History</h2>
            <Button 
              asChild 
              className="bg-green-600 hover:bg-green-700"
            >
              <Link to="/search?filter=my">
                <SearchIcon className="h-4 w-4 mr-2" />
                View My Posts
              </Link>
            </Button>
          </div>
          <ActivityHistoryTimeline userId={user.id} />
        </TabsContent>
        
        {/* Preferences Tab Content */}
        <TabsContent value="preferences" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Food Preferences</h2>
          <Card className="mb-6 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Allergies & Dietary Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Allergies</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.allergies ? (
                      user.allergies.split(',').map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {allergy.trim()}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No allergies specified</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Dietary Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.dietaryPreferences ? (
                      user.dietaryPreferences.split(',').map((preference, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {preference.trim()}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No dietary preferences specified</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <EditProfileModal 
        open={isEditing} 
        onClose={() => setIsEditing(false)} 
        onSuccess={() => setRefreshTrigger(prev => prev + 1)} 
      />
      <ChangePasswordModal
        open={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
      />
    </div>
  );
}


const ActivityHistoryTimeline = ({ userId }: { userId: string }) => {
  // Fetch both active and archived posts for the timeline
  const [{ data: allPosts, fetching: fetchingPosts }] = useFindMany(api.post, {
    filter: { 
      user: { equals: userId },
      // Include both active and archived posts
      status: { in: ["Active", "Archived"] }
    },
    sort: { createdAt: "Descending" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      status: true,
      createdAt: true,
      location: true,
      goBadDate: true,
      images: true
    }
  });
  
  if (fetchingPosts) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }
  
  if (!allPosts || allPosts.length === 0) {
    return (
      <Card className="mb-6 border-green-100">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No activity history yet</p>
          <Button asChild className="mt-4 bg-green-600 hover:bg-green-700">
            <Link to="/post">Create your first food share</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate statistics
  const activePosts = allPosts.filter(post => post.status === "Active").length;
  const archivedPosts = allPosts.filter(post => post.status === "Archived").length;
  const totalPosts = allPosts.length;
  
  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format time for display
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Get category badge class based on category
  const getCategoryClass = (category: string) => {
    switch(category) {
      case "leftovers":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "perishables":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };
  
  // Get status badge class based on status
  const getStatusClass = (status: string) => {
    switch(status) {
      case "Active":
        return "bg-green-50 text-green-700 border-green-200";
      case "Archived":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };
  
  return (
    <>
      {/* Statistics */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{totalPosts}</p>
              <p className="text-sm text-muted-foreground">Total Shares</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{activePosts}</p>
              <p className="text-sm text-muted-foreground">Active Shares</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{archivedPosts}</p>
              <p className="text-sm text-muted-foreground">Completed Shares</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Sharing Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[14px] top-1 bottom-6 w-[2px] bg-gray-200"></div>
            
            {allPosts.map((post, index) => (
              <div key={post.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-1 h-7 w-7 rounded-full border-2 flex items-center justify-center 
                  ${post.status === "Active" ? "bg-green-50 border-green-200" : "bg-purple-50 border-purple-200"}`}>
                  {post.status === "Active" ? (
                    <CalendarDaysIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClockIcon className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                
                {/* Content card */}
                <div className="p-3 bg-background border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-md font-medium">{post.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className={getStatusClass(post.status)}>
                          {post.status}
                        </Badge>
                        <Badge variant="outline" className={getCategoryClass(post.category || "")}>
                          {post.category || "Uncategorized"}
                        </Badge>
                        {post.location && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            {post.location}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Link 
                      to={`/post-detail/${post.id}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ArrowRightCircleIcon className="h-5 w-5" />
                    </Link>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {post.description.length > 100 
                      ? post.description.substring(0, 100) + "..." 
                      : post.description}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDaysIcon className="h-3 w-3" /> 
                    {formatDate(post.createdAt)}
                    <ClockIcon className="h-3 w-3 ml-2" />
                    {formatTime(post.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const EditProfileModal = (props: { 
  open: boolean; 
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const { user } = useOutletContext<AuthOutletContext>();
  const {
    register,
    submit,
    formState: { isSubmitting },
    setValue,
    getValues,
  } = useActionForm(api.user.update, {
    defaultValues: user,
    onSuccess: () => {
      // Close the modal and trigger a data refresh
      props.onClose();
      if (props.onSuccess) {
        props.onSuccess();
      }
    },
    send: ["firstName", "lastName", "allergies", "dietaryPreferences", "bio"],
  });
  
  // Common allergies and dietary preferences
  const commonAllergies = ["Nuts", "Dairy", "Eggs", "Wheat", "Shellfish", "Soy", "Fish"];
  const commonPreferences = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", "Paleo"];
  
  // State for custom inputs
  const [customAllergy, setCustomAllergy] = useState("");
  const [customPreference, setCustomPreference] = useState("");
  const [showCustomAllergyInput, setShowCustomAllergyInput] = useState(false);
  const [showCustomPreferenceInput, setShowCustomPreferenceInput] = useState(false);

  // Track both selected items and custom items separately
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(() => {
    const current = user.allergies || "";
    return current ? current.split(',').map(item => item.trim()) : [];
  });
  
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(() => {
    const current = user.dietaryPreferences || "";
    return current ? current.split(',').map(item => item.trim()) : [];
  });
  
  // Initialize custom items (items that aren't in the common lists)
  const [customAllergies, setCustomAllergies] = useState<string[]>(() => {
    const current = user.allergies || "";
    const userAllergies = current ? current.split(',').map(item => item.trim()) : [];
    return userAllergies.filter(allergy => 
      !commonAllergies.some(common => common.toLowerCase() === allergy.toLowerCase())
    );
  });
  
  const [customPreferences, setCustomPreferences] = useState<string[]>(() => {
    const current = user.dietaryPreferences || "";
    const userPreferences = current ? current.split(',').map(item => item.trim()) : [];
    return userPreferences.filter(pref => 
      !commonPreferences.some(common => common.toLowerCase() === pref.toLowerCase())
    );
  });

  // Update form values when selections change
  const updateAllergiesValue = (allergies: string[]) => {
    setValue("allergies", allergies.join(", "));
    setSelectedAllergies(allergies);
  };

  const updatePreferencesValue = (preferences: string[]) => {
    setValue("dietaryPreferences", preferences.join(", "));
    setSelectedPreferences(preferences);
  };

  // Toggle allergy selection
  const toggleAllergy = (allergy: string) => {
    const normalized = allergy.trim();
    if (selectedAllergies.some(a => a.toLowerCase() === normalized.toLowerCase())) {
      // Remove if already selected
      updateAllergiesValue(selectedAllergies.filter(a => a.toLowerCase() !== normalized.toLowerCase()));
    } else {
      // Add if not selected
      updateAllergiesValue([...selectedAllergies, normalized]);
    }
  };

  // Toggle preference selection
  const togglePreference = (preference: string) => {
    const normalized = preference.trim();
    if (selectedPreferences.some(p => p.toLowerCase() === normalized.toLowerCase())) {
      // Remove if already selected
      updatePreferencesValue(selectedPreferences.filter(p => p.toLowerCase() !== normalized.toLowerCase()));
    } else {
      // Add if not selected
      updatePreferencesValue([...selectedPreferences, normalized]);
    }
  };

  // Remove custom allergy completely
  const removeCustomAllergy = (allergy: string) => {
    const normalized = allergy.trim();
    // Remove from custom allergies list
    setCustomAllergies(customAllergies.filter(a => a.toLowerCase() !== normalized.toLowerCase()));
    // Remove from selected allergies list if selected
    if (selectedAllergies.some(a => a.toLowerCase() === normalized.toLowerCase())) {
      updateAllergiesValue(selectedAllergies.filter(a => a.toLowerCase() !== normalized.toLowerCase()));
    }
  };

  // Remove custom preference completely
  const removeCustomPreference = (preference: string) => {
    const normalized = preference.trim();
    // Remove from custom preferences list
    setCustomPreferences(customPreferences.filter(p => p.toLowerCase() !== normalized.toLowerCase()));
    // Remove from selected preferences list if selected
    if (selectedPreferences.some(p => p.toLowerCase() === normalized.toLowerCase())) {
      updatePreferencesValue(selectedPreferences.filter(p => p.toLowerCase() !== normalized.toLowerCase()));
    }
  };

  // Add custom allergy
  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    
    const normalized = customAllergy.trim();
    if (!selectedAllergies.some(a => a.toLowerCase() === normalized.toLowerCase())) {
      // Add to selected allergies
      updateAllergiesValue([...selectedAllergies, normalized]);
      // Add to custom allergies
      setCustomAllergies([...customAllergies, normalized]);
    }
    
    setCustomAllergy("");
    setShowCustomAllergyInput(false);
  };

  // Add custom preference
  const addCustomPreference = () => {
    if (!customPreference.trim()) return;
    
    const normalized = customPreference.trim();
    if (!selectedPreferences.some(p => p.toLowerCase() === normalized.toLowerCase())) {
      // Add to selected preferences
      updatePreferencesValue([...selectedPreferences, normalized]);
      // Add to custom preferences
      setCustomPreferences([...customPreferences, normalized]);
    }
    
    setCustomPreference("");
    setShowCustomPreferenceInput(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-4">
            <div>
              <Label>First Name</Label>
              <Input placeholder="First name" {...register("firstName")} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input placeholder="Last name" {...register("lastName")} />
            </div>
            <div>
              <Label>About Me</Label>
              <Textarea 
                placeholder="Tell others about yourself" 
                {...register("bio")} 
                rows={4}
                className="resize-none"
              />
            </div>
            <div>
              <Label className="block mb-2">Allergies</Label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Common allergies */}
                {commonAllergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="outline"
                    className={`cursor-pointer hover:bg-secondary transition-colors px-3 py-1 ${
                      selectedAllergies.some(
                        (a) => a.toLowerCase() === allergy.toLowerCase()
                      )
                        ? "bg-red-50 text-red-700 border-red-200"
                        : ""
                    }`}
                    onClick={() => toggleAllergy(allergy)}
                  >
                    {allergy}
                  </Badge>
                ))}
                
                {/* Custom allergies */}
                {customAllergies.map((allergy) => (
                  <Badge
                    key={`custom-${allergy}`}
                    variant="outline"
                    className={`cursor-pointer hover:bg-secondary transition-colors px-3 py-1 flex items-center gap-1 ${
                      selectedAllergies.some(
                        (a) => a.toLowerCase() === allergy.toLowerCase()
                      )
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}
                    onClick={() => toggleAllergy(allergy)}
                  >
                    {allergy}
                    <span 
                      className="ml-1 rounded-full bg-gray-200 w-4 h-4 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomAllergy(allergy);
                      }}
                    >
                      ×
                    </span>
                  </Badge>
                ))}
                
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary transition-colors px-3 py-1"
                  onClick={() => setShowCustomAllergyInput(!showCustomAllergyInput)}
                >
                  + Other
                </Badge>
              </div>
              
              {showCustomAllergyInput && (
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Enter custom allergy"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAllergy())}
                  />
                  <Button type="button" onClick={addCustomAllergy}>Add</Button>
                </div>
              )}
              
              <input
                type="hidden"
                {...register("allergies")}
              />
              
              <p className="text-xs text-muted-foreground mt-2">
                Click options above to add or remove allergies
              </p>
            </div>
            
            <div>
              <Label className="block mb-2">Dietary Preferences</Label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Common preferences */}
                {commonPreferences.map((preference) => (
                  <Badge
                    key={preference}
                    variant="outline"
                    className={`cursor-pointer hover:bg-secondary transition-colors px-3 py-1 ${
                      selectedPreferences.some(
                        (p) => p.toLowerCase() === preference.toLowerCase()
                      )
                        ? "bg-green-50 text-green-700 border-green-200"
                        : ""
                    }`}
                    onClick={() => togglePreference(preference)}
                  >
                    {preference}
                  </Badge>
                ))}
                
                {/* Custom preferences */}
                {customPreferences.map((preference) => (
                  <Badge
                    key={`custom-${preference}`}
                    variant="outline"
                    className={`cursor-pointer hover:bg-secondary transition-colors px-3 py-1 flex items-center gap-1 ${
                      selectedPreferences.some(
                        (p) => p.toLowerCase() === preference.toLowerCase()
                      )
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-teal-50 text-teal-700 border-teal-200"
                    }`}
                    onClick={() => togglePreference(preference)}
                  >
                    {preference}
                    <span 
                      className="ml-1 rounded-full bg-gray-200 w-4 h-4 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomPreference(preference);
                      }}
                    >
                      ×
                    </span>
                  </Badge>
                ))}
                
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary transition-colors px-3 py-1"
                  onClick={() => setShowCustomPreferenceInput(!showCustomPreferenceInput)}
                >
                  + Other
                </Badge>
              </div>
              
              {showCustomPreferenceInput && (
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Enter custom preference"
                    value={customPreference}
                    onChange={(e) => setCustomPreference(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomPreference())}
                  />
                  <Button type="button" onClick={addCustomPreference}>Add</Button>
                </div>
              )}
              
              <input
                type="hidden"
                {...register("dietaryPreferences")}
              />
              
              <p className="text-xs text-muted-foreground mt-2">
                Click options above to add or remove dietary preferences
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ChangePasswordModal = (props: { open: boolean; onClose: () => void }) => {
  const {
    register,
    submit,
    formState: { isSubmitting, errors },
    setError,
  } = useActionForm(api.user.changePassword, {
    onSuccess: props.onClose,
    onSubmit: (data) => {
      // Validate that passwords match before submitting
      if (data.newPassword !== data.confirmPassword) {
        setError("confirmPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        return false;
      }
      return true;
    }
  });

  return (
    <Dialog open={props.open} onOpenChange={props.onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-4">
            <div>
              <Label>Current password</Label>
              <Input 
                type="password" 
                placeholder="Enter current password" 
                {...register("currentPassword", { required: true })} 
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.currentPassword.message || "Current password is required"}
                </p>
              )}
            </div>
            <div>
              <Label>New password</Label>
              <Input 
                type="password" 
                placeholder="Enter new password" 
                {...register("newPassword", { required: true })} 
              />
              {errors.newPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.newPassword.message || "New password is required"}
                </p>
              )}
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input 
                type="password" 
                placeholder="Confirm new password" 
                {...register("confirmPassword", { required: true })} 
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.confirmPassword.message || "Password confirmation is required"}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Changing password..." : "Change password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
