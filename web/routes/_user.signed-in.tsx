import { Card } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import { useOutletContext, Link } from "react-router";
import type { AuthOutletContext } from "./_user";

export default function () {
  const { gadgetConfig, user } = useOutletContext<AuthOutletContext>();

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/post" className="h-full">
            <Card className="flex h-full flex-col items-center justify-center p-12 md:p-16 transition-all hover:bg-green-500 hover:scale-105 shadow-lg border-2 border-transparent hover:border-green-600 rounded-xl">
              <PlusCircle className="mb-6 h-20 w-20 text-black" />
              <h2 className="text-3xl font-bold">Post</h2>
              <p className="mt-4 text-center text-muted-foreground text-lg">
                Create a new post to share with others
              </p>
            </Card>
          </Link>
          <Link to="/search" className="h-full">
            <Card className="flex h-full flex-col items-center justify-center p-12 md:p-16 transition-all hover:bg-green-500 hover:scale-105 shadow-lg border-2 border-transparent hover:border-green-600 rounded-xl">
              <Search className="mb-6 h-20 w-20 text-black" />
              <h2 className="text-3xl font-bold">Find</h2>
              <p className="mt-4 text-center text-muted-foreground text-lg">
                Find content from other users
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
