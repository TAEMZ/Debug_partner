import { ActivityFeed } from "@/components/ActivityFeed";

export default function Activity() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Activity Feed</h1>
        <p className="text-muted-foreground">
          Track all your recent actions and updates
        </p>
      </div>
      <ActivityFeed />
    </div>
  );
}
