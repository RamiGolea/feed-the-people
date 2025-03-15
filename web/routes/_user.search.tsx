import { useState, useEffect } from "react";
import { useFindMany } from "@gadgetinc/react";
import { api } from "../api";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ArrowUp } from "lucide-react";
import { format } from "date-fns";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [userScores, setUserScores] = useState<Record<string, number>>({});
  
  const [{ data, fetching, error }] = useFindMany(api.post, {
    filter: {
      status: {
        equals: "Active"
      }
    },
    search: searchTerm || undefined, // Only apply search if there's a term
    sort: { createdAt: "Descending" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      location: true,
      images: true,
      foodAllergens: true,
      goBadDate: true,
      createdAt: true,
      user: {
        id: true,
        firstName: true,
        lastName: true
      }
    },
  });
  
  // Fetch user scores separately since ShareScore has a belongsTo relationship to User
  useEffect(() => {
    const fetchUserScores = async () => {
      if (!data || data.length === 0) return;
      
      // Get unique user IDs from posts
      const userIds = [...new Set(data.map(post => post.user?.id).filter(Boolean))];
      
      // For each user ID, find their shareScore
      const scores: Record<string, number> = {};
      
      await Promise.all(userIds.map(async (userId) => {
        if (!userId) return;
        
        try {
          // Find the shareScore for this user
          const shareScores = await api.shareScore.findMany({
            filter: {
              userId: {
                equals: userId
              }
            },
            select: {
              id: true,
              score: true,
              userId: true
            }
          });
          
          // If a score was found, save it
          if (shareScores && shareScores.length > 0) {
            scores[userId] = shareScores[0].score ?? 0;
          } else {
            scores[userId] = 0;
          }
        } catch (err) {
          console.error(`Error fetching score for user ${userId}:`, err);
          scores[userId] = 0;
        }
      }));
      
      setUserScores(scores);
    };
    
    fetchUserScores();
  }, [data]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Format the goBadDate to a human-readable format
  const formatDate = (date: string | null | undefined) => {
    if (!date) return null;
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Food</h1>
      
      <div className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by title, description, location, or allergens..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {fetching && <div className="text-center py-8">Loading...</div>}
      
      {error && (
        <div className="text-center py-8 text-red-500">
          Error loading posts: {error.message}
        </div>
      )}
      
      {!fetching && !error && data && data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No food items found. Try adjusting your search.
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        {data?.map((post) => (
          <Link 
            to={`/post?id=${post.id}`} 
            key={post.id}
            className="w-full"
          >
            <Card className="w-full hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 h-48 overflow-hidden">
                  {post.images && Array.isArray(JSON.parse(post.images as string)) && JSON.parse(post.images as string).length > 0 ? (
                    <img 
                      src={JSON.parse(post.images as string)[0]} 
                      alt={post.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 p-4">
                  
                  <div className="flex justify-between items-start">
                    <h2 className="font-semibold text-lg">{post.title}</h2>
                    <div className="flex flex-col items-end gap-1">
                      {post.category && (
                        <Badge variant="secondary" className="capitalize">
                          {post.category}
                        </Badge>
                      )}
                      {post.user && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>
                            {post.user.id ? (userScores[post.user.id] ?? 0) : 0}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">{post.description}</p>                  
                  {post.foodAllergens && (
                    <div className="mt-3">
                      <span className="text-sm font-medium">Allergens: </span>
                      <span className="text-sm text-gray-600">{post.foodAllergens}</span>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    {post.user && (
                      <div className="text-sm text-gray-600 mb-2">
                        Posted by: <span className="font-medium">
                          {post.user.firstName || post.user.lastName 
                            ? `${post.user.firstName || ''} ${post.user.lastName || ''}`.trim()
                            : 'Anonymous'}
                        </span>
                      </div>
                    )}
                  
                    <div className="flex flex-wrap items-center gap-4">
                      {post.location && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {post.location}
                        </div>
                      )}
                      
                      {post.goBadDate && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>Best before: {formatDate(post.goBadDate)}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400 ml-auto">
                        Posted: {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
