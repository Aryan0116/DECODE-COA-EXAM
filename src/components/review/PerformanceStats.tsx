import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { getExamPerformanceStats } from "@/utils/supabaseStorage";
import { Loader2, AlertCircle, Trophy } from "lucide-react";

interface PerformanceStatsProps {
  examId?: string;
  stats?: any;
}

const PerformanceStats = ({ examId, stats: providedStats }: PerformanceStatsProps) => {
  const [stats, setStats] = useState<any>(providedStats || null);
  const [loading, setLoading] = useState<boolean>(!providedStats && !!examId);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    if (providedStats) {
      return;
    }
    
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getExamPerformanceStats(examId!);
        setStats(data);
      } catch (error) {
        console.error("Error fetching performance stats:", error);
        setError("Failed to load statistics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchStats();
    }
  }, [examId, providedStats]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
          <CardDescription>Analyzing exam data</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading statistics data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-red-50 p-4 flex gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-gray-50 p-6 text-center">
            <p className="text-sm text-muted-foreground">No statistics data is available for this exam yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    topPerformers,
    timeDistribution,
    scoreTrends
  } = stats;

  // Convert raw scores to percentages in score trends
  const percentageScoreTrends = scoreTrends.map(trend => ({
    ...trend,
    avgScorePercentage: trend.avgScore // Assuming avgScore is already a percentage
  }));

  // Prepare score distribution data for pie chart
  const scoreRanges = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 }
  ];

  // Calculate score distribution based on top performers data
  if (topPerformers && topPerformers.length > 0) {
    topPerformers.forEach(performer => {
      const score = parseFloat(performer.percentage);
      if (score <= 20) scoreRanges[0].count++;
      else if (score <= 40) scoreRanges[1].count++;
      else if (score <= 60) scoreRanges[2].count++;
      else if (score <= 80) scoreRanges[3].count++;
      else scoreRanges[4].count++;
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Statistics</CardTitle>
        <CardDescription>
          Score trends and performance analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border flex items-start gap-3">
            <Trophy className="h-5 w-5 text-amber-500 mt-1" />
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground mb-2">Top Performers</p>
              <div className="space-y-2">
                {topPerformers && topPerformers.length > 0 ? (
                  topPerformers.slice(0, 5).map((performer, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-1">
                      <p className="font-medium text-sm">{performer.studentName}</p>
                      <p className="text-green-600 font-medium text-sm">{performer.percentage}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-lg border h-full">
            <p className="text-sm text-muted-foreground mb-8">Score Distribution</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="110%">
                <PieChart>
                  <Pie
                    data={scoreRanges}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="60%"
                    dataKey="count"
                    nameKey="range"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                  >
                    {scoreRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => {
                      if (typeof value === 'number') {
                        return [`${value.toFixed(1)}%`, 'Average Score'];
                      }
                      return [value, 'Average Score'];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="trends">Score Trends</TabsTrigger>
            {/* <TabsTrigger value="time">Completion Time</TabsTrigger> */}
          </TabsList>

          <TabsContent value="trends" className="pt-4">
            <div className="w-full h-72 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={percentageScoreTrends} 
                  margin={{ top: 10, right: 10, left: 5, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft', offset: 10 }} 
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Average Score']}
                    labelFormatter={(label) => `NAME: ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="avgScorePercentage" 
                    stroke="#8884d8" 
                    name="Average Score (%)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="time" className="pt-4">
            <div className="w-full h-72 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeDistribution}
                  margin={{ top: 10, right: 10, left: 5, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Time Range', position: 'insideBottom', offset: -25 }}
                  />
                  <YAxis 
                    label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', offset: 10 }} 
                  />
                  <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="count" fill="#82ca9d" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceStats;
