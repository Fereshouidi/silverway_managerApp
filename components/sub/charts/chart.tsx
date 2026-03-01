import React from 'react';
import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type Props = { dataPoints: { date: string; profit: number }[] };

const Chart = ({ dataPoints }: Props) => {
  const screenWidth = Dimensions.get('window').width;

  // تنسيق التاريخ للعرض: إذا كانت البيانات كثيرة، نظهر اليوم/الشهر فقط
  const labels = dataPoints.map(d => {
    const parts = d.date.split('-');
    return parts.length > 2 ? `${parts[2]}/${parts[1]}` : d.date;
  });

  const data = {
    labels: labels,
    datasets: [{
      data: dataPoints.map(d => d.profit),
      color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,
      strokeWidth: 3
    }],
  };

  return (
    <View className="items-center justify-center">
      <LineChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#000',
          backgroundGradientFrom: '#1a1a1a',
          backgroundGradientTo: '#000',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          propsForLabels: { fontSize: 10 }
        }}
        bezier
        // إخفاء بعض العناوين إذا كانت البيانات أكثر من 10 لتجنب التداخل
        hidePointsAtIndex={dataPoints.length > 12 ? dataPoints.map((_, i) => i).filter(i => i % 2 !== 0) : []}
        verticalLabelRotation={dataPoints.length > 8 ? 45 : 0}
        style={{ marginVertical: 8, borderRadius: 20 }}
      />
    </View>
  );
};

export default Chart;