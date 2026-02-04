import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

export default function FeedbackScreen({ lang = 'zh', onClose, userInfo }: { 
  lang?: 'zh' | 'en'; 
  onClose?: () => void; 
  userInfo?: any; 
}) {
  // 语言翻译
  const t = lang === 'zh' ? {
    title: '意见反馈',
    back: '返回',
    feedbackType: '反馈类型',
    functionSuggestion: '功能建议',
    bugReport: 'Bug报告',
    userExperience: '用户体验',
    other: '其他',
    feedbackContent: '反馈内容',
    contentPlaceholder: '请详细描述您的问题或建议...',
    contactInfo: '联系方式（选填）',
    contactPlaceholder: '请留下您的邮箱或电话，以便我们回复',
    submit: '提交反馈',
    submitting: '提交中...',
    submitSuccess: '反馈提交成功，我们会尽快处理！',
    submitFailed: '反馈提交失败，请稍后重试',
    contentRequired: '请输入反馈内容'
  } : {
    title: 'Feedback',
    back: 'Back',
    feedbackType: 'Feedback Type',
    functionSuggestion: 'Feature Suggestion',
    bugReport: 'Bug Report',
    userExperience: 'User Experience',
    other: 'Other',
    feedbackContent: 'Feedback Content',
    contentPlaceholder: 'Please describe your issue or suggestion in detail...',
    contactInfo: 'Contact Information (Optional)',
    contactPlaceholder: 'Please leave your email or phone number for us to reply',
    submit: 'Submit Feedback',
    submitting: 'Submitting...',
    submitSuccess: 'Feedback submitted successfully, we will process it as soon as possible!',
    submitFailed: 'Failed to submit feedback, please try again later',
    contentRequired: 'Please enter feedback content'
  }

  // 状态管理
  const [feedbackType, setFeedbackType] = useState<string>('功能建议')
  const [feedbackContent, setFeedbackContent] = useState<string>('')
  const [contactInfo, setContactInfo] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // 反馈类型选项
  const feedbackTypes = [
    t.functionSuggestion,
    t.bugReport,
    t.userExperience,
    t.other
  ]

  // 提交反馈
  const handleSubmitFeedback = async () => {
    // 验证输入
    if (!feedbackContent.trim()) {
      Alert.alert(t.contentRequired)
      return
    }

    try {
      setSubmitting(true)

      // 准备反馈内容
      const feedbackMessage = `【反馈类型】: ${feedbackType}\n【反馈内容】: ${feedbackContent}\n${contactInfo ? `【联系方式】: ${contactInfo}\n` : ''}${userInfo ? `【用户信息】: ${userInfo.nickname || '用户'} (ID: ${userInfo.id})` : ''}`

      // 如果用户已登录，通过客服系统发送反馈
      if (userInfo?.id) {
        // 创建或获取聊天会话
        const { data: sessions, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('user_id', userInfo.id)
          .eq('status', 'active')
          .order('last_message_at', { ascending: false })
          .limit(1)

        let sessionId
        if (sessionError || !sessions || sessions.length === 0) {
          // 创建新会话
          const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: userInfo.id,
              status: 'active'
            })
            .select('id')
            .single()

          if (createError) {
            throw new Error('创建会话失败')
          }
          sessionId = newSession.id
        } else {
          sessionId = sessions[0].id
        }

        // 发送反馈消息
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_session_id: sessionId,
            sender_type: 'user',
            content: feedbackMessage,
            message_type: 'text'
          })

        if (messageError) {
          throw new Error('发送消息失败')
        }
      } else {
        // 未登录用户，使用默认方式处理（这里可以根据实际需求调整）
        console.log('未登录用户反馈:', feedbackMessage)
        // 这里可以添加其他处理方式，例如存储到本地或使用其他API
      }

      // 显示成功提示
      Alert.alert(t.submitSuccess, '', [
        {
          text: '确定',
          onPress: onClose
        }
      ])
    } catch (error) {
      console.error('提交反馈失败:', error)
      Alert.alert(t.submitFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>← {t.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 内容区域 */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 反馈类型选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.feedbackType}</Text>
          <View style={styles.typeContainer}>
            {feedbackTypes.map((type, index) => (
              <Pressable
                key={index}
                style={[
                  styles.typeButton,
                  feedbackType === type && styles.typeButtonActive
                ]}
                onPress={() => setFeedbackType(type)}
              >
                <Text style={[
                  styles.typeButtonText,
                  feedbackType === type && styles.typeButtonTextActive
                ]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 反馈内容输入 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.feedbackContent}</Text>
          <TextInput
            style={styles.contentInput}
            placeholder={t.contentPlaceholder}
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            maxLength={500}
            value={feedbackContent}
            onChangeText={setFeedbackContent}
          />
          <Text style={styles.charCount}>{feedbackContent.length}/500</Text>
        </View>

        {/* 联系方式输入 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.contactInfo}</Text>
          <TextInput
            style={styles.contactInput}
            placeholder={t.contactPlaceholder}
            placeholderTextColor="#999"
            value={contactInfo}
            onChangeText={setContactInfo}
          />
        </View>

        {/* 提交按钮 */}
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitFeedback}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{t.submit}</Text>
          )}
        </Pressable>

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4a90e2',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  contentInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  contactInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#333',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#4a90e2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
})
