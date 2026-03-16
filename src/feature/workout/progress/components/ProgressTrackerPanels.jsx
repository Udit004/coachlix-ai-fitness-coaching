import {
  Clock,
  Weight,
  Target,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Brush,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";

export default function ProgressTrackerPanels({
  activeTab,
  weeklyData,
  strengthData,
  stats,
  progressData,
  selectedWeek,
  setSelectedWeek,
  plan,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Trophy} title="Workouts Completed" value={stats.totalWorkouts} color="blue" />
            <MetricCard icon={Clock} title="Total Duration" value={`${Math.round((stats.totalDuration || 0) / 60)}h`} color="green" />
            <MetricCard icon={Flame} title="Calories Burned" value={stats.caloriesBurned || 0} color="orange" />
            <MetricCard icon={Target} title="Consistency Rate" value={`${stats.consistency || 0}%`} color="purple" />
          </div>

          <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Overview</h3>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={weeklyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis dataKey="week" tick={{ fill: "#9ca3af" }} />
                  <YAxis yAxisId="left" tick={{ fill: "#9ca3af" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="completionRate" name="Completion %" stroke="#3b82f6" fillOpacity={0.2} fill="#93c5fd" />
                  <Bar yAxisId="right" dataKey="workouts" name="Workouts" barSize={24} fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="duration" name="Duration (hrs)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Brush height={20} stroke="#6b7280" travellerWidth={10} />
                  <ReferenceLine yAxisId="left" y={100} stroke="#e5e7eb" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyMessage message="No data available yet. Complete some workouts to see your progress!" />
            )}
          </div>
        </div>
      )}

      {activeTab === "weekly" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Progress Analysis</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                disabled={selectedWeek <= 1}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg font-medium">Week {selectedWeek}</span>
              <button
                onClick={() => setSelectedWeek(Math.min(plan?.duration || 12, selectedWeek + 1))}
                disabled={selectedWeek >= (plan?.duration || 12)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Workouts & Duration</h4>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis dataKey="week" tick={{ fill: "#9ca3af" }} />
                  <YAxis tick={{ fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="workouts" stackId="a" fill="#3b82f6" name="Workouts Completed" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="duration" stackId="a" fill="#10b981" name="Duration (hours)" radius={[6, 6, 0, 0]} />
                  <Brush height={20} stroke="#6b7280" travellerWidth={10} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyMessage message="No weekly data available yet." />
            )}
          </div>
        </div>
      )}

      {activeTab === "strength" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strength Progression</h3>
          {strengthData.length > 0 ? (
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Max Weight Progress</h4>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={strengthData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis dataKey="week" tick={{ fill: "#9ca3af" }} />
                  <YAxis tick={{ fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="maxWeight" name="Max Weight (lbs)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  <Bar dataKey="maxWeight" fill="#f59e0b" name="Max Weight (lbs)" radius={[6, 6, 0, 0]} />
                  <Brush height={20} stroke="#6b7280" travellerWidth={10} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyMessage message="No strength data available yet. Complete some workouts to see your progress!" icon={Weight} />
          )}
        </div>
      )}

      {activeTab === "detailed" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Workout Distribution</h4>
              <div className="space-y-3">
                {plan?.weeks?.map((week, index) => {
                  const weekData = weeklyData[index] || { completionRate: 0 };
                  return (
                    <div key={week.weekNumber} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Week {week.weekNumber}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${weekData.completionRate}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{weekData.completionRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Performance Metrics</h4>
              <div className="space-y-4">
                <StatRow
                  label="Average Workout Duration"
                  value={`${stats.totalWorkouts > 0 ? Math.round((stats.totalDuration || 0) / stats.totalWorkouts) : 0} min`}
                />
                <StatRow
                  label="Total Sets Completed"
                  value={progressData.reduce((total, entry) => total + (entry.setsCompleted || 0), 0)}
                />
                <StatRow
                  label="Total Reps Completed"
                  value={progressData.reduce((total, entry) => total + (entry.repsCompleted || 0), 0)}
                />
                <StatRow label="Plan Completion" value={`${plan?.stats?.completionRate || 0}%`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-3 shadow border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
          Week {label}
        </div>
        {payload.map((entry, idx) => (
          <div key={idx} className="text-xs text-gray-600 dark:text-gray-300 flex items-center space-x-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }}></span>
            <span>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function MetricCard({ icon: Icon, title, value, color }) {
  const palette = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      icon: "text-blue-600 dark:text-blue-400",
      value: "text-blue-900 dark:text-blue-100",
      text: "text-blue-700 dark:text-blue-300",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg: "bg-green-100 dark:bg-green-900",
      icon: "text-green-600 dark:text-green-400",
      value: "text-green-900 dark:text-green-100",
      text: "text-green-700 dark:text-green-300",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      iconBg: "bg-orange-100 dark:bg-orange-900",
      icon: "text-orange-600 dark:text-orange-400",
      value: "text-orange-900 dark:text-orange-100",
      text: "text-orange-700 dark:text-orange-300",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      iconBg: "bg-purple-100 dark:bg-purple-900",
      icon: "text-purple-600 dark:text-purple-400",
      value: "text-purple-900 dark:text-purple-100",
      text: "text-purple-700 dark:text-purple-300",
    },
  };

  const p = palette[color] || palette.blue;

  return (
    <div className={`${p.bg} rounded-xl p-4`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 ${p.iconBg} rounded-lg`}>
          <Icon className={`h-5 w-5 ${p.icon}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${p.value}`}>{value}</p>
          <p className={`text-sm ${p.text}`}>{title}</p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function EmptyMessage({ message, icon: Icon }) {
  return (
    <div className="text-center py-8">
      {Icon ? <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" /> : null}
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}
