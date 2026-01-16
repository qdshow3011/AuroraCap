import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'
import { messageGenerator } from '../utils/message-generator'

export default function AccountInfoScreen({ onBack, userInfo, onUpdateUserInfo }: { onBack: () => void; userInfo: any; onUpdateUserInfo: (updatedInfo: any) => void }) {
  // 账号信息数据
  const [accountInfo, setAccountInfo] = useState([
    { label: '客户编号', value: 'J000000001', editable: false, key: 'clientId' },
    { label: '姓名', value: '', editable: true, key: 'name' },
    { label: '身份证/护照号', value: '', editable: true, key: 'idNumber' },
    { label: '备用邮箱', value: '', editable: true, key: 'email2' },
    { label: '账户类型', value: '大陆客户', editable: true, key: 'accountType' },
    { label: '开户日期', value: '', editable: false, key: 'createdAt' },
    { label: '实名验证', value: '', editable: false, key: 'verify', isButton: true },
  ])

  // 从userInfo更新账号信息
  useEffect(() => {
    if (userInfo && supabase) {
      // 从数据库获取完整的用户信息
      const fetchClientInfo = async () => {
        try {
          const { data: client, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userInfo.id)
            .single();

          if (error) {
            console.error('获取客户信息失败:', error);
            return;
          }

          if (client) {
            setAccountInfo([
              { label: '客户编号', value: client.customer_number || client.client_id || 'J000000001', editable: false, key: 'clientId' },
              { label: '姓名', value: client.name || '', editable: true, key: 'name' },
              { label: '身份证/护照号', value: client.id_number || '', editable: true, key: 'idNumber' },
              { label: '备用邮箱', value: client.email2 || '', editable: true, key: 'email2' },
              { label: '账户类型', value: client.account_type || '大陆客户', editable: true, key: 'accountType' },
              { label: '开户日期', value: client.created_at ? new Date(client.created_at).toISOString().split('T')[0] : '', editable: false, key: 'createdAt' },
              { label: '实名验证', value: '', editable: false, key: 'verify', isButton: true },
            ]);
          }
        } catch (error) {
          console.error('获取客户信息失败:', error);
        }
      };

      fetchClientInfo();
    }
  }, [userInfo]);

  // 更新账号信息项
  const updateAccountInfoItem = (index: number, value: string) => {
    setAccountInfo(prev => {
      const newInfo = [...prev];
      newInfo[index] = { ...newInfo[index], value };
      return newInfo;
    });
  };

  // 保存账号信息
  const saveAccountInfo = async () => {
    try {
      if (!userInfo || !userInfo.id || !supabase) {
        Alert.alert('错误', '用户信息不存在');
        return;
      }

      // 从accountInfo中提取需要更新的字段
      const name = accountInfo.find(item => item.key === 'name')?.value;
      const idNumber = accountInfo.find(item => item.key === 'idNumber')?.value;
      const email2 = accountInfo.find(item => item.key === 'email2')?.value;
      const accountType = accountInfo.find(item => item.key === 'accountType')?.value;

      // 更新用户信息到数据库
      const { error } = await supabase
        .from('users')
        .update({
          name: name,
          id_number: idNumber,
          email2: email2,
          account_type: accountType
        })
        .eq('id', userInfo.id);

      if (error) {
        console.error('更新客户信息失败:', error);
        Alert.alert('错误', '保存失败，请稍后重试');
        return;
      }

      // 更新用户信息状态
      const updatedUserInfo = {
        ...userInfo,
        email2: email2
      };

      onUpdateUserInfo(updatedUserInfo);

      // 生成用户信息更新消息
      await messageGenerator.generateInfoUpdateMessage(userInfo.id);

      Alert.alert('成功', '账号信息已保存');
      onBack();
    } catch (error) {
      console.error('保存账号信息失败:', error);
      Alert.alert('错误', '保存失败，请稍后重试');
    }
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>账号信息</Text>
        <Pressable style={styles.saveButton} onPress={saveAccountInfo}>
          <Text style={styles.saveButtonText}>保存</Text>
        </Pressable>
      </View>

      {/* 账号信息编辑区域 */}
      <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleSection}>
          {accountInfo.map((item, index) => (
          <View key={index} style={styles.moduleItem}>
            <View style={styles.moduleLeft}>
              <Text style={styles.moduleTitle}>{item.label}</Text>
            </View>
            <View style={styles.moduleRight}>
              {item.isButton ? (
                <Pressable 
                  style={styles.verifyButton} 
                  onPress={() => {
                    Alert.alert('提示', '实名验证功能开发中');
                  }}
                >
                  <Text style={styles.verifyButtonText}>去验证</Text>
                </Pressable>
              ) : item.editable ? (
                item.key === 'accountType' ? (
                  <Pressable 
                    style={styles.moduleSelect} 
                    onPress={() => {
                      // 这里可以实现一个更复杂的选择器，现在暂时使用简单的提示
                      Alert.alert(
                        '选择账户类型',
                        '',
                        [
                          { text: '大陆客户', onPress: () => updateAccountInfoItem(index, '大陆客户') },
                          { text: '港台客户', onPress: () => updateAccountInfoItem(index, '港台客户') },
                          { text: '美国客户', onPress: () => updateAccountInfoItem(index, '美国客户') },
                          { text: '其他', onPress: () => updateAccountInfoItem(index, '其他') },
                          { text: '取消', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <View style={styles.selectContainer}>
                      <Text style={styles.moduleContent}>{item.value}</Text>
                      <Text style={styles.selectArrow}>▼</Text>
                    </View>
                  </Pressable>
                ) : (
                  <TextInput
                    style={styles.moduleInput}
                    value={item.value}
                    onChangeText={(text) => updateAccountInfoItem(index, text)}
                    readOnly={!item.editable}
                    placeholder={`请输入${item.label}`}
                    placeholderTextColor="#999"
                    keyboardType={
                      item.key === 'email2' ? 'email-address' :
                      'default'
                    }
                    autoCapitalize={
                      item.key === 'email2' ? 'none' : 'words'
                    }
                    textAlign="right"
                  />
                )
              ) : (
                <Text style={styles.moduleContent}>{item.value}</Text>
              )}
            </View>
          </View>
        ))}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  contentScrollView: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  moduleSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  moduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  moduleLeft: {
    justifyContent: 'center',
  },
  moduleTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  moduleRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 20,
  },
  moduleContent: {
    color: '#666',
    fontSize: 16,
    textAlign: 'right',
  },
  moduleInput: {
    color: '#333',
    fontSize: 16,
    textAlign: 'right',
    paddingVertical: 4,
    width: '100%',
  },
  moduleSelect: {
    paddingVertical: 8,
    minWidth: 120, // 确保选择框有足够的宽度
    alignItems: 'flex-end', // 确保内容靠右对齐
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // 确保整个容器内容靠右
    backgroundColor: '#f0f0f0', // 添加背景色，与其他输入字段区分
    paddingHorizontal: 12, // 增加左右内边距
    borderRadius: 8, // 添加圆角
    paddingVertical: 6, // 增加上下内边距
  },
  selectArrow: {
    color: '#999',
    fontSize: 12,
    marginLeft: 8, // 增加文字和箭头之间的间距
  },
  verifyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0a84ff',
    borderRadius: 20,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
})
