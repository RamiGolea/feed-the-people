import { Card } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import { useOutletContext, Link } from "react-router";
import type { AuthOutletContext } from "./_user";

export default function () {
  const { gadgetConfig, user } = useOutletContext<AuthOutletContext>();

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-8">
        <div className="bg-gradient-to-r from-green-200 to-green-300 rounded-xl p-8 text-gray-800 shadow-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <div className="text-xl md:text-2xl max-w-3xl mt-4">
            <p className="font-semibold">Join our community in reducing food waste and helping neighbors in need by sharing your extra food. Share a bite!</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/post" className="h-full">
            <Card className="flex h-full flex-col items-center justify-center p-12 md:p-16 transition-all hover:bg-green-100 hover:scale-105 shadow-lg border-2 border-transparent hover:border-green-600 rounded-xl">
              <PlusCircle className="mb-6 h-20 w-20 text-black" />
              <h2 className="text-3xl font-bold">Post</h2>
              <p className="mt-4 text-center text-muted-foreground text-lg">
                Create a new post to share with others
              </p>
            </Card>
          </Link>
          <Link to="/search" className="h-full">
            <Card className="flex h-full flex-col items-center justify-center p-12 md:p-16 transition-all hover:bg-green-100 hover:scale-105 shadow-lg border-2 border-transparent hover:border-green-600 rounded-xl">
              <Search className="mb-6 h-20 w-20 text-black" />
              <h2 className="text-3xl font-bold">Find</h2>
              <p className="mt-4 text-center text-muted-foreground text-lg">
                Find content from other users
              </p>
            </Card>
          </Link>
        </div>
        
        <Card className="p-8 rounded-xl shadow-lg border-2 border-transparent hover:border-green-600 transition-all">
          <h2 className="text-3xl font-bold mb-6">About us</h2>
          <div className="space-y-4 text-lg">
            <p>
              It all started at cuHacking, Carleton's very own hackathon. While brainstorming ideas for a challenge to help Ottawa, we realized something—we've all been there, staring at food in our fridge that we swore we'd eat, only to end up tossing it out. No one wants to waste food, but sometimes life just gets in the way.
            </p>
            <p>
              That got us thinking: what if there was an easy way to share extra food with people who actually need it? That's how Share a Bite was born.
            </p>
            <p>
              Our platform makes it simple for neighbors to share surplus food—whether it's extra groceries, garden veggies, or leftovers from a big meal. By making sharing easy, we're not just cutting down on waste; we're also helping fight food insecurity and bringing the community closer together.
            </p>
            <p>
              At the end of the day, food is meant to be shared. So let's do it—one bite at a time!
            </p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-100 p-4 rounded-lg">
                <h3 className="font-bold text-xl mb-2 text-green-700">1 in 4</h3>
                <p>Ottawa households experience food insecurity</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <h3 className="font-bold text-xl mb-2 text-green-700">58%</h3>
                <p>Of food produced in Canada is lost or wasted</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <h3 className="font-bold text-xl mb-2 text-green-700">Community</h3>
                <p>Building stronger neighborhoods through sharing</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}