import { Link } from "react-router-dom";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-4 text-center">
        <CardTitle>Page not found</CardTitle>
        <CardDescription>
          The page you requested does not exist yet in this frontend skeleton.
        </CardDescription>
        <div>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

