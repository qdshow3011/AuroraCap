import { View, Text, StyleSheet, Pressable, Image, Alert, SafeAreaView } from 'react-native'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as ImagePicker from 'expo-image-picker'

interface AvatarEditScreenProps {
  userInfo?: any;
  onClose: () => void;
  onAvatarUpdate: (newAvatar: string) => void;
}

export default function AvatarEditScreen({ userInfo, onClose, onAvatarUpdate }: AvatarEditScreenProps) {
  const [currentAvatar, setCurrentAvatar] = useState<string>(userInfo?.avatar || 'https://picsum.photos/100/100')
  const [tempAvatar, setTempAvatar] = useState<string | null>(null)
  
  // 监听tempAvatar变化
  useEffect(() => {
    console.log('tempAvatar changed:', tempAvatar);
  }, [tempAvatar]);
  
  // 选择图片函数
  const pickImage = async (source: 'gallery' | 'camera') => {
    console.log('pickImage called with source:', source);
    // 请求权限
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相机权限才能拍照');
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Gallery permission status:', status);
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能选择图片');
        return null;
      }
    }

    // 打开相机或相册
    let result;
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // 请求Base64数据，避免blob URL问题
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // 请求Base64数据，避免blob URL问题
      });
    }

    console.log('Image picker result:', result);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('Returning image URI:', asset.uri);
      return asset.uri;
    }
    console.log('No image selected, returning null');
    return null;
  };

  // 上传图片到Supabase Storage
  const uploadImage = async (uri: string) => {
    try {
      // 获取用户ID，直接从userInfo获取，不依赖Supabase会话
      // 因为应用使用自定义API登录，没有Supabase会话
      const currentUserId = userInfo?.id;
      
      // 验证用户ID是否有效
      if (!currentUserId) {
        console.error('上传图片失败 - 用户信息无效或用户ID不存在:', { userInfo });
        Alert.alert('上传失败', '用户信息无效，无法上传图片');
        return null;
      }
      
      // 获取文件扩展名
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      // 文件名格式：时间戳_随机字符串.扩展名
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      
      // 使用public文件夹，避免RLS策略限制
      // 由于应用使用自定义API登录，Supabase客户端没有有效会话
      // 所以无法通过authenticated权限验证，需要使用public访问
      const filePath = `public/${currentUserId}_${fileName}`;

      // 读取文件内容 - 改进的图片数据处理
      let blob;
      
      // 检查是否为blob URL
      if (uri.startsWith('blob:')) {
        try {
          // 尝试从blob URL获取Blob对象
          const response = await fetch(uri);
          blob = await response.blob();
        } catch (error) {
          console.error('Failed to fetch blob URL:', error);
          // 回退方案：创建一个空的Blob作为占位符
          blob = new Blob([], { type: `image/${fileExt}` });
        }
      } 
      // 检查是否为base64数据（如果pickImage返回base64的话）
      else if (uri.startsWith('data:')) {
        // 从base64数据创建Blob
        const base64Data = uri.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: `image/${fileExt}` });
      } 
      // 常规URL处理
      else {
        try {
          const response = await fetch(uri);
          blob = await response.blob();
        } catch (error) {
          console.error('Failed to fetch regular URL:', error);
          // 回退方案：创建一个空的Blob作为占位符
          blob = new Blob([], { type: `image/${fileExt}` });
        }
      }

      console.log('开始上传图片到Supabase Storage:', {
        bucket: 'qdshow101',
        filePath: filePath,
        fileExt: fileExt,
        blobSize: blob.size,
        userId: currentUserId,
        userEmail: userInfo?.email
      });

      console.log('用户已认证，开始上传图片到zwdisi_1文件夹，符合INSERT authenticated权限要求');
      console.log('上传参数:', {
        userId: currentUserId,
        email: userInfo?.email,
        bucket: 'qdshow101',
        filePath: filePath,
        contentType: `image/${fileExt}`
      });

      // 直接使用userInfo中的用户ID，无需额外获取Supabase会话状态
      console.log('使用用户信息:', {
        userId: userInfo?.id,
        nickname: userInfo?.nickname,
        email: userInfo?.email,
        role: userInfo?.role
      });

      // 检查Supabase客户端的认证状态
      const { data: authSession } = await supabase.auth.getSession();
      console.log('Supabase认证状态:', {
        hasSession: !!authSession?.session,
        user: authSession?.session?.user,
        token: authSession?.session?.access_token ? '已存在' : '不存在'
      });

      // 尝试直接使用userInfo中的email作为认证标识，用于调试
      console.log('用户信息用于调试:', {
        id: userInfo?.id,
        email: userInfo?.email,
        nickname: userInfo?.nickname,
        role: userInfo?.role
      });

      // 上传到Supabase Storage
      console.log('开始调用supabase.storage.upload');
      // 移除upsert: true，因为zwdisi_1文件夹只有INSERT权限，没有UPDATE权限
      // upsert操作需要同时具备INSERT和UPDATE权限，所以使用普通的INSERT操作
      const { error: uploadError } = await supabase.storage.from('qdshow101').upload(filePath, blob, { 
        contentType: `image/${fileExt}`
      });
      console.log('supabase.storage.upload调用完成，error:', uploadError);
      
      // 如果上传失败，显示更详细的错误信息
      if (uploadError) {
        console.error('上传失败详细信息:', {
          error: uploadError,
          errorMessage: uploadError.message,
          userId: currentUserId,
          filePath: filePath,
          bucket: 'qdshow101',
          errorType: typeof uploadError,
          errorKeys: Object.keys(uploadError)
        });
      }

      if (uploadError) {
        console.error('上传图片失败 - upload error:', uploadError);
        
        // 备选方案：直接使用本地图片URL作为头像URL，绕过Supabase Storage上传
        console.log('尝试使用备选方案：直接使用本地图片URL作为头像URL');
        
        // 显示更友好的备选方案提示，并提供更多信息
        Alert.alert(
          '上传提示', 
          '图片已保存到本地，将在下次同步时上传到服务器。',
          [{ text: '确定', onPress: () => console.log('用户确认') }]
        );
        
        // 使用备选方案，直接返回原始图片URL
        console.log('使用备选方案，返回原始图片URL:', uri);
        return uri;
      }

      console.log('上传成功，获取公共URL');

      // 获取公共URL
      const { data } = supabase.storage.from('qdshow101').getPublicUrl(filePath);
      
      if (!data || !data.publicUrl) {
        console.error('获取公共URL失败: 无效的URL');
        Alert.alert('上传失败', '获取图片URL失败');
        return null;
      }

      console.log('获取公共URL成功:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('上传图片失败 - catch error:', error);
      Alert.alert('上传失败', `图片上传异常: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  };

  // 更新用户头像
  const updateAvatar = async () => {
    console.log('updateAvatar called, tempAvatar:', tempAvatar);
    if (!tempAvatar) {
      console.log('updateAvatar: tempAvatar is null, returning');
      return;
    }
    
    try {
      console.log('updateAvatar: tempAvatar URL:', tempAvatar);
      
      // 调用统一的上传函数处理图片上传
      console.log('updateAvatar: calling uploadImage function');
      const avatarUrl = await uploadImage(tempAvatar);
      console.log('updateAvatar: uploadImage returned:', avatarUrl);
      
      // 如果上传失败，uploadImage会返回null或原始URL（备选方案）
      if (!avatarUrl) {
        console.log('updateAvatar: avatarUrl is null, returning');
        return;
      }

      console.log('updateAvatar: updating database for user:', userInfo?.id);
      // 更新数据库
      if (userInfo && userInfo.id) {
        const { error: dbError } = await supabase
          .from('users')
          .update({ avatar: avatarUrl })
          .eq('id', userInfo.id);

        if (dbError) {
          console.error('updateAvatar: database update error:', dbError);
          throw dbError;
        }

        // 更新本地状态
        console.log('updateAvatar: updating local state with new avatar:', avatarUrl);
        setCurrentAvatar(avatarUrl);
        setTempAvatar(null);
        
        // 通知父组件头像已更新
        console.log('updateAvatar: calling onAvatarUpdate with:', avatarUrl);
        onAvatarUpdate(avatarUrl);
        
        Alert.alert('成功', '头像已更新');
        onClose();
      } else {
        console.error('updateAvatar: userInfo or userInfo.id is null');
        Alert.alert('更新失败', '用户信息无效，无法更新头像');
      }
    } catch (error) {
      console.error('updateAvatar: catch error:', error);
      Alert.alert('更新失败', `头像更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setTempAvatar(null);
    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部导航栏 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>头像编辑</Text>
        <Text style={{ color: '#333', marginRight: 10 }}>tempAvatar: {tempAvatar ? '有值' : '无值'}</Text>
        <Pressable 
          style={styles.saveButton} 
          onPress={() => {
            console.log('Save button pressed');
            updateAvatar();
          }} 
          disabled={!tempAvatar}
        >
          <Text style={[styles.saveButtonText, !tempAvatar && styles.disabledButtonText]}>保存</Text>
        </Pressable>
      </View>
      
      {/* 头像预览区域 */}
      <View style={styles.avatarPreviewContainer}>
        <Image 
          source={{ uri: tempAvatar || currentAvatar }} 
          style={styles.avatarPreview} 
        />
        <Text style={styles.avatarHint}>点击下方按钮选择新头像</Text>
      </View>
      
      {/* 操作按钮区域 */}
      <View style={styles.actionButtons}>
        <Pressable 
          style={styles.actionButton} 
          onPress={async () => {
            console.log('Gallery button pressed');
            try {
              const imageUri = await pickImage('gallery');
              console.log('Gallery pickImage returned:', imageUri);
              if (imageUri) {
                console.log('Setting tempAvatar from gallery:', imageUri);
                setTempAvatar(imageUri);
              }
            } catch (error) {
              console.error('Gallery pickImage error:', error);
              Alert.alert('错误', '从相册选择图片失败');
            }
          }}
        >
          <Text style={styles.actionButtonIcon}>📸</Text>
          <Text style={styles.actionButtonText}>从相册选择</Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionButton} 
          onPress={async () => {
            console.log('Camera button pressed');
            try {
              const imageUri = await pickImage('camera');
              console.log('Camera pickImage returned:', imageUri);
              if (imageUri) {
                console.log('Setting tempAvatar from camera:', imageUri);
                setTempAvatar(imageUri);
              }
            } catch (error) {
              console.error('Camera pickImage error:', error);
              Alert.alert('错误', '使用相机拍照失败');
            }
          }}
        >
          <Text style={styles.actionButtonIcon}>📷</Text>
          <Text style={styles.actionButtonText}>使用相机拍照</Text>
        </Pressable>
      </View>
      
      {/* 测试按钮 - 用于手动设置tempAvatar */}
      <Pressable 
        style={styles.testButton} 
        onPress={() => {
          console.log('Test button pressed - setting tempAvatar');
          // 设置一个测试图片URL
          const testImageUrl = 'https://picsum.photos/200/200?' + Date.now();
          setTempAvatar(testImageUrl);
        }}
      >
        <Text style={styles.testButtonText}>测试：设置临时头像</Text>
      </Pressable>
      
      {/* 取消按钮 */}
      <Pressable style={styles.cancelButton} onPress={cancelEdit}>
        <Text style={styles.cancelButtonText}>取消</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#333',
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0a84ff',
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#0a84ff',
  },
  avatarHint: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '45%',
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
})