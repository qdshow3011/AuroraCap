import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert } from 'react-native'
import { useState } from 'react'

export default function PersonalProfileScreen({ lang = 'zh', onClose, userInfo, onAvatarUpdate }: { lang?: 'zh' | 'en'; onClose?: () => void; userInfo?: any; onAvatarUpdate?: () => void }) {
  // 语言翻译
  const t = lang === 'zh' ? {
    title: '个人资料',
    avatar: '头像',
    nickname: '昵称',
    realName: '真实姓名',
    idNumber: '身份证号',
    phone: '手机号码',
    email: '电子邮箱',
    clientId: '客户号',
    accountType: '账户类型',
    memberLevel: '会员等级',
    registrationDate: '注册日期',
    editProfile: '编辑资料',
    save: '保存',
    cancel: '取消'
  } : {
    title: 'Personal Profile',
    avatar: 'Avatar',
    nickname: 'Nickname',
    realName: 'Real Name',
    idNumber: 'ID Number',
    phone: 'Phone Number',
    email: 'Email',
    clientId: 'Client ID',
    accountType: 'Account Type',
    memberLevel: 'Member Level',
    registrationDate: 'Registration Date',
    editProfile: 'Edit Profile',
    save: 'Save',
    cancel: 'Cancel'
  }

  // 模拟用户数据
  const profileData = {
    avatar: userInfo?.avatar || 'https://picsum.photos/100/100',
    nickname: userInfo?.nickname || '极光用户',
    realName: userInfo?.real_name || '未设置',
    idNumber: userInfo?.id_number || '未设置',
    phone: userInfo?.phone || userInfo?.phone_number || '138****8888',
    email: userInfo?.email || 'user****@example.com',
    clientId: userInfo?.client_id || userInfo?.id_number || 'J000000001',
    accountType: userInfo?.account_type || '沪深A股',
    memberLevel: '普通会员',
    registrationDate: userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString() : '2024-01-01'
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <Pressable style={styles.editButton} onPress={() => Alert.alert('提示', '编辑资料功能开发中')}>
          <Text style={styles.editButtonText}>{t.editProfile}</Text>
        </Pressable>
      </View>

      {/* 内容区域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 头像区域 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            <Pressable style={styles.avatarEditButton} onPress={() => onAvatarUpdate?.()}>
              <Text style={styles.avatarEditText}>更换</Text>
            </Pressable>
          </View>
          <Text style={styles.nickname}>{profileData.nickname}</Text>
          <Text style={styles.clientId}>{t.clientId}: {profileData.clientId}</Text>
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.realName}</Text>
              <Text style={styles.infoValue}>{profileData.realName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.idNumber}</Text>
              <Text style={styles.infoValue}>{profileData.idNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.phone}</Text>
              <Text style={styles.infoValue}>{profileData.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.email}</Text>
              <Text style={styles.infoValue}>{profileData.email}</Text>
            </View>
          </View>
        </View>

        {/* 账户信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账户信息</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.clientId}</Text>
              <Text style={styles.infoValue}>{profileData.clientId}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.accountType}</Text>
              <Text style={styles.infoValue}>{profileData.accountType}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.memberLevel}</Text>
              <Text style={styles.infoValue}>{profileData.memberLevel}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t.registrationDate}</Text>
              <Text style={styles.infoValue}>{profileData.registrationDate}</Text>
            </View>
          </View>
        </View>

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
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#0a84ff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#0a84ff',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0a84ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarEditText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  clientId: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
})
