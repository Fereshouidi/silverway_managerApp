import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Chart from './chart';
import axios from 'axios';
import { backEndUrl } from '@/api';
import { colors } from '@/constants';

type ProfitData = { date: string; profit: number };

interface Props {
  dateFrom: Date;
  dateTo: Date;
  refreshing?: boolean; // استقبال حالة التحديث من الأب
}

const ProfitsChartByDate = ({ dateFrom, dateTo, refreshing = false }: Props) => {
  const [reportData, setReportData] = useState<ProfitData[]>([]);
  const [trendValue, setTrendValue] = useState<string>("0.0"); 
  const [loading, setLoading] = useState(true);

  // 1. دالة ملء الأيام الناقصة بـ 0 لضمان استمرارية الرسم البياني
  const fillMissingDays = (data: ProfitData[], start: Date, end: Date): ProfitData[] => {
    const filled: ProfitData[] = [];
    let curr = new Date(start);
    const dataMap = new Map(data.map(item => [item.date, item.profit]));

    while (curr <= end) {
      const dStr = curr.toISOString().split('T')[0];
      filled.push({ date: dStr, profit: dataMap.get(dStr) || 0 });
      curr.setDate(curr.getDate() + 1);
    }
    return filled;
  };

  // 2. دالة التجميع الذكي (يومي، أسبوعي، أو شهري)
  const processSmartData = (data: ProfitData[], start: Date, end: Date) => {
    const fullData = fillMissingDays(data, start, end);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 14) return fullData;

    const step = diffDays <= 60 ? 7 : 30;
    const grouped: ProfitData[] = [];

    for (let i = 0; i < fullData.length; i += step) {
      const chunk = fullData.slice(i, i + step);
      const total = chunk.reduce((sum, item) => sum + item.profit, 0);
      grouped.push({
        date: diffDays <= 60 ? `W${Math.floor(i/7) + 1}` : chunk[0].date.substring(0, 7),
        profit: total
      });
    }
    return grouped;
  };

  const fetchData = async () => {
    try {
      // إذا كان هناك Pull-to-refresh نشط، لا تظهر مؤشر التحميل الداخلي
      if (!refreshing) setLoading(true);
      
      const res = await axios.get(`${backEndUrl}/getProfitsByDate`, {
        params: { from: dateFrom.getTime(), to: dateTo.getTime() }
      });
      
      const profitsArray = res.data.profits || []; 
      const trend = res.data.trend || "0.0";

      setReportData(processSmartData(profitsArray, dateFrom, dateTo));
      setTrendValue(trend);
    } catch (e) {
      console.error("Chart Data Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo, refreshing]); // التحديث عند تغيير التاريخ أو طلب تحديث يدوي

  const total = reportData.reduce((acc, curr) => acc + curr.profit, 0);
  const isPositive = Number(trendValue) >= 0;

  return (
    <View className="bg-white rounded-[35px] p-5 shadow-sm border border-gray-100 my-4">
      <View className="flex-row justify-between mb-4 px-2">
        <View>
          <Text className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Total Period Profit</Text>
          <Text className="text-2xl font-black" style={{ color: colors.dark[100] }}>
            {loading && !refreshing ? "..." : `${total.toLocaleString('fr-FR')} DT`}
          </Text>
        </View>
        
        {(!loading || refreshing) && (
          <View className={`${isPositive ? 'bg-green-100' : 'bg-red-100'} px-3 py-1 rounded-full h-7 justify-center items-center shadow-sm`}>
            <Text className={`${isPositive ? 'text-green-700' : 'text-red-700'} text-[11px] font-black`}>
              {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{trendValue}%
            </Text>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View className="h-44 items-center justify-center">
          <ActivityIndicator color={colors.dark[100]} size="large" />
          <Text className="text-gray-400 mt-2 text-xs">Loading analytics...</Text>
        </View>
      ) : reportData.length > 0 ? (
        <Chart dataPoints={reportData} />
      ) : (
        <View className="h-44 items-center justify-center bg-gray-50 rounded-[25px] border border-dashed border-gray-200">
          <Text className="text-gray-400 font-medium">No financial data for this period</Text>
        </View>
      )}
    </View>
  );
};

export default ProfitsChartByDate;