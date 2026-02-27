import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity, TouchableWithoutFeedback, Modal, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import EmojiSelector from 'react-native-emoji-selector';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'service';
  timestamp: Date;
  messageType?: 'text' | 'voice' | 'image' | 'file';
  duration?: number;
  audioUri?: string;
  isPlaying?: boolean;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  isRead?: boolean;
}

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

export default function CustomerServiceScreen({ lang = 'zh', onClose, userInfo, consultationType, onNavigateToDepositService }: { lang?: 'zh' | 'en'; onClose: () => void; userInfo?: any; consultationType?: 'deposit' | 'normal'; onNavigateToDepositService?: () => void; }) {
  // 打印用户信息，用于调试
  useEffect(() => {
    console.log('CustomerServiceScreen - userInfo:', userInfo);
  }, [userInfo]);
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false); // 底部"+"菜单状态
  const [showTopMoreMenu, setShowTopMoreMenu] = useState(false); // 右上角"..."菜单状态
  // 新增状态：控制历史聊天显示和欢迎消息发送
  const [showHistory, setShowHistory] = useState(false);
  const [hasSentWelcomeMessage, setHasSentWelcomeMessage] = useState(false);
  
  // 音频录制状态
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  
  // 音频播放状态
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState<string | null>(null);
  
  // 图片相关状态
  const [imagePermission, setImagePermission] = useState<boolean | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // 语言翻译
  const t = lang === 'zh' ? {
    title: '客服服务',
    placeholder: '请输入您的问题...',
    send: '发送',
    serviceName: '客服专员',
    user: '我'
  } : {
    title: 'Customer Service',
    placeholder: 'Please enter your question...',
    send: 'Send',
    serviceName: 'Customer Service',
    user: 'Me'
  };

  // 请求音频和图片权限
  useEffect(() => {
    const requestPermissions = async () => {
      // 请求音频权限
      const audioPermissionResult = await Audio.requestPermissionsAsync();
      setAudioPermission(audioPermissionResult.status === 'granted');
      
      // 请求图片权限
      const imagePermissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setImagePermission(imagePermissionResult.status === 'granted');
    };

    requestPermissions();

    // 组件卸载时清理资源
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // 获取或创建聊天会话
  const getOrCreateChatSession = useCallback(async (preSelectedAgentId?: string) => {
    console.log('getOrCreateChatSession - 开始执行getOrCreateChatSession函数');
    console.log('getOrCreateChatSession - 传入的preSelectedAgentId:', preSelectedAgentId);
    try {
      if (!userInfo?.id) {
        console.error('getOrCreateChatSession - 用户ID缺失，无法获取或创建会话');
        return null;
      }

      console.log('getOrCreateChatSession - 用户ID:', userInfo.id);
      // 查找用户的活跃会话
      console.log('getOrCreateChatSession - 开始查找用户的活跃会话');
      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userInfo.id)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('getOrCreateChatSession - 获取会话失败:', sessionError);
        return null;
      }

      console.log('getOrCreateChatSession - 查找活跃会话结果:', sessions);
      if (sessions && sessions.length > 0) {
        console.log('getOrCreateChatSession - 找到活跃会话，会话ID:', sessions[0].id);
        return sessions[0].id;
      }

      // 获取客服信息（如果还没有的话）
      console.log('getOrCreateChatSession - 没有找到活跃会话，准备创建新会话');
      let agentId = preSelectedAgentId || serviceInfo?.id;
      console.log('getOrCreateChatSession - 当前agentId:', agentId, 'serviceInfo?.id:', serviceInfo?.id, 'consultationType:', consultationType);
      if (!agentId) {
        console.log('getOrCreateChatSession - 开始获取客服信息');
        
        // 根据咨询类型和用户角色选择客服
        if (consultationType === 'deposit') {
          // 入金咨询：直接选择入金咨询客服
          console.log('getOrCreateChatSession - 入金咨询，选择入金咨询客服');
          const { data: depositServiceData, error: depositServiceError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'waiter')
            .limit(1);
          
          if (depositServiceError) {
            console.error('getOrCreateChatSession - 获取入金咨询客服失败:', depositServiceError);
          } else if (depositServiceData && depositServiceData.length > 0) {
            agentId = depositServiceData[0].id;
            console.log('getOrCreateChatSession - 找到入金咨询客服，客服ID:', agentId);
          } else {
            console.error('getOrCreateChatSession - 没有找到入金咨询客服');
          }
        } else if (userInfo?.role === 'waiter' || userInfo?.role === 'cs') {
          // 服务员（客服）角色：直接进入自己的对话窗口
          console.log('getOrCreateChatSession - 服务员/客服角色，使用自己的ID');
          agentId = userInfo.id;
        } else {
          // 普通客户：使用第一个客服，不随机选择
          console.log('getOrCreateChatSession - 普通客户，使用第一个客服');
          const { data: serviceData, error: serviceError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'waiter')
            .limit(1);
          
          if (serviceError) {
            console.error('getOrCreateChatSession - 获取客服信息失败:', serviceError);
          } else if (serviceData && serviceData.length > 0) {
            agentId = serviceData[0].id;
            console.log('getOrCreateChatSession - 找到客服，客服ID:', agentId);
          } else {
            console.error('getOrCreateChatSession - 没有找到客服信息');
          }
        }
      }

      // 如果没有活跃会话，创建新会话（agent_id可选）
      console.log('getOrCreateChatSession - 开始创建新会话，agentId:', agentId);
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userInfo.id,
          agent_id: agentId, // 允许agent_id为null
          status: 'active'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('getOrCreateChatSession - 创建会话失败:', createError);
        return null;
      }

      console.log('getOrCreateChatSession - 新会话创建成功，会话ID:', newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('getOrCreateChatSession - 会话管理异常:', error);
      return null;
    }
  }, [userInfo, serviceInfo, consultationType]);

  // 保存消息到数据库
  const saveMessageToDatabase = useCallback(async (message: Message) => {
    try {
      if (!userInfo?.id) {
        console.error('用户信息缺失，无法保存消息');
        return;
      }

      // 获取或创建会话
      const sessionId = await getOrCreateChatSession();
      if (!sessionId) {
        console.error('无法获取或创建会话');
        return;
      }

      let senderId: string;
      if (message.sender === 'user') {
        senderId = userInfo.id;
      } else {
        // 确保客服信息已设置
        if (serviceInfo?.id && serviceInfo.id !== 'default-agent') {
          senderId = serviceInfo.id;
          console.log('saveMessageToDatabase - 使用现有serviceInfo.id:', senderId);
        } else {
          // 从会话中获取客服ID
          console.log('saveMessageToDatabase - 从会话中获取客服ID，sessionId:', sessionId);
          const { data: sessionData, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('agent_id')
            .eq('id', sessionId)
            .single();
          
          if (sessionError) {
            console.error('saveMessageToDatabase - 获取会话信息失败:', sessionError);
            // 使用默认客服ID
            senderId = 'default-agent';
            console.log('saveMessageToDatabase - 使用默认客服ID:', senderId);
          } else if (sessionData?.agent_id) {
            senderId = sessionData.agent_id;
            console.log('saveMessageToDatabase - 从会话获取到客服ID:', senderId);
            // 更新serviceInfo，确保后续使用
            if (senderId !== serviceInfo?.id) {
              // 获取客服详细信息
              const { data: agentData, error: agentError } = await supabase
                .from('users')
                .select('id, name')
                .eq('id', senderId)
                .single();
              
              if (!agentError && agentData) {
                console.log('saveMessageToDatabase - 更新serviceInfo:', agentData);
                setServiceInfo({
                  id: agentData.id,
                  name: agentData.name || '客服专员',
                  avatar: 'https://picsum.photos/200/200'
                });
              }
            }
          } else {
            // 使用默认客服ID
            senderId = 'default-agent';
            console.log('saveMessageToDatabase - 会话中无agent_id，使用默认客服ID:', senderId);
          }
        }
      }

      // 准备消息数据
      const messageData = {
        chat_session_id: sessionId,
        sender_id: senderId,
        sender_type: message.sender === 'user' ? 'user' : 'agent', // 使用与数据库一致的角色名：user和agent
        message_type: message.messageType || 'text',
        content: message.text,
        duration: message.duration
        // 数据库会自动生成id和created_at
      };

      // 保存到数据库
      console.log('saveMessageToDatabase - 准备保存消息:', messageData);
      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('保存消息失败:', error);
      } else {
        console.log('消息保存成功');
      }
    } catch (error) {
      console.error('保存消息异常:', error);
    }
  }, [userInfo, serviceInfo, getOrCreateChatSession]);

  // 从数据库读取历史消息
  const loadHistoryMessages = useCallback(async () => {
    console.log('loadHistoryMessages - 开始加载历史消息');
    try {
      if (!userInfo?.id) {
        console.error('loadHistoryMessages - 用户信息缺失，无法加载历史消息:', userInfo);
        return;
      }

      console.log('loadHistoryMessages - 用户ID:', userInfo.id);
      // 获取用户的活跃会话
      const sessionId = await getOrCreateChatSession();
      if (!sessionId) {
        console.error('loadHistoryMessages - 无法获取会话，无法加载历史消息');
        return;
      }

      console.log('loadHistoryMessages - 会话ID:', sessionId);
      // 从数据库读取消息
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('loadHistoryMessages - 获取历史消息失败:', messagesError);
        return;
      }

      console.log('loadHistoryMessages - 从数据库获取的消息:', messagesData);
      if (messagesData && messagesData.length > 0) {
        // 转换消息格式
        const historyMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender_type === 'user' ? 'user' : 'service', // 将数据库中的'agent'转换为代码中的'service'
          timestamp: new Date(msg.created_at),
          messageType: msg.message_type as 'text' | 'voice' | 'image' | 'file',
          duration: msg.duration,
          isRead: true
        }));

        console.log('loadHistoryMessages - 转换后的历史消息:', historyMessages);
        setMessages(historyMessages);
        console.log('loadHistoryMessages - 历史消息加载完成');
      } else {
        console.log('loadHistoryMessages - 没有找到历史消息');
      }
    } catch (error) {
      console.error('loadHistoryMessages - 加载历史消息异常:', error);
    }
  }, [userInfo, getOrCreateChatSession]);

  // 加载历史消息并处理问候语
  const fetchData = useCallback(async () => {
    console.log('fetchData - 开始执行fetchData函数');
    if (!userInfo?.id) {
      console.error('fetchData - 用户信息缺失，无法加载历史消息:', userInfo);
      setLoading(false);
      return;
    }

    console.log('fetchData - 用户ID:', userInfo.id);
    try {
      // 首先检查用户是否已经有了活跃的聊天会话
      console.log('fetchData - 检查用户是否已经有了活跃的聊天会话');
      const { data: activeSessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, agent_id')
        .eq('user_id', userInfo.id)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('fetchData - 获取活跃会话失败:', sessionError);
      } else if (activeSessions && activeSessions.length > 0) {
        console.log('fetchData - 找到活跃会话:', activeSessions[0]);
        // 使用已有的客服
        const session = activeSessions[0];
        
        // 如果找到了agent_id，获取客服详细信息
        if (session.agent_id) {
          const { data: agentData, error: agentError } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', session.agent_id)
            .single();
          
          if (agentError) {
            console.error('fetchData - 获取客服信息失败:', agentError);
          } else {
            setServiceInfo({
              id: agentData.id,
              name: agentData.name || '客服专员',
              avatar: 'https://picsum.photos/200/200'
            });
          }
        } else {
          // 如果没有agent_id，使用默认客服信息
          setServiceInfo({
            id: 'default-agent',
            name: '客服专员',
            avatar: 'https://picsum.photos/200/200'
          });
        }
        
        // 加载历史消息
        const sessionId = session.id;
        console.log('fetchData - 会话ID:', sessionId);
        
        // 如果显示历史聊天，则从数据库读取消息
        if (showHistory) {
          console.log('fetchData - 开始从数据库读取历史消息');
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_session_id', sessionId)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error('fetchData - 获取历史消息失败:', messagesError);
            setLoading(false);
            return;
          }

          console.log('fetchData - 从数据库获取的历史消息:', messagesData);
          if (messagesData && messagesData.length > 0) {
            // 转换消息格式
            const historyMessages: Message[] = messagesData.map(msg => ({
              id: msg.id,
              text: msg.content,
              sender: msg.sender_type === 'user' ? 'user' : 'service', // 将数据库中的'agent'转换为代码中的'service'
              timestamp: new Date(msg.created_at),
              messageType: msg.message_type as 'text' | 'voice' | 'image' | 'file',
              duration: msg.duration,
              isRead: true
            }));

            console.log('fetchData - 转换后的历史消息:', historyMessages);
            setMessages(historyMessages);
            console.log('fetchData - 历史消息加载完成');
          } else {
            console.log('fetchData - 没有找到历史消息');
            setMessages([]);
          }
        }
      } else {
        // 没有活跃会话，需要分配新的客服
        console.log('fetchData - 没有找到活跃会话，准备分配新的客服');
        // 获取客服信息
      console.log('fetchData - 开始获取客服信息');
      const { data: serviceData, error: serviceError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'waiter');

        if (serviceError) {
          console.error('fetchData - 获取客服信息失败:', serviceError);
          setLoading(false);
          return;
        }

        console.log('fetchData - 客服信息获取成功，共找到', serviceData?.length, '名服务员:', serviceData);
        if (serviceData && serviceData.length > 0) {
          // 从服务员列表中随机选择一名
          const randomIndex = Math.floor(Math.random() * serviceData.length);
          const service = serviceData[randomIndex];
          setServiceInfo({
            id: service.id,
            name: service.name || '客服专员',
            avatar: 'https://picsum.photos/200/200'
          });

          // 加载历史消息
          console.log('fetchData - 开始获取或创建会话');
          const sessionId = await getOrCreateChatSession(service.id);
          if (!sessionId) {
            console.error('fetchData - 无法获取会话，无法加载历史消息');
            setLoading(false);
            return;
          }

          console.log('fetchData - 会话ID:', sessionId);
          
          // 如果显示历史聊天，则从数据库读取消息
          if (showHistory) {
            console.log('fetchData - 开始从数据库读取历史消息');
            const { data: messagesData, error: messagesError } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_session_id', sessionId)
              .order('created_at', { ascending: true });

            if (messagesError) {
              console.error('fetchData - 获取历史消息失败:', messagesError);
              setLoading(false);
              return;
            }

            console.log('fetchData - 从数据库获取的历史消息:', messagesData);
            if (messagesData && messagesData.length > 0) {
              // 转换消息格式
              const historyMessages: Message[] = messagesData.map(msg => ({
                id: msg.id,
                text: msg.content,
                sender: msg.sender_type === 'user' ? 'user' : 'service', // 将数据库中的'agent'转换为代码中的'service'
                timestamp: new Date(msg.created_at),
                messageType: msg.message_type as 'text' | 'voice' | 'image' | 'file',
                duration: msg.duration,
                isRead: true
              }));

              console.log('fetchData - 转换后的历史消息:', historyMessages);
              setMessages(historyMessages);
              console.log('fetchData - 历史消息加载完成');
            } else {
              console.log('fetchData - 没有找到历史消息');
              setMessages([]);
            }
          }
        } else {
          console.error('fetchData - 没有找到客服信息，使用默认客服');
          // 如果没有找到客服，使用默认客服信息
          const defaultService = {
            id: 'default-agent',
            name: '客服专员',
            avatar: 'https://picsum.photos/200/200'
          };
          setServiceInfo(defaultService);
          
          // 加载历史消息
          console.log('fetchData - 开始获取或创建会话');
          const sessionId = await getOrCreateChatSession();
          if (!sessionId) {
            console.error('fetchData - 无法获取会话，无法加载历史消息');
            setLoading(false);
            return;
          }

          console.log('fetchData - 会话ID:', sessionId);
          
          // 如果显示历史聊天，则从数据库读取消息
          if (showHistory) {
            console.log('fetchData - 开始从数据库读取历史消息');
            const { data: messagesData, error: messagesError } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_session_id', sessionId)
              .order('created_at', { ascending: true });

            if (messagesError) {
              console.error('fetchData - 获取历史消息失败:', messagesError);
              setLoading(false);
              return;
            }

            console.log('fetchData - 从数据库获取的消息:', messagesData);
            if (messagesData && messagesData.length > 0) {
              // 转换消息格式
              const historyMessages: Message[] = messagesData.map(msg => ({
                id: msg.id,
                text: msg.content,
                sender: msg.sender_type === 'user' ? 'user' : 'service', // 将数据库中的'agent'转换为代码中的'service'
                timestamp: new Date(msg.created_at),
                messageType: msg.message_type as 'text' | 'voice' | 'image' | 'file',
                duration: msg.duration,
                isRead: true
              }));

              console.log('fetchData - 转换后的历史消息:', historyMessages);
              setMessages(historyMessages);
              console.log('fetchData - 历史消息加载完成');
            } else {
              console.log('fetchData - 没有找到历史消息');
              setMessages([]);
            }
          }
        }
      }

      // 如果不显示历史聊天且没有发送过欢迎消息，则发送欢迎消息
      if (!showHistory && !hasSentWelcomeMessage) {
        console.log('fetchData - 不显示历史聊天且未发送欢迎消息，发送欢迎消息');
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: '欢迎进入客服服务，请问有什么需要帮助的吗？',
          sender: 'service',
          timestamp: new Date(),
          messageType: 'text',
          isRead: true
        };
        setMessages([welcomeMessage]);
        // 保存欢迎消息到数据库
        saveMessageToDatabase(welcomeMessage);
        // 标记已发送欢迎消息
        setHasSentWelcomeMessage(true);
      }
    } catch (error) {
      console.error('fetchData - 加载数据异常:', error);
      setLoading(false);
    } finally {
      setLoading(false);
      console.log('fetchData - 执行完毕');
    }
  }, [userInfo, showHistory, hasSentWelcomeMessage, getOrCreateChatSession, saveMessageToDatabase]);

  // 使用fetchData函数
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自动滚动到底部 - 优化版
  // 只在新消息到来时自动滚动到底部，不影响用户手动滚动
  const [userScrolled, setUserScrolled] = useState(false);
  const previousMessageCountRef = useRef(0);

  // 监听滚动事件，判断用户是否手动滚动
  const handleScroll = (event: any) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    // 如果用户滚动位置距离底部超过50像素，认为用户在手动查看历史消息
    const isNearBottom = contentHeight - contentOffsetY - layoutHeight < 50;
    setUserScrolled(!isNearBottom);
  };

  // 自动滚动到底部
  useEffect(() => {
    // 如果用户没有手动滚动，或者消息数量增加了（新消息），则自动滚动到底部
    if (!userScrolled || messages.length > previousMessageCountRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
    // 更新消息数量引用
    previousMessageCountRef.current = messages.length;
  }, [messages, userScrolled]);

  // 开始录制语音
  const startRecording = async () => {
    if (audioPermission !== true) {
      console.log('音频权限未获取');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('录制失败:', err);
    }
  };

  // 停止录制语音
  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const duration = Math.round(status.durationMillis / 1000);

      // 创建语音消息
      const voiceMessage: Message = {
        id: Date.now().toString(),
        text: '[语音消息]',
        sender: 'user',
        timestamp: new Date(),
        messageType: 'voice',
        duration,
        audioUri: uri || '',
        isPlaying: false,
        isRead: true
      };

      setMessages(prev => [...prev, voiceMessage]);
      setRecording(null);

      // 保存消息到数据库
      saveMessageToDatabase(voiceMessage);
    } catch (err) {
      console.error('停止录制失败:', err);
    }
  };

  // 播放语音消息
  const playVoiceMessage = async (message: Message) => {
    if (!message.audioUri) return;

    // 如果正在播放其他消息，先停止
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: message.audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);
      setCurrentPlayingMessageId(message.id);

      // 更新消息的播放状态
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isPlaying: true } : msg
      ));

      // 播放结束后清理
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentPlayingMessageId(null);
          setMessages(prev => prev.map(msg => 
            msg.id === message.id ? { ...msg, isPlaying: false } : msg
          ));
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (err) {
      console.error('播放语音失败:', err);
    }
  };

  // 停止播放语音消息
  const stopVoiceMessage = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setCurrentPlayingMessageId(null);
      // 重置所有消息的播放状态
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })));
    }
  };

  // 从相册选择图片
  const pickImage = async () => {
    if (imagePermission !== true) {
      console.log('图片权限未获取');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        // 上传图片并创建消息
        await handleImageMessage(uri);
      }
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  };

  // 拍照
  const takePhoto = async () => {
    if (imagePermission !== true) {
      console.log('图片权限未获取');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        // 上传图片并创建消息
        await handleImageMessage(uri);
      }
    } catch (err) {
      console.error('拍照失败:', err);
    }
  };

  // 上传图片到Supabase Storage
  const uploadImage = async (uri: string) => {
    try {
      // 生成唯一文件名
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`;
      const filePath = `chat-images/${fileName}`;
      
      // 读取文件内容
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });
      
      if (error) {
        console.error('上传图片失败:', error);
        return null;
      }
      
      // 获取可访问的URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (err) {
      console.error('上传图片异常:', err);
      return null;
    }
  };

  // 处理图片消息
  const handleImageMessage = async (uri: string) => {
    // 先显示本地图片消息
    const tempMessage: Message = {
      id: Date.now().toString(),
      text: '[图片消息]',
      sender: 'user',
      timestamp: new Date(),
      messageType: 'image',
      audioUri: uri,
      isRead: true
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // 上传图片到服务器
    const imageUrl = await uploadImage(uri);
    
    if (imageUrl) {
      // 更新消息为已上传状态
      const updatedMessage = {
        ...tempMessage,
        audioUri: imageUrl // 使用audioUri字段存储图片URL
      };
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? updatedMessage : msg
      ));
      // 保存图片消息到数据库
      saveMessageToDatabase(updatedMessage);
    } else {
      // 保存本地图片消息到数据库
      saveMessageToDatabase(tempMessage);
    }
  };

  // 打开图片预览
  const openImagePreview = (message: Message) => {
    if (message.audioUri) {
      setPreviewImage(message.audioUri);
      setShowPreview(true);
    }
  };

  // 选择文件
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // 上传文件并创建消息
        await handleFileMessage(asset);
      }
    } catch (err) {
      console.error('选择文件失败:', err);
    }
  };

  // 上传文件到Supabase Storage
  const uploadFile = async (uri: string, fileName: string, mimeType: string) => {
    try {
      // 生成唯一文件名
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${fileName}`;
      const filePath = `chat-files/${uniqueFileName}`;
      
      // 读取文件内容
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: mimeType,
        });
      
      if (error) {
        console.error('上传文件失败:', error);
        return null;
      }
      
      // 获取可访问的URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (err) {
      console.error('上传文件异常:', err);
      return null;
    }
  };

  // 处理文件消息
  const handleFileMessage = async (asset: DocumentPicker.DocumentPickerAsset) => {
    // 先显示本地文件消息
    const tempMessage: Message = {
      id: Date.now().toString(),
      text: '[文件消息]',
      sender: 'user',
      timestamp: new Date(),
      messageType: 'file',
      fileName: asset.name,
      fileSize: asset.size,
      fileType: asset.mimeType,
      fileUrl: asset.uri,
      isRead: true
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // 上传文件到服务器
    const fileUrl = await uploadFile(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
    
    if (fileUrl) {
      // 更新消息为已上传状态
      const updatedMessage = {
        ...tempMessage,
        fileUrl: fileUrl
      };
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? updatedMessage : msg
      ));
      // 保存文件消息到数据库
      saveMessageToDatabase(updatedMessage);
    } else {
      // 保存本地文件消息到数据库
      saveMessageToDatabase(tempMessage);
    }
  };

  // 下载文件
  const downloadFile = async (message: Message) => {
    if (!message.fileUrl) return;
    
    try {
      // 在实际应用中，这里应该实现文件下载逻辑
      // 由于React Native的限制，直接下载文件需要使用第三方库或原生代码
      Alert.alert(
        '文件下载',
        `文件名: ${message.fileName}\n文件大小: ${formatFileSize(message.fileSize || 0)}\n文件类型: ${message.fileType}`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '确定', 
            onPress: () => {
              console.log('开始下载文件:', message.fileUrl);
              // 这里可以添加实际的下载逻辑
              Alert.alert('提示', '文件下载功能将在后续版本中实现');
            }
          }
        ]
      );
    } catch (err) {
      console.error('下载文件失败:', err);
      Alert.alert('错误', '文件下载失败，请稍后重试');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };



  // 处理发送消息
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
      messageType: 'text',
      isRead: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // 保存消息到数据库
    saveMessageToDatabase(userMessage);
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };
  
  // 切换历史聊天显示/隐藏
  const toggleHistory = async () => {
    console.log('toggleHistory - 当前showHistory状态:', showHistory);
    // 切换showHistory状态
    setShowHistory(prev => !prev);
    // 重新加载数据，根据新的showHistory状态获取消息
    await fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{lang === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1A4EA2" />
      
      {/* 顶部导航栏 */}
      <LinearGradient
        colors={['#1A4EA2', '#0D3A8A']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{serviceInfo?.name || t.serviceName}</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubtitle}>在线</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowTopMoreMenu(!showTopMoreMenu)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* 右上角更多菜单 */}
      {showTopMoreMenu && (
        <View style={styles.topMoreMenuWrapper}>
          <View style={styles.topMoreMenuContainer}>
            <TouchableOpacity 
              style={styles.topMoreMenuItem}
              onPress={() => {
                toggleHistory();
                setShowTopMoreMenu(false);
              }}
            >
              <Text style={styles.topMoreMenuItemText}>历史对话</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.topMoreMenuItem}
              onPress={() => {
                if (onNavigateToDepositService) {
                  onNavigateToDepositService();
                }
                setShowTopMoreMenu(false);
              }}
            >
              <Text style={styles.topMoreMenuItemText}>入金指导</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 聊天内容区域 */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer} 
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        onScroll={handleScroll}
        scrollEventThrottle={16} // 约60fps
      >
        {/* 消息列表 */}
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageRow, 
              message.sender === 'user' ? styles.userMessageRow : styles.serviceMessageRow
            ]}
          >
            {message.sender === 'service' && (
              <Image 
                style={styles.avatar} 
                source={{ uri: serviceInfo?.avatar || 'https://picsum.photos/200/200' }}
              />
            )}
            
            {/* 文本消息 */}
            {message.messageType === 'text' && (
              <View style={[styles.messageContentWrapper, message.sender === 'user' ? styles.userMessageContentWrapper : styles.serviceMessageContentWrapper]}>
                <View 
                  style={[
                    styles.messageBubble, 
                    message.sender === 'user' ? styles.userMessageBubble : styles.serviceMessageBubble
                  ]}
                >
                  <Text style={[
                    styles.messageText, 
                    message.sender === 'user' ? styles.userMessageText : styles.serviceMessageText
                  ]}>
                    {message.text}
                  </Text>
                </View>
                <View style={[
                  styles.messageTimeContainer, 
                  message.sender === 'user' ? styles.userMessageTimeContainer : styles.serviceMessageTimeContainer
                ]}>
                  <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                  {message.sender === 'user' && message.isRead && (
                    <Text style={styles.readIndicator}>已读</Text>
                  )}
                </View>
              </View>
            )}
            
            {/* 语音消息 */}
            {message.messageType === 'voice' && (
              <View style={[styles.messageContentWrapper, message.sender === 'user' ? styles.userMessageContentWrapper : styles.serviceMessageContentWrapper]}>
                <TouchableOpacity
                  style={[
                    styles.voiceMessageBubble, 
                    message.sender === 'user' ? styles.userVoiceMessageBubble : styles.serviceVoiceMessageBubble
                  ]}
                  onPress={() => playVoiceMessage(message)}
                >
                  <View style={styles.voiceMessageContent}>
                    <View style={styles.voiceIconContainer}>
                      <Text style={[styles.voiceIcon, message.sender === 'user' && styles.userVoiceIcon]}>
                        {message.isPlaying ? '⏸️' : '▶️'}
                      </Text>
                    </View>
                    <View style={styles.voiceWaveform}>
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((i, index) => (
                        <View 
                          key={index} 
                          style={[
                            styles.waveformBar, 
                            {
                              height: message.isPlaying ? (8 + Math.random() * 20) : (8 + i * 2),
                              backgroundColor: message.isPlaying ? 
                                (message.sender === 'user' ? '#ffffff' : '#1aad19') : 
                                (message.sender === 'user' ? '#ffffff' : '#999'),
                              width: 3,
                              marginHorizontal: 1
                            }
                          ]} 
                        />
                      ))}
                    </View>
                    <Text style={[styles.voiceDuration, message.sender === 'user' && styles.userVoiceDuration]}>
                      {message.duration}″
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={[
                  styles.messageTimeContainer, 
                  message.sender === 'user' ? styles.userMessageTimeContainer : styles.serviceMessageTimeContainer
                ]}>
                  <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                  {message.sender === 'user' && message.isRead && (
                    <Text style={styles.readIndicator}>已读</Text>
                  )}
                </View>
              </View>
            )}
            
            {/* 图片消息 */}
            {message.messageType === 'image' && (
              <View style={[styles.messageContentWrapper, message.sender === 'user' ? styles.userMessageContentWrapper : styles.serviceMessageContentWrapper]}>
                <TouchableOpacity
                  style={[
                    styles.imageMessageBubble, 
                    message.sender === 'user' ? styles.userImageMessageBubble : styles.serviceImageMessageBubble
                  ]}
                  onPress={() => openImagePreview(message)}
                >
                  <Image 
                    source={{ uri: message.audioUri }} 
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <View style={[
                  styles.messageTimeContainer, 
                  message.sender === 'user' ? styles.userMessageTimeContainer : styles.serviceMessageTimeContainer
                ]}>
                  <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                  {message.sender === 'user' && message.isRead && (
                    <Text style={styles.readIndicator}>已读</Text>
                  )}
                </View>
              </View>
            )}
            
            {/* 文件消息 */}
            {message.messageType === 'file' && (
              <View style={[styles.messageContentWrapper, message.sender === 'user' ? styles.userMessageContentWrapper : styles.serviceMessageContentWrapper]}>
                <TouchableOpacity
                  style={[
                    styles.fileMessageBubble, 
                    message.sender === 'user' ? styles.userFileMessageBubble : styles.serviceFileMessageBubble
                  ]}
                  onPress={() => downloadFile(message)}
                >
                  <View style={styles.fileMessageContent}>
                    <Text style={styles.fileIcon}>📎</Text>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>{message.fileName}</Text>
                      <Text style={styles.fileSize}>{formatFileSize(message.fileSize || 0)}</Text>
                    </View>
                    <Text style={styles.downloadIcon}>↓</Text>
                  </View>
                </TouchableOpacity>
                <View style={[
                  styles.messageTimeContainer, 
                  message.sender === 'user' ? styles.userMessageTimeContainer : styles.serviceMessageTimeContainer
                ]}>
                  <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                  {message.sender === 'user' && message.isRead && (
                    <Text style={styles.readIndicator}>已读</Text>
                  )}
                </View>
              </View>
            )}
            
            {message.sender === 'user' && (
              <Image 
                style={styles.avatar} 
                source={{ uri: userInfo?.avatar || 'https://picsum.photos/200/200' }}
              />
            )}
          </View>
        ))}

        {/* 正在输入指示器 */}
        {isTyping && (
          <View style={styles.serviceMessageRow}>
            <Image 
              style={styles.avatar} 
              source={{ uri: serviceInfo?.avatar || 'https://picsum.photos/200/200' }}
            />
            <View style={styles.serviceMessageBubble}>
              <Text style={styles.serviceMessageText}>正在输入...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 表情选择器 */}
      {showEmojiSelector && (
        <View style={styles.emojiSelectorContainer}>
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              setInputText(prevText => prevText + emoji);
            }}
            theme="light"
            showTabs={true}
            showSearchBar={true}
            searchPlaceholder="搜索表情"
          />
        </View>
      )}

      {/* 图片预览模态框 */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewContainer}>
          <TouchableWithoutFeedback onPress={() => setShowPreview(false)}>
            <View style={styles.previewOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.previewContent}>
            {previewImage && (
              <Image 
                source={{ uri: previewImage }} 
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity 
              style={styles.closePreviewButton}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.closePreviewButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        {/* 左侧语音切换按钮 */}
        <TouchableWithoutFeedback
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <View style={styles.voiceToggleButton}>
            <Text style={styles.voiceToggleButtonText}>🎤</Text>
          </View>
        </TouchableWithoutFeedback>
        
        {/* 中间文本输入框 */}
        <TextInput
          style={styles.textInput}
          placeholder={t.placeholder}
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        
        {/* 右侧功能按钮 */}
        <View style={styles.inputButtonsRight}>
          {/* 表情按钮 */}
          <TouchableOpacity 
            style={styles.inputButton} 
            onPress={() => setShowEmojiSelector(!showEmojiSelector)}
          >
            <Text style={styles.inputButtonText}>😊</Text>
          </TouchableOpacity>
          
          {/* 发送按钮 - 只有在有文本输入时显示 */}
          {inputText.trim() !== '' ? (
            <Pressable 
              style={styles.sendButton} 
              onPress={handleSendMessage}
            >
              <Text style={styles.sendButtonText}>{t.send}</Text>
            </Pressable>
          ) : (
            /* 加号按钮 - 用于显示更多功能 */
            <TouchableOpacity 
              style={styles.inputButton} 
              onPress={() => setShowMoreMenu(true)}
            >
              <Text style={styles.inputButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* 底部更多功能菜单 */}
      {showMoreMenu && (
        <Modal
          visible={showMoreMenu}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMoreMenu(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowMoreMenu(false)}>
            <View style={styles.moreMenuOverlay}>
              <View style={styles.moreMenuContainer}>
                <View style={styles.moreMenuRow}>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => {
                      pickImage();
                      setShowMoreMenu(false);
                    }}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>🖼️</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>照片</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => {
                      takePhoto();
                      setShowMoreMenu(false);
                    }}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>📷</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>拍摄</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => setShowMoreMenu(false)}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>📍</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>位置</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => setShowMoreMenu(false)}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>🎤</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>语音输入</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.moreMenuRow}>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => setShowMoreMenu(false)}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>⭐</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>收藏</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => setShowMoreMenu(false)}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>👤</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>个人名片</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => {
                      pickDocument();
                      setShowMoreMenu(false);
                    }}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>📎</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>文件</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.moreMenuItem} 
                    onPress={() => setShowMoreMenu(false)}
                  >
                    <View style={styles.moreMenuItemIconContainer}>
                      <Text style={styles.moreMenuItemIcon}>🎵</Text>
                    </View>
                    <Text style={styles.moreMenuItemText}>音乐</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  // 交流历史按钮样式
  historyButtonText: {
    fontSize: 12,
    color: '#0066cc',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  serviceMessageRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginHorizontal: 12,
    borderWidth: 0.5,
    borderColor: '#d1d1d1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  // 右上角更多菜单样式
  topMoreMenuWrapper: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginTop: 8,
    zIndex: 1000,
  },
  topMoreMenuContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topMoreMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  topMoreMenuItemText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '400',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  emojiSelectorContainer: {
    height: 250,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  emojiButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonText: {
    fontSize: 20,
  },
  messageContentWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '70%',
  },
  userMessageContentWrapper: {
    alignItems: 'flex-end',
  },
  serviceMessageContentWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '100%',
    padding: 12,
  },
  // 语音消息样式
  voiceMessageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    padding: 12,
  },
  userVoiceMessageBubble: {
    backgroundColor: '#dcf8c6',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  serviceVoiceMessageBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  voiceMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceIconContainer: {
    marginRight: 10,
  },
  voiceIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  userVoiceIcon: {
    color: '#ffffff',
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 80,
    marginRight: 12,
  },
  waveformBar: {
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 12,
    color: '#999',
  },
  userVoiceDuration: {
    color: '#ffffff',
  },
  // 语音录制按钮样式
  voiceRecordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1aad19',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceRecordButtonText: {
    fontSize: 20,
  },
  // 图片消息样式
  imageMessageBubble: {
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '100%',
    padding: 4,
  },
  userImageMessageBubble: {
    backgroundColor: '#dcf8c6',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  serviceImageMessageBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
  },
  // 图片预览样式
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewContent: {
    position: 'relative',
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  closePreviewButton: {
    position: 'absolute',
    top: -30,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreviewButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  // 输入区域按钮样式
  inputButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  inputButtonText: {
    fontSize: 20,
    color: '#000000',
  },
  imagePickerContainer: {
    position: 'relative',
  },
  imagePickerMenu: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 120,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333333',
  },
  // 文件消息样式
  fileMessageBubble: {
    maxWidth: '100%',
    padding: 12,
  },
  userFileMessageBubble: {
    backgroundColor: '#dcf8c6',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  serviceFileMessageBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  fileMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#999999',
  },
  downloadIcon: {
    fontSize: 16,
    color: '#1aad19',
    marginLeft: 12,
  },
  userMessageBubble: {
    backgroundColor: '#dcf8c6',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  serviceMessageBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 4,
    textAlign: 'left',
  },
  userMessageText: {
    color: '#000000',
  },
  serviceMessageText: {
    color: '#333333',
  },
  messageTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    marginHorizontal: 0,
  },
  userMessageTimeContainer: {
    justifyContent: 'flex-end',
  },
  serviceMessageTimeContainer: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    color: '#999999',
    marginRight: 4,
  },
  readIndicator: {
    fontSize: 11,
    color: '#1aad19',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#d1d1d1',
  },
  inputButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceToggleButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceToggleButtonText: {
    fontSize: 20,
    color: '#000000',
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
    textAlignVertical: 'center',
    textAlign: 'left',
    borderWidth: 1,
    borderColor: '#d1d1d1',
  },
  sendButton: {
    backgroundColor: '#1aad19',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  moreMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  moreMenuContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  moreMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  moreMenuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  moreMenuItemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moreMenuItemIcon: {
    fontSize: 30,
    color: '#333333',
  },
  moreMenuItemText: {
    fontSize: 14,
    color: '#333333',
  },
});
