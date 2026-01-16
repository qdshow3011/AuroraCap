import { View } from 'react-native'

export default function NavChart({ data }: { data: number[] }) {
  const max = Math.max(...data)
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end', paddingVertical: 12 }}>
      {data.map((v, i) => {
        // 比较当前值与前一个值，确定涨跌颜色
        // 第一个值默认使用绿色
        const isUp = i > 0 && v > data[i - 1]
        const barColor = isUp ? '#ef4444' : '#10b981' // 上涨红色，下跌绿色
        return (
          <View key={i} style={{ width: 8, height: Math.max(4, (v / max) * 60), backgroundColor: barColor, borderRadius: 2 }} />
        )
      })}
    </View>
  )
}
