import * as React from "react";
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: Array<{ cpu: number; ram: number } | number>;
  dataKey: 'cpu' | 'ram' | 'value';
  color?: string;
  height?: number;
  width?: number | string;
}

export function Sparkline({
  data,
  dataKey,
  color = "#3b82f6",
  height = 32,
  width = 64,
}: SparklineProps) {
  const formattedData = React.useMemo(() => {
    if (data.length === 0) return [{ [dataKey]: 0 }];
    return data.map(item => typeof item === 'number' ? { [dataKey]: item } : item);
  }, [data, dataKey]);

  return (
    <div style={{ height, width }} className="opacity-70 group-hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id={`gradient-${dataKey}-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#gradient-${dataKey}-${color.replace('#', '')})`} 
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
