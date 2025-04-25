import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { calculatePerformanceAnalytics } from "@/utils/supabaseStorage";
import { Loader2 } from "lucide-react";

interface PerformanceAnalyticsProps {
  examId?: string;
  analytics?: any;
}

const PerformanceAnalytics = ({ examId, analytics: providedAnalytics }: PerformanceAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<any>(providedAnalytics || null);
  const [loading, setLoading] = useState<boolean>(!providedAnalytics && !!examId);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    // Skip fetching if analytics were provided directly
    if (providedAnalytics) {
      return;
    }
    
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await calculatePerformanceAnalytics(examId!);
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setError("Failed to load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchAnalytics();
    }
  }, [examId, providedAnalytics]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Processing exam results</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading analytics data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-gray-50 p-6 text-center">
            <p className="text-sm text-muted-foreground">No analytics data is available for this exam yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { 
    averageScore, 
    totalSubmissions, 
    highestScore, 
    lowestScore, 
    scoreDistribution 
  } = analytics;

  const pieData = scoreDistribution.map(item => ({
    name: item.range,
    value: item.count
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
        <CardDescription>
          Analysis of student performance for this exam
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Average Score</p>
            <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Submissions</p>
            <p className="text-2xl font-bold">{totalSubmissions}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Highest Score</p>
            <p className="text-2xl font-bold">{highestScore}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Lowest Score</p>
            <p className="text-2xl font-bold">{lowestScore}</p>
          </div>
        </div>

        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-2">
            <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
            <TabsTrigger value="percentage">Percentage Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution">
            <div className="w-full h-72 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={scoreDistribution} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="count" fill="#8884d8" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="percentage">
            <div className="w-full h-72 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceAnalytics;