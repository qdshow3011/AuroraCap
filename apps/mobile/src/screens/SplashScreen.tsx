import { useEffect, useRef, useState, useMemo } from 'react'
import { View, Text, Pressable, Animated, Dimensions, ScrollView, Image } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import React from 'react'

const AuroraLogo = ({ size = 48, color = '#FF0000' }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('../../assets/logo.svg')}
        style={{ width: size, height: size, resizeMode: 'contain' }}
        resizeMode="contain"
      />
    </View>
  )
}

const AuroraLogoWithText = ({ size = 28, color = '#FF0000', textColor = '#FFFFFF' }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <AuroraLogo size={size} color={color} />
      <Text style={{ color: textColor, fontWeight: '600', fontSize: size * 0.5, flexWrap: 'nowrap', fontFamily: 'System' }}>
        Aurora Intelligent Fund
      </Text>
    </View>
  )
}

export default function SplashScreen({ lang, onLangChange, onLogin, onRegister }: { lang: 'zh' | 'en'; onLangChange: (lang: 'zh' | 'en') => void; onLogin: () => void; onRegister: () => void }) {
  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(0)).current
  const scrollViewRef = useRef<ScrollView>(null)
  const [index, setIndex] = useState(0)
  const { width, height } = Dimensions.get('window')
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-(width * 0.1), 0] })
  const insets = useSafeAreaInsets()

  // 定义翻译文本 - 使用useMemo确保在useEffect访问前初始化
  const t = useMemo(() => {
    return lang === 'zh'
      ? {
          slides: [
            { h1: '资金直投，合规透明', h2: '持有正规私募牌照，资金直通盈透证券（IBKR）账户，以严苛风控体系确保资产安全无忧。' },
            { h1: '抢滩 AI，决胜美股', h2: '深度聚焦全球人工智能浪潮，优选美股核心 ETF 赛道，助您在科技变革的时代风口精准猎金。' },
            { h1: '精英掌舵，智慧领航', h2: '汇聚华尔街资深操盘团队，凭借多年实战经验与独到策略，为您在复杂市场中稳健穿越周期。' }
          ],
          register: '注册', login: '登录', demo: '特约观察员'
        }
      : {
          slides: [
            { h1: 'Direct Investment, Compliance & Transparency', h2: 'Holding official private equity licenses, funds go directly to Interactive Brokers (IBKR) accounts, ensuring asset safety through rigorous risk control systems.' },
            { h1: 'Seize AI Opportunities, Dominate US Stocks', h2: 'Deep focus on the global AI wave, selecting core US stock ETF tracks to help you capitalize on technological transformation.' },
            { h1: 'Expert-Led, Intelligent Navigation', h2: 'Bringing together experienced Wall Street trading teams with years of practical experience and unique strategies to navigate complex markets steadily.' }
          ],
          register: 'Register', login: 'Login', demo: 'Guest Observer'
        }
  }, [lang])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(slide, { toValue: 1, duration: 800, useNativeDriver: true })
        ]),
        Animated.delay(1200),
        Animated.parallel([
          Animated.timing(fade, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(slide, { toValue: 0, duration: 800, useNativeDriver: true })
        ])
      ])
    ).start()
  }, [fade, slide])

  // 自动轮播逻辑
  useEffect(() => {
    if (!t || !t.slides) return
    
    const interval = setInterval(() => {
      const nextIndex = (index + 1) % t.slides.length
      setIndex(nextIndex)
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true })
    }, 3000) // 每3秒切换一次

    return () => clearInterval(interval) // 清理定时器
  }, [index, t.slides?.length, width, lang, t])

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      {/* 顶部广告轮播区域 */}
      <View style={{ flex: 1, maxHeight: height * 0.4, paddingTop: insets.top }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x
            const i = Math.round(x / width)
            setIndex(i)
          }}
          scrollEventThrottle={16}
        >
          {t.slides.map((s, i) => (
            <View key={i} style={{ width, height: height * 0.4, padding: 24, justifyContent: 'center' }}>
              <Animated.View style={{ opacity: fade, transform: [{ translateX }] }}>
                <AuroraLogoWithText size={28} color="#FF0000" textColor="#FFFFFF" />
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '600', marginTop: 16, fontFamily: 'System' }}>{s.h1}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8, lineHeight: 20, fontFamily: 'System' }}>{s.h2}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>
        {/* 轮播指示器 */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: index === i ? '#0a84ff' : '#374151' }} />
          ))}
        </View>
      </View>
      
      {/* 中间按钮区域 */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 12 }}>
        <Pressable onPress={onRegister} style={{ width: '100%', backgroundColor: '#0a84ff', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>{t.register}</Text>
        </Pressable>
        <Pressable onPress={onLogin} style={{ width: '100%', backgroundColor: '#10b981', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>{t.login}</Text>
        </Pressable>

      </View>
      
      {/* 底部语言和版权信息区域 */}
      <View style={{ paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => onLangChange(lang === 'zh' ? 'en' : 'zh')} style={{ padding: 6, backgroundColor: '#374151', borderRadius: 4 }}>
          <Text style={{ color: '#fff', fontSize: 10 }}>En/中</Text>
        </Pressable>
        <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 12 }}>Aurora Intelligent Fund</Text>
      </View>
    </View>
  )
}
