import { Card, CardContent } from "@/components/ui/card";

const colorMap = {
  blue: {
    background: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-100 dark:border-blue-900",
    iconBg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-600 dark:text-blue-400",
    title: "text-blue-600 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-300"
  },
  green: {
    background: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-100 dark:border-green-900",
    iconBg: "bg-green-100 dark:bg-green-900",
    text: "text-green-600 dark:text-green-400",
    title: "text-green-600 dark:text-green-400",
    value: "text-green-700 dark:text-green-300"
  },
  purple: {
    background: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-100 dark:border-purple-900",
    iconBg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-600 dark:text-purple-400",
    title: "text-purple-600 dark:text-purple-400",
    value: "text-purple-700 dark:text-purple-300"
  },
  amber: {
    background: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-100 dark:border-amber-900",
    iconBg: "bg-amber-100 dark:bg-amber-900",
    text: "text-amber-600 dark:text-amber-400",
    title: "text-amber-600 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-300"
  }
};

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: keyof typeof colorMap;
};

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const styles = colorMap[color];

  return (
    <Card className={`${styles.background} ${styles.border}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`${styles.iconBg} p-3 rounded-full`}>
            <div className={styles.text}>{icon}</div>
          </div>
          <div>
            <p className={`text-sm ${styles.title} font-medium`}>{title}</p>
            <h3 className={`text-2xl font-bold ${styles.value}`}>{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;