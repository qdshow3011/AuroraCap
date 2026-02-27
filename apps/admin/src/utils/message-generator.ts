import { supabaseClient } from '../main';

interface GenerateMessageOptions {
  content: string;
  category: string;
  audienceType: string;
  userId?: string;
}

export const messageGenerator = {
  // 生成用户注册成功消息
  async generateRegistrationMessages(userId: string, userName: string, inviterId?: string, inviterName?: string) {
    try {
      // 直接从数据库查询用户的详细信息，确保获取到正确的用户名
      let actualUserName = userName || '用户';
      
      if (userId) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('name, nickname')
          .eq('id', userId)
          .single();
        
        if (userData) {
          // 优先使用数据库中的实际姓名，其次使用传入的userName，最后使用默认值
          actualUserName = userData.name || userData.nickname || userName || '用户';
        }
      }

      // 给注册用户的消息
      await this.generateMessage({
        content: `感谢您的信任，${actualUserName}，你的注册已成功！邀请人为"${inviterName || '无'}"`,
        category: 'system',
        audienceType: 'user',
        userId
      });

      // 给邀请人的消息
      if (inviterId && inviterName) {
        await this.generateMessage({
          content: `您邀请的用户"${actualUserName}"已经注册成功，感谢您的付出！`,
          category: 'system',     
          audienceType: 'user',
          userId: inviterId
        });
      }
    } catch (error) {
      console.error('Failed to generate registration messages:', error);
    }
  },

  // 生成用户信息变更消息
  async generateInfoUpdateMessage(userId: string) {
    try {
      // 直接从数据库查询用户的详细信息，确保获取到正确的用户名
      let actualUserName = '用户';
      
      if (userId) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('name, nickname')
          .eq('id', userId)
          .single();
        
        if (userData) {
          // 优先使用数据库中的实际姓名，其次使用默认值
          actualUserName = userData.name || userData.nickname || '用户';
        }
      }

      await this.generateMessage({
        content: `${actualUserName}，您的信息已经修改成功，感谢您！`,
        category: 'system', 
        audienceType: 'user',
        userId
      });
    } catch (error) {
      console.error('Failed to generate info update message:', error);
    }
  },

  // 生成基金交易申请消息
  async generateFundTransactionMessage(userId: string, userName: string, transactionType: '申购' | '赎回' | '入金' | '出金') {
    try {
      // 直接从数据库查询用户的详细信息，确保获取到正确的用户名
      let actualUserName = userName || '用户';
      
      if (userId) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('name, nickname')
          .eq('id', userId)
          .single();
        
        if (userData) {
          // 优先使用数据库中的实际姓名，其次使用传入的userName，最后使用默认值
          actualUserName = userData.name || userData.nickname || userName || '用户';
        }
      }
      
      const userContent = `${actualUserName},你的${transactionType}申请已经提交成功，我们正依据约定努力为您办理中，谢谢！`;
      const staffContent = `${actualUserName}的${transactionType}申请已经提交成功，请依据约定努力为您办理中，谢谢！`;
      
      // 给用户的消息
      await this.generateMessage({
        content: userContent,
        category: 'investment', 
        audienceType: 'user',
        userId
      });

      // 给服务员的消息
      await this.generateMessage({
        content: staffContent,
        category: 'investment', 
        audienceType: '服务员',
      });

      // 给管理员的消息
      await this.generateMessage({
        content: staffContent,
        category: 'investment', 
        audienceType: '管理员'
      });
    } catch (error) {
      console.error('Failed to generate fund transaction message:', error);
    }
  },

  // 生成管理员操作消息
  async generateAdminOperationMessage(userId: string, _operationType: string, content: string) {
    try {
      // 直接从数据库查询用户的详细信息，确保获取到正确的用户名
      let actualUserName = '用户';
      
      if (userId) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('name, nickname')
          .eq('id', userId)
          .single();
        
        if (userData) {
          // 优先使用数据库中的实际姓名，其次使用默认值
          actualUserName = userData.name || userData.nickname || '用户';
        }
      }

      await this.generateMessage({
        content: `${actualUserName}，${content}`,
        category: 'system', 
        audienceType: 'user',
        userId
      });
    } catch (error) {
      console.error('Failed to generate admin operation message:', error);
    }
  },

  // 通用消息生成函数
  async generateMessage(options: GenerateMessageOptions) {
    try {
      // 插入消息
      const { data: messageData, error: messageError } = await supabaseClient
        .from('system_messages')
        .insert({
          content: options.content,
          category: options.category,
          audience_type: options.audienceType,
          user_id: options.userId,
          created_by: 'system',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (messageError) {
        console.error('Failed to insert message:', messageError);
        return;
      }

      // 如果插入成功，生成对应的消息状态记录
      if (messageData && messageData.id) {
        await this.generateMessageStatus(messageData.id, options.audienceType, options.userId);
      }
    } catch (error) {
      console.error('Failed to generate message:', error);
    }
  },

  // 生成消息状态记录
  async generateMessageStatus(messageId: string, audienceType: string, userId?: string) {
    try {
      if (audienceType === 'user' && userId) {
        // 如果是针对特定用户的消息，为该用户创建状态记录
        try {
          await supabaseClient
            .from('system_messages_status')
            .insert({
              message_id: messageId,
              user_id: userId,
              is_read: false
            });
        } catch (error) {
          // 忽略唯一约束冲突错误，继续执行
          if (typeof error === 'object' && error !== null && 'code' in error && error.code !== '23505') {
            console.error('Failed to insert message status:', error);
          }
        }
      } else {
        // 处理特殊受众类型
        let users: Array<{ id: string }> = [];

        // 根据audienceType查询对应的用户
        switch (audienceType) {
          case '全体用户': {
            const { data: allUsers } = await supabaseClient
              .from('users')
              .select('id');
            if (allUsers) users = allUsers;
            break;
          }
          
          case '合伙人': {
            const { data: partners } = await supabaseClient
              .from('users')
              .select('id')
              .eq('role', 'partner');
            if (partners) users = partners;
            break;
          }
          
          case '客户': {
            const { data: customers } = await supabaseClient
              .from('users')
              .select('id')
              .eq('role', 'customer');
            if (customers) users = customers;
            break;
          }
          
          case '服务员': {
            const { data: waiters } = await supabaseClient
              .from('users')
              .select('id')
              .eq('role', 'waiter')
              .or('role.eq.服务员');
            if (waiters) users = waiters;
            break;
          }
          
          case '管理员': {
            const { data: admins } = await supabaseClient
              .from('users')
              .select('id')
              .eq('role', 'admin');
            if (admins) users = admins;
            break;
          }
          
          case '登录用户':
            // 登录用户的情况由前端处理
            break;
          
          default:
            // 未知受众类型，不创建状态记录
            return;
        }

        // 为查询到的用户批量创建状态记录
        if (users.length > 0) {
          for (const user of users) {
            try {
              await supabaseClient
                .from('system_messages_status')
                .insert({
                  message_id: messageId,
                  user_id: user.id,
                  is_read: false
                });
            } catch (error) {
              // 忽略唯一约束冲突错误，继续执行
              if (typeof error === 'object' && error !== null && 'code' in error && error.code !== '23505') {
                console.error('Failed to insert message status for user:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate message status:', error);
    }
  }
};