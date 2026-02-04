import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, TextInput, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { registerUser, RegisterData } from '../api/auth/register'
import { loginUser, LoginData } from '../api/auth/login'

type Props = {
  lang: 'zh' | 'en'
  setLang: (l: 'zh' | 'en') => void
  onAuthed: (userInfo?: any) => void
  initialTab?: 'login' | 'register'
  onBack?: () => void
}

export default function AuthScreen({ lang, setLang, onAuthed, initialTab = 'login', onBack }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const t = lang === 'zh'
    ? { 
        title: '登录', register: '注册', email: '电子邮箱', 
        password: '密码', confirmPassword: '确认密码',
        name: '姓名',
        phone: '手机号码', idNumber: '身份证号/护照号码',
        inviteCode: '邀请码', demo: '特约观察员', login: '登录', 
        signup: '注册', switch: '切换到', en: 'English', zh: '中文',
        invalidEmail: '请输入有效的电子邮箱',
        invalidPassword: '密码长度不能少于6位',
        invalidName: '请输入姓名',
        invalidPhone: '请输入有效的手机号码',
        invalidIdNumber: '请输入有效的身份证号或护照号码',
        passwordMismatch: '两次输入的密码不一致',
        inviteCodeRequired: '邀请码不能为空'
      }
    : { 
        title: 'Login', register: 'Register', email: 'Email', 
        password: 'Password', confirmPassword: 'Confirm Password',
        name: 'Full Name',
        phone: 'Phone Number', idNumber: 'ID/Passport Number',
        inviteCode: 'Invite Code', demo: 'Guest Observer', login: 'Login', 
        signup: 'Sign Up', switch: 'Switch to', en: 'English', zh: '中文',
        invalidEmail: 'Please enter a valid email address',
        invalidPassword: 'Password must be at least 6 characters long',
        invalidName: 'Please enter your full name',
        invalidPhone: 'Please enter a valid phone number',
        invalidIdNumber: 'Please enter a valid ID or passport number',
        passwordMismatch: 'Passwords do not match',
        inviteCodeRequired: 'Invite code is required'
      }



  async function handleLogin() {
    setError('')
    if (!loginId || !password) {
      setError(lang === 'zh' ? '请输入身份证号/护照号码/手机号码和密码' : 'Please enter ID/Passport/Phone and password')
      return
    }
    
    try {
      // 使用本地API进行登录
      const loginData: LoginData = {
        loginId,
        password
      };
      
      const result = await loginUser(loginData);
      
      console.log('Login result:', result);
      
      if (result.message === 'Login successful' && result.data?.user) {
        // 登录成功，传递用户信息
        console.log('Login successful, user info:', result.data.user);
        onAuthed(result.data.user)
      } else {
        console.log('Login failed, error:', result.error);
        setError(result.error || (lang === 'zh' ? '登录失败，请稍后重试' : 'Login failed, please try again later'))
      }
    } catch (err) {
      setError(lang === 'zh' ? '登录过程中发生错误' : 'An error occurred during login')
      console.error('Login error:', err)
    }
  }

  async function handleSignup() {
    setError('')
    if (!password || password.length < 6) {
      setError(t.invalidPassword)
      return
    }
    
    if (!name) {
      setError(t.invalidName)
      return
    }
    
    if (!phone || phone.length < 10) {
      setError(t.invalidPhone)
      return
    }
    
    if (!idNumber || idNumber.length < 5) {
      setError(t.invalidIdNumber)
      return
    }
    
    if (!inviteCode || inviteCode.length < 6) {
      setError(t.inviteCodeRequired)
      return
    }
    
    try {
      // 使用本地API进行注册
      const registerData: RegisterData = {
        password,
        name,
        phone,
        id_number: idNumber,
        invitation_code: inviteCode
      };
      
      const result = await registerUser(registerData);
      
      if (result.message === 'User registered successfully') {
        // 注册成功
        onAuthed()
      } else {
        setError(result.error || (lang === 'zh' ? '注册失败，请稍后重试' : 'Registration failed, please try again later'))
      }
    } catch (err) {
      setError(lang === 'zh' ? '注册过程中发生错误' : 'An error occurred during registration')
      console.error('Signup error:', err)
    }
  }

  // 根据initialTab决定显示登录还是注册表单
  const isLogin = initialTab === 'login'
  
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#000' }}>
      {/* 返回按钮放到最顶部 */}
      {onBack && (
        <View style={{ width: '100%', maxWidth: 400, marginBottom: 20 }}>
          <Pressable onPress={onBack} style={{ alignSelf: 'flex-start', paddingVertical: 8 }}>
            <Text style={{ color: '#0a84ff', fontSize: 16 }}>{lang === 'zh' ? '返回' : 'Back'}</Text>
          </Pressable>
        </View>
      )}
      
      <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
        {/* Logo and Title - Only show on login page */}
        {isLogin && (
          <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 32 }}>
            <Text style={{ color: '#10b981', fontSize: 36, fontWeight: 'bold', marginBottom: 8 }}>Aurora</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '500' }}>Intelligent Fund</Text>
          </View>
        )}
        
        {/* Form Container */}
        <View style={{ width: '100%', maxWidth: 400, gap: 12, marginBottom: 40 }}>
          {isLogin ? (
            <React.Fragment>
              {/* Login Title */}
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>{t.login}</Text>
              
              {/* Form Fields */}
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>{lang === 'zh' ? '身份证号/护照号码/手机号码' : 'ID/Passport/Phone'}</Text>
              <TextInput 
                value={loginId} 
                onChangeText={setLoginId} 
                placeholder={lang === 'zh' ? '请输入身份证号/护照号码/手机号码' : 'Enter ID/Passport/Phone'} 
                placeholderTextColor="#6b7280" 
                keyboardType="default"
                autoCapitalize="none"
                style={{ 
                  backgroundColor: '#1f2937', 
                  color: '#fff', 
                  padding: 14, 
                  borderRadius: 8, 
                  borderWidth: 1, 
                  borderColor: '#374151',
                  fontSize: 16
                }} 
              />
              
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>{t.password}</Text>
              <View style={{ position: 'relative' }}>
                <TextInput 
                  value={password} 
                  onChangeText={setPassword} 
                  placeholder={t.password} 
                  placeholderTextColor="#6b7280" 
                  secureTextEntry={!showPassword}
                  style={{ 
                    backgroundColor: '#1f2937', 
                    color: '#fff', 
                    padding: 14, 
                    borderRadius: 8, 
                    borderWidth: 1, 
                    borderColor: '#374151',
                    fontSize: 16,
                    paddingRight: 48
                  }} 
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={{ 
                    position: 'absolute', 
                    right: 12, 
                    top: '50%', 
                    transform: [{ translateY: -12 }]
                  }}
                >
                  <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                    {showPassword ? (lang === 'zh' ? '隐藏' : 'Hide') : (lang === 'zh' ? '显示' : 'Show')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Error Message */}
              {!!error && (
                <Text style={{ 
                  color: '#ef4444', 
                  marginTop: 12, 
                  textAlign: 'center',
                  padding: 8, 
                  borderRadius: 4, 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }}>{error}</Text>
              )}
              
              {/* Login Button */}
              <Pressable 
                onPress={handleLogin} 
                style={{ 
                  backgroundColor: '#10b981', 
                  padding: 14, 
                  borderRadius: 8, 
                  marginTop: 20,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3.84,
                  elevation: 5
                }}
                android_ripple={{ color: '#059669' }}
              >
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>{t.login}</Text>
              </Pressable>
              

            </React.Fragment>
          ) : (
            <React.Fragment>
              {/* Title */}
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>{t.register}</Text>
              
              {/* Form Fields */}
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>{t.name}</Text>
              <TextInput 
                value={name} 
                onChangeText={setName} 
                placeholder={t.name} 
                placeholderTextColor="#6b7280" 
                autoCapitalize="words"
                style={{ 
                  backgroundColor: '#1f2937', 
                  color: '#fff', 
                  padding: 14, 
                  borderRadius: 8, 
                  borderWidth: 1, 
                  borderColor: '#374151',
                  fontSize: 16
                }} 
              />
              
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>{t.idNumber}</Text>
              <TextInput 
                value={idNumber} 
                onChangeText={setIdNumber} 
                placeholder={t.idNumber} 
                placeholderTextColor="#6b7280" 
                style={{ 
                  backgroundColor: '#1f2937', 
                  color: '#fff', 
                  padding: 14, 
                  borderRadius: 8, 
                  borderWidth: 1, 
                  borderColor: '#374151',
                  fontSize: 16
                }} 
              />
              
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>{t.phone}</Text>
              <TextInput 
                value={phone} 
                onChangeText={setPhone} 
                placeholder={t.phone} 
                placeholderTextColor="#6b7280" 
                keyboardType="phone-pad"
                style={{ 
                  backgroundColor: '#1f2937', 
                  color: '#fff', 
                  padding: 14, 
                  borderRadius: 8, 
                  borderWidth: 1, 
                  borderColor: '#374151',
                  fontSize: 16
                }} 
              />
              
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>{t.password}</Text>
              <View style={{ position: 'relative' }}>
                <TextInput 
                  value={password} 
                  onChangeText={setPassword} 
                  placeholder={t.password} 
                  placeholderTextColor="#6b7280" 
                  secureTextEntry={!showPassword}
                  style={{ 
                    backgroundColor: '#1f2937', 
                    color: '#fff', 
                    padding: 14, 
                    borderRadius: 8, 
                    borderWidth: 1, 
                    borderColor: '#374151',
                    fontSize: 16,
                    paddingRight: 48
                  }} 
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)} 
                  style={{ 
                    position: 'absolute', 
                    right: 12, 
                    top: '50%', 
                    transform: [{ translateY: -12 }]
                  }}
                >
                  <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                    {showPassword ? (lang === 'zh' ? '隐藏' : 'Hide') : (lang === 'zh' ? '显示' : 'Show')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={{ color: '#9ca3af', marginTop: 12 }}>{t.inviteCode}</Text>
              <TextInput 
                value={inviteCode} 
                onChangeText={setInviteCode} 
                placeholder={t.inviteCode} 
                placeholderTextColor="#6b7280" 
                style={{ 
                  backgroundColor: '#1f2937', 
                  color: '#fff', 
                  padding: 14, 
                  borderRadius: 8, 
                  borderWidth: 1, 
                  borderColor: '#374151',
                  fontSize: 16
                }} 
              />
              
              {/* Error Message */}
              {!!error && (
                <Text style={{ 
                  color: '#ef4444', 
                  marginTop: 12, 
                  textAlign: 'center',
                  padding: 8, 
                  borderRadius: 4, 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)'
                }}>{error}</Text>
              )}
              
              {/* Signup Button */}
              <Pressable 
                onPress={handleSignup} 
                style={{
                  backgroundColor: '#10b981', 
                  padding: 14, 
                  borderRadius: 8, 
                  marginTop: 20,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3.84,
                  elevation: 5
                }}
                android_ripple={{ color: '#059669' }}
              >
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>{t.signup}</Text>
              </Pressable>
            </React.Fragment>
          )}
        </View>
      </View>
      
      {/* Help Section - Always at the bottom */}
      <View style={{ marginBottom: 20, textAlign: 'center', width: '100%' }}>
        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>
          {lang === 'zh' ? '需要帮助吗？' : 'Need help?'} 
          <Text 
            style={{ color: '#0a84ff', fontWeight: '500' }} 
            onPress={() => {
              Alert.alert(
                lang === 'zh' ? '联系我们' : 'Contact Us',
                `${lang === 'zh' ? '客服电话：' : 'Customer Service Phone: '}400-123-4567\n${lang === 'zh' ? '微信号：' : 'WeChat: '}AuroraFund_Support`,
                [{ text: lang === 'zh' ? '确定' : 'OK', style: 'default' }]
              )
            }}
          >
            {lang === 'zh' ? '联系我们' : 'Contact Us'}
          </Text>
        </Text>
      </View>
    </View>
  )
}
