import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function () {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-white to-gray-100">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="text-4xl font-bold text-primary">
              Share<span className="text-blue-500">A</span>Byte
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">Welcome to ShareAByte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            Your platform for sharing food and discovering delicious meals within your community.
          </p>
          
          <div className="space-y-3 pt-2">
            <Button
              variant="default"
              size="lg"
              className="w-full"
              asChild
            >
              <Link to="/sign-up">Sign up</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              asChild
            >
              <Link to="/sign-in">Sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
