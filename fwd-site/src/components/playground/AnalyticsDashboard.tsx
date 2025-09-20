import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, Clock,
  Activity, Target, Zap, BarChart3, CheckCircle
} from 'lucide-react';
import { trackMetric } from './ValueCounter';

interface Metric {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

export default function AnalyticsDashboard() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [chartData, setChartData] = useState({
    weekly: [
      { day: 'Mon', tasks: 45, saved: 8 },
      { day: 'Tue', tasks: 52, saved: 9 },
      { day: 'Wed', tasks: 48, saved: 8.5 },
      { day: 'Thu', tasks: 61, saved: 11 },
      { day: 'Fri', tasks: 58, saved: 10.5 },
      { day: 'Sat', tasks: 42, saved: 7.5 },
      { day: 'Sun', tasks: 38, saved: 7 }
    ]
  });
  
  const [metrics] = useState<Metric[]>([
    {
      label: 'Hours Saved Weekly',
      value: '47',
      change: 12,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-purple-600'
    },
    {
      label: 'Tasks Automated',
      value: '1,284',
      change: 28,
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-blue-600'
    },
    {
      label: 'Cost Reduction',
      value: '£8,450',
      change: 35,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-600'
    },
    {
      label: 'Efficiency Gain',
      value: '92%',
      change: 18,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-gold'
    }
  ]);

  const efficiencyMetrics = [
    { name: 'Productivity', value: 89, color: '#8b5cf6' },
    { name: 'Accuracy', value: 98, color: '#3b82f6' },
    { name: 'Speed', value: 94, color: '#10b981' },
    { name: 'Cost Savings', value: 76, color: '#F7D00B' }
  ];

  const taskBreakdown = [
    { task: 'Data Entry', before: 120, after: 5, saved: 115 },
    { task: 'Email Responses', before: 90, after: 10, saved: 80 },
    { task: 'Report Generation', before: 180, after: 15, saved: 165 },
    { task: 'Customer Support', before: 240, after: 30, saved: 210 },
    { task: 'Invoice Processing', before: 60, after: 3, saved: 57 }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => ({
        weekly: prev.weekly.map(item => ({
          ...item,
          tasks: Math.max(30, item.tasks + Math.floor(Math.random() * 10 - 5)),
          saved: Math.max(5, item.saved + (Math.random() * 2 - 1))
        }))
      }));
    }, 3000);

    trackMetric({
      demosCompleted: 1,
      tokensUsed: 0,
      timeSaved: 15,
      potentialSavings: 350
    });

    // Trigger initial animation
    setTimeout(() => setIsAnimating(true), 500);

    return () => clearInterval(interval);
  }, []);

  const maxTasks = Math.max(...chartData.weekly.map(d => d.tasks));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">Real-Time Business Analytics</h3>
              <p className="text-sm opacity-90">See how AI transforms your operations instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Live Data</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`bg-gray-50 rounded-lg p-4 ${isAnimating ? 'animate-fade-in' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`${metric.color} text-white w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                {metric.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+{metric.change}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Bar Chart */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Weekly Task Automation</h4>
          <div className="space-y-3">
            {chartData.weekly.map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600 w-12">{day.day}</span>
                <div className="flex-1">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                        style={{ width: `${(day.tasks / maxTasks) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">{day.tasks}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 w-20">+{day.saved}h saved</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Comparison Table */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Before vs After Automation</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                  <th className="pb-2">Task</th>
                  <th className="pb-2 text-center">Before (min)</th>
                  <th className="pb-2 text-center">After (min)</th>
                  <th className="pb-2 text-center">Time Saved</th>
                </tr>
              </thead>
              <tbody>
                {taskBreakdown.map((task, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-sm font-medium text-gray-900">{task.task}</td>
                    <td className="py-3 text-center">
                      <span className="text-red-600 font-medium">{task.before}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-green-600 font-medium">{task.after}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {task.saved} min
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Efficiency Metrics</h4>
            <div className="space-y-4">
              {efficiencyMetrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700">{metric.name}</span>
                    <span className="font-semibold text-gray-900">{metric.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: isAnimating ? `${metric.value}%` : '0%',
                        backgroundColor: metric.color,
                        transitionDelay: `${index * 200}ms`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              AI-Powered Insights
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Peak Efficiency:</strong> Your automation runs best between 9 AM - 11 AM
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Cost Savings:</strong> £8,450 saved this month (35% increase)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Next Step:</strong> Automate inventory management for 40% more savings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-4">Your ROI Calculator</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-green-600">427%</p>
              <p className="text-sm text-gray-600">ROI in Year 1</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">3.2x</p>
              <p className="text-sm text-gray-600">Productivity Boost</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">£47k</p>
              <p className="text-sm text-gray-600">Annual Savings</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gold">2.5 mo</p>
              <p className="text-sm text-gray-600">Payback Period</p>
            </div>
          </div>
        </div>

        {/* What This Means */}
        <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
          <p className="text-sm text-gold-dark">
            <strong>💡 What This Means:</strong> Based on similar businesses, you could save £3,950 per month 
            by automating just your top 5 repetitive tasks. Most clients see positive ROI within 8 weeks.
          </p>
        </div>
      </div>
    </div>
  );
}