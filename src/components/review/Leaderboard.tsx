
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, Award, TrendingUp, Star } from 'lucide-react';

interface LeaderboardProps {
  examId: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ examId }) => {
  // We're going to re-use the component from the leaderboard directory
  // This component just serves as a wrapper to maintain the import paths
  const LeaderboardComponent = React.lazy(() => import('@/components/leaderboard/Leaderboard'));
  
  return (
    <React.Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> 
            Loading Leaderboard...
          </CardTitle>
          <CardDescription>
            Please wait while we fetch the latest student rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse flex flex-col items-center">
              <Award className="h-10 w-10 text-gray-300 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    }>
      <LeaderboardComponent examId={examId} />
    </React.Suspense>
  );
};

export default Leaderboard;