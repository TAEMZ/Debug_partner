import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Team() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team</h1>
        <p className="text-muted-foreground">
          Manage your team members and collaboration
        </p>
      </div>
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground mb-2">Team management coming soon</p>
        <p className="text-sm text-muted-foreground">
          Invite team members and collaborate on problems
        </p>
      </Card>
    </div>
  );
}
