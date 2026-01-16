import { View, Text } from 'react-native'

export default function TestScreen() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#000' }}>
      <Text style={{ color: '#fff' }}>Test Screen</Text>
      <View>
        <Text>Valid content inside Text component</Text>
      </View>
      <View><Text style={{ color: '#fff' }}>Invalid content directly in View</Text></View>
    </View>
  )
}