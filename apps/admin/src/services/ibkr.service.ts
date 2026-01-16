import { supabaseClient } from '../main';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

interface IbkrSyncResult {
  success: boolean;
  date: string;
  value: number;
}



// 获取网络配置的辅助函数
async function getNetworkConfig() {
  try {
    const config: any = {};
    
    // 开发环境：使用Vite代理
    // 生产环境（Vercel）：使用相对路径，由Vercel Serverless Function处理
    console.log('=== 网络配置详情 ===');
    console.log('环境:', import.meta.env.DEV ? '开发环境' : '生产环境');
    console.log('API请求方式:', import.meta.env.DEV ? 'Vite代理' : 'Vercel Serverless Function');
    
    console.log('最终网络配置:', config);
    return config;
  } catch (error) {
    console.error('加载网络配置失败:', error);
    return {};
  }
}

class IBKRService {
  private token: string;
  private queryId: string;

  constructor(reportToken: string, reportQueryId: string) {
    this.token = reportToken;
    this.queryId = reportQueryId;
  }

  /**
   * 通用重试函数
   */
  private async retry<T>(fn: () => Promise<T>, retries: number = 3, initialDelay: number = 2000): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === retries - 1) {
          console.error(`最后一次重试失败 (${i + 1}/${retries})，不再重试`);
          throw error;
        }
        
        let delay = initialDelay;
        let retryReason = '未知错误';
        
        if (axios.isAxiosError(error)) {
          retryReason = `Axios错误 (${error.code || '未知代码'})`;
          
          if (['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'ERR_NETWORK'].includes(error.code || '')) {
            delay = initialDelay * Math.pow(2, i); // 指数退避
            retryReason = `网络错误 (${error.code})`;
          }
          else if (error.response?.status && error.response.status >= 500) {
            delay = initialDelay * 2;
            retryReason = `IBKR服务器错误 (状态码: ${error.response.status})`;
          }
        } else {
          retryReason = '其他错误';
        }
        
        console.log(`请求失败: ${retryReason}，${delay}毫秒后重试 (${i + 1}/${retries})`);
        console.log(`错误详情: ${error instanceof Error ? error.message : String(error)}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('重试失败');
  }

  async _sendRequest(): Promise<string> {
    const networkConfig = await getNetworkConfig();
    
    // 部署到Vercel，使用实际网络请求连接IBKR API
    const USE_MOCK_DATA = false;
    
    if (USE_MOCK_DATA) {
      console.log('=== 使用模拟数据代替实际网络请求 (临时解决方案) ===');
      console.log('Token:', this.token ? '存在 (长度: ' + this.token.length + ')' : '不存在');
      console.log('Query ID:', this.queryId ? '存在 (长度: ' + this.queryId.length + ')' : '不存在');
      
      // 模拟延迟，让界面更真实
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 返回模拟的ReferenceCode
      const mockReferenceCode = 'MOCK_REF_123456789';
      console.log('模拟获取ReferenceCode:', mockReferenceCode);
      return mockReferenceCode;
    }
    
    return this.retry(async () => {
      // 添加详细日志记录
      console.log('=== IBKR SendRequest 参数 ===');
      console.log('Token:', this.token ? '存在 (长度: ' + this.token.length + ')' : '不存在');
      console.log('Query ID:', this.queryId ? '存在 (长度: ' + this.queryId.length + ')' : '不存在');
      
      // 验证参数有效性
      if (!this.token || this.token.trim() === '') {
        throw new Error('Report token不能为空');
      }
      if (!this.queryId || this.queryId.trim() === '') {
        throw new Error('Report query ID不能为空');
      }
      // 验证格式 - IBKR API要求token和query ID只能包含数字
      const tokenRegex = /^\d+$/;
      const queryIdRegex = /^\d+$/;
      if (!tokenRegex.test(this.token)) {
        throw new Error('Report token格式错误，只能包含数字');
      }
      if (!queryIdRegex.test(this.queryId)) {
        throw new Error('Report query ID格式错误，只能包含数字');
      }
      
      const encodedToken = encodeURIComponent(this.token);
      const encodedQueryId = encodeURIComponent(this.queryId);
      // 使用相对路径让Vite自动处理代理
      const url = `/api/ibkr/Universal/servlet/FlexStatementService.SendRequest?t=${encodedToken}&q=${encodedQueryId}&v=3`;
      console.log('完整请求URL:', url);
      
      const config: any = {
        headers: {
          'Accept': 'application/xml'
        },
        responseType: 'text',
        timeout: 90000, // 增加超时时间到90秒
        withCredentials: false,
        ...networkConfig
      };
      
      let response;
      try {
        console.log('=== 发送IBKR SendRequest请求 ===');
        console.log('请求配置:', JSON.stringify(config, null, 2));
        response = await axios.get(url, config);
        console.log('=== IBKR SendRequest响应成功 ===');
        console.log('响应状态码:', response.status);
        console.log('响应头:', JSON.stringify(response.headers, null, 2));
        console.log('响应数据长度:', response.data.length);
        console.log('响应数据前500字符:', response.data.substring(0, 500));
        console.log('响应数据后500字符:', response.data.substring(Math.max(0, response.data.length - 500)));
      } catch (axiosError) {
        console.error('=== IBKR SendRequest请求失败 ===');
        if (axios.isAxiosError(axiosError)) {
          console.error('错误类型:', 'AxiosError');
          console.error('错误代码:', axiosError.code);
          console.error('错误消息:', axiosError.message);
          if (axiosError.response) {
            // 服务器响应了，但状态码不在2xx范围内
            console.error('响应状态码:', axiosError.response.status);
            console.error('响应头:', JSON.stringify(axiosError.response.headers, null, 2));
            console.error('响应数据:', axiosError.response.data);
            
            // 针对500错误提供更详细的分析
            if (axiosError.response.status === 500) {
              console.error('=== 500错误分析 ===');
              console.error('可能原因1: 无效的Token或Query ID');
              console.error('可能原因2: IBKR服务器端问题');
              console.error('可能原因3: 请求格式错误');
              console.error('Token检查:', this.token ? '存在 (长度: ' + this.token.length + ')' : '不存在');
              console.error('Query ID检查:', this.queryId ? '存在 (长度: ' + this.queryId.length + ')' : '不存在');
              console.error('完整Token:', this.token);
              console.error('完整Query ID:', this.queryId);
              console.error('IBKR服务器500响应详情:');
              console.error('响应数据类型:', typeof axiosError.response.data);
              console.error('响应数据长度:', axiosError.response.data ? axiosError.response.data.length : 0);
              console.error('响应数据前1000字符:', axiosError.response.data ? axiosError.response.data.substring(0, 1000) : '无数据');
              console.error('响应数据完整内容:', axiosError.response.data);
              console.error('完整响应:', JSON.stringify(axiosError.response, null, 2));
              console.error('响应头完整内容:', JSON.stringify(axiosError.response.headers, null, 2));
            }
          } else if (axiosError.request) {
            // 请求已发送，但没有收到响应
            console.error('请求信息:', JSON.stringify(axiosError.request, null, 2));
            console.error('网络检查:', '请求已发送但无响应，可能是网络超时或防火墙问题');
          } else {
            // 设置请求时发生错误
            console.error('请求配置错误:', axiosError.message);
          }
        } else {
          console.error('错误类型:', '其他错误');
          console.error('错误对象:', axiosError);
          console.error('错误消息:', (axiosError as Error).message);
          console.error('错误堆栈:', (axiosError as Error).stack);
        }
        throw axiosError;
      }
      
      const data = response.data;
      
      if (!data || typeof data !== 'string' || data.trim() === '') {
        throw new Error('IBKR服务器返回空响应');
      }
      
      if (data.includes('DOCTYPE html') || data.includes('<html')) {
        console.error('收到HTML响应:', data.substring(0, 1000));
        throw new Error('IBKR服务器返回了HTML页面而不是XML响应');
      }
      
      let jsonObj;
      const parserConfigs = [
        { ignoreAttributes: false, attributeNamePrefix: '', trimValues: true, parseAttributeValue: true },
        { ignoreAttributes: true, trimValues: true },
        { preserveOrder: true, trimValues: true }
      ];
      
      let parseSuccess = false;
      for (let i = 0; i < parserConfigs.length; i++) {
        try {
          const parser = new XMLParser(parserConfigs[i]);
          jsonObj = parser.parse(data);
          
          if (jsonObj && typeof jsonObj === 'object' && Object.keys(jsonObj).length > 0) {
            parseSuccess = true;
            break;
          }
        } catch (parseError) {
          console.warn(`SendRequest解析配置 ${i + 1} 失败:`, parseError);
          console.warn(`响应数据样例:`, data.substring(0, 200));
        }
      }
      
      if (!parseSuccess) {
        console.error('XML解析失败，完整响应数据:', data);
        throw new Error('XML解析失败，响应结构为空');
      }
      
      let flexStatementResponse;
      if (jsonObj.FlexStatementResponse) {
        flexStatementResponse = jsonObj.FlexStatementResponse;
      } else {
        const rootElement = Object.keys(jsonObj)[0];
        console.log('XML根元素:', rootElement);
        if (rootElement) {
          flexStatementResponse = jsonObj[rootElement];
        }
      }
      
      if (!flexStatementResponse) {
        console.error('响应结构不符合预期，JSON对象:', JSON.stringify(jsonObj, null, 2));
        throw new Error('响应结构不符合预期');
      }
      
      if (flexStatementResponse.Status === 'Fail') {
        const errorMessage = flexStatementResponse.ErrorMessage || '请求失败';
        const errorCode = flexStatementResponse.code || 'Unknown';
        console.error('IBKR API错误码:', errorCode);
        console.error('IBKR API错误消息:', errorMessage);
        throw new Error(`IBKR SendRequest失败: ${errorCode} - ${errorMessage}`);
      }
      
      const referenceCode = flexStatementResponse.ReferenceCode;
      if (!referenceCode) {
        console.error('响应中未找到ReferenceCode，响应结构:', JSON.stringify(flexStatementResponse, null, 2));
        throw new Error('未找到ReferenceCode');
      }
      
      console.log('成功获取ReferenceCode:', referenceCode);
      return referenceCode.trim();
    }, 3, 5000); // 增加重试间隔到5秒
  }

  async _getStatement(refCode: string): Promise<string> {
    const networkConfig = await getNetworkConfig();
    
    // 部署到Vercel，使用实际网络请求连接IBKR API
    const USE_MOCK_DATA = false;
    
    if (USE_MOCK_DATA) {
      console.log('=== 使用模拟数据代替实际GetStatement请求 (临时解决方案) ===');
      console.log('Reference Code:', refCode);
      
      // 模拟延迟，让界面更真实
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 返回模拟的XML报表数据
      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<FlexQueryResponse>
  <FlexStatements>
    <FlexStatement accountId="12345678" fromDate="20240101" toDate="20240131" currency="USD">
      <ChangeInNAV>
        <endingValue>150000.75</endingValue>
      </ChangeInNAV>
    </FlexStatement>
  </FlexStatements>
</FlexQueryResponse>`;
      
      console.log('模拟获取报表数据，长度:', mockXml.length);
      return mockXml;
    }
    
    return this.retry(async () => {
      // 验证参数有效性
      if (!refCode || refCode.trim() === '') {
        throw new Error('Reference Code不能为空');
      }
      
      const encodedToken = encodeURIComponent(this.token);
      const encodedRefCode = encodeURIComponent(refCode);
      // 使用相对路径让Vite自动处理代理
      const url = `/api/ibkr/Universal/servlet/FlexStatementService.GetStatement?t=${encodedToken}&q=${encodedRefCode}&v=3`;
      console.log('=== IBKR GetStatement 请求 ===');
      console.log('请求URL:', url);
      
      const config: any = {
        headers: {
          'Accept': 'application/xml'
        },
        responseType: 'text',
        timeout: 90000, // 增加超时时间到90秒
        withCredentials: false,
        ...networkConfig
      };
      
      let response;
      try {
        console.log('=== 发送IBKR GetStatement请求 ===');
        console.log('请求配置:', JSON.stringify(config, null, 2));
        response = await axios.get(url, config);
        console.log('=== IBKR GetStatement响应成功 ===');
        console.log('响应状态码:', response.status);
        console.log('响应头:', JSON.stringify(response.headers, null, 2));
        console.log('响应数据长度:', response.data.length);
        console.log('响应数据前200字符:', response.data.substring(0, 200));
      } catch (axiosError) {
        console.error('=== IBKR GetStatement请求失败 ===');
        if (axios.isAxiosError(axiosError)) {
          console.error('错误类型:', 'AxiosError');
          console.error('错误代码:', axiosError.code);
          console.error('错误消息:', axiosError.message);
          if (axiosError.response) {
            console.error('响应状态码:', axiosError.response.status);
            console.error('响应头:', JSON.stringify(axiosError.response.headers, null, 2));
            console.error('响应数据:', axiosError.response.data);
            
            // 针对500错误提供更详细的分析
            if (axiosError.response.status === 500) {
              console.error('=== GetStatement 500错误分析 ===');
              console.error('可能原因1: Reference Code无效');
              console.error('可能原因2: IBKR服务器端问题');
              console.error('可能原因3: 请求格式错误');
              console.error('完整Reference Code:', refCode);
              console.error('IBKR服务器500响应详情:');
              console.error('响应数据类型:', typeof axiosError.response.data);
              console.error('响应数据:', axiosError.response.data);
              console.error('完整响应:', JSON.stringify(axiosError.response, null, 2));
            }
          } else if (axiosError.request) {
            console.error('请求信息:', JSON.stringify(axiosError.request, null, 2));
          } else {
            console.error('请求配置错误:', axiosError.message);
          }
        } else {
          console.error('错误类型:', '其他错误');
          console.error('错误对象:', axiosError);
          console.error('错误消息:', (axiosError as Error).message);
          console.error('错误堆栈:', (axiosError as Error).stack);
        }
        throw axiosError;
      }
      
      const data = response.data;
      
      if (!data || typeof data !== 'string' || data.trim() === '') {
        console.error('GetStatement返回空响应');
        throw new Error('IBKR服务器返回空报表响应');
      }
      
      if (data.includes('DOCTYPE html') || data.includes('<html')) {
        console.error('GetStatement返回HTML响应:', data.substring(0, 500));
        throw new Error('IBKR服务器返回了HTML页面而不是XML报表');
      }
      
      return data;
    }, 3, 5000); // 增加重试间隔到5秒
  }

  _parseEndingNav(xml: string): { reportDate: string; endingValue: number } {
    if (!xml || typeof xml !== 'string' || xml.trim() === '') {
      throw new Error('XML数据为空');
    }
    
    let jsonObj;
    const parserConfigs = [
      { ignoreAttributes: false, attributeNamePrefix: '', trimValues: true, parseAttributeValue: true },
      { ignoreAttributes: true, trimValues: true },
      { preserveOrder: true, trimValues: true }
    ];
    
    let parseSuccess = false;
    for (let i = 0; i < parserConfigs.length; i++) {
      try {
        const parser = new XMLParser(parserConfigs[i]);
        jsonObj = parser.parse(xml);
        
        if (jsonObj && typeof jsonObj === 'object' && Object.keys(jsonObj).length > 0) {
          parseSuccess = true;
          break;
        }
      } catch (parseError) {
        console.warn(`净资产解析配置 ${i + 1} 失败:`, parseError);
      }
    }
    
    if (!parseSuccess) {
      throw new Error('XML解析失败，响应结构为空');
    }
    
    let flexQueryResponse;
    if (jsonObj.FlexQueryResponse) {
      flexQueryResponse = jsonObj.FlexQueryResponse;
    } else {
      const rootElement = Object.keys(jsonObj)[0];
      if (rootElement) {
        flexQueryResponse = jsonObj[rootElement];
      }
    }
    
    if (!flexQueryResponse) {
      throw new Error('XML结构不符合预期格式');
    }
    
    let endingValue: number;
    let reportDate: string;
    
    // 优先尝试新的FlexStatements.FlexStatement.ChangeInNAV结构
    if (flexQueryResponse.FlexStatements?.FlexStatement) {
      const statements = Array.isArray(flexQueryResponse.FlexStatements.FlexStatement) ?
                        flexQueryResponse.FlexStatements.FlexStatement :
                        [flexQueryResponse.FlexStatements.FlexStatement];
      
      if (statements.length === 0) {
        throw new Error('未找到FlexStatement数据');
      }
      
      const statement = statements[0];
      
      if (!statement.ChangeInNAV) {
        throw new Error('未找到ChangeInNAV数据');
      }
      
      const changeInNav = Array.isArray(statement.ChangeInNAV) ?
                        statement.ChangeInNAV[0] :
                        statement.ChangeInNAV;
      
      if (typeof changeInNav.endingValue === 'number') {
        endingValue = changeInNav.endingValue;
      } else {
        endingValue = parseFloat(changeInNav.endingValue);
      }
      
      if (isNaN(endingValue)) {
        throw new Error(`净资产值不是有效数字: ${changeInNav.endingValue}`);
      }
      
      if (statement.toDate) {
        const dateStr = String(statement.toDate);
        if (dateStr.length === 8) {
          reportDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        } else {
          reportDate = new Date().toISOString().split('T')[0];
        }
      } else {
        reportDate = new Date().toISOString().split('T')[0];
      }
      
      return { reportDate, endingValue };
    }
    
    // 兼容旧格式
    throw new Error('未找到有效格式的净资产数据');
  }

  /**
   * 执行全流程同步（直接在主线程中执行）
   */
  async syncDailyAssets(fundConfigId: string): Promise<IbkrSyncResult> {
    try {
      console.log('=== 开始IBKR同步流程 ===');
      
      // 1. 发送请求获取ReferenceCode
      console.log('=== 步骤1: 发送请求获取ReferenceCode ===');
      const referenceCode = await this._sendRequest();
      console.log('获取到ReferenceCode:', referenceCode);
      
      // 2. 等待1-2秒，确保IBKR服务器有足够时间生成报表
      console.log('=== 步骤2: 等待报表生成（2秒）===');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. 使用ReferenceCode获取实际的报表数据
      console.log('=== 步骤3: 使用ReferenceCode获取报表数据 ===');
      const statementXml = await this._getStatement(referenceCode);
      console.log('报表数据长度:', statementXml.length);
      
      // 4. 解析XML数据获取净资产值
      console.log('=== 步骤4: 解析报表数据 ===');
      const { reportDate, endingValue } = this._parseEndingNav(statementXml);
      
      // 5. 从数据库获取最新总份额
      console.log('=== 步骤5: 获取最新总份额 ===');
      const { data: latestData, error: fetchError } = await supabaseClient
        .from('ib_fund_data')
        .select('latest_shares')
        .eq('fund_config_id', fundConfigId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116表示没有找到记录
        console.error('获取最新总份额失败:', fetchError);
        throw new Error('获取最新总份额失败');
      }
      
      const latestShares = latestData?.latest_shares || 0;
      console.log('最新总份额:', latestShares);
      
      // 6. 计算预留未计提费用和最新单位净值
      console.log('=== 步骤6: 计算预留未计提费用和最新单位净值 ===');
      const reservedFees = endingValue * 0.02; // 按IBKR账户总净清算价值的2%计算
      const latestUnitNav = latestShares > 0 ? (endingValue - reservedFees) / latestShares : 0;
      
      console.log('=== 计算结果 ===');
      console.log('IBKR账户总净清算价值:', endingValue);
      console.log('预留未计提费用:', reservedFees);
      console.log('最新单位净值:', latestUnitNav);
      
      // 7. 将数据写入数据库
      console.log('=== 步骤7: 更新数据库 ===');
      const { error: updateError } = await supabaseClient
        .from('ib_fund_data')
        .upsert({
          fund_config_id: fundConfigId,
          net_liquidation_value: endingValue,
          reserved_fees: reservedFees,
          latest_shares: latestShares, // 保留原有份额
          latest_unit_nav: latestUnitNav,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error('更新数据库失败:', updateError);
        throw new Error('更新数据库失败');
      }
      
      console.log('=== IBKR同步流程完成 ===');
      console.log('报告日期:', reportDate);
      console.log('净资产值:', endingValue);

      return { success: true, date: reportDate, value: endingValue };
    } catch (error) {
      console.error('[IBKR Service Error]:', error instanceof Error ? error.message : String(error));
      console.error('[IBKR Service Error Stack]:', error instanceof Error ? error.stack : 'N/A');
      
      // 根据错误类型提供更明确的错误信息
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('IBKR服务器连接超时，请检查网络连接或稍后重试');
        } else if (error.code === 'ETIMEDOUT') {
          throw new Error('网络连接超时，无法连接到IBKR服务器。请检查网络设置和防火墙配置');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error('无法连接到IBKR服务器，请检查网络连接或服务器状态');
        } else if (error.code === 'ERR_BLOCKED_BY_CORS_POLICY' || error.message?.includes('CORS')) {
          throw new Error('CORS策略阻止了请求，请检查浏览器网络设置');
        } else if (error.code === 'ERR_NETWORK') {
          throw new Error('网络连接失败，可能是由于：1. 本地网络防火墙阻止了连接；2. 系统VPN设置问题；3. IBKR服务器暂时不可达。');
        } else if (error.response?.status === 401) {
          throw new Error('IBKR API认证失败，请检查Token是否有效');
        } else if (error.response?.status === 403) {
          throw new Error('IBKR API权限不足，请检查Token和Query ID的权限设置');
        } else if (error.response?.status === 404) {
          throw new Error('IBKR API请求路径不存在，请检查API端点配置');
        } else if (error.response?.status && error.response.status >= 500) {
          throw new Error('IBKR服务器错误，请稍后重试');
        }
      } 
      
      throw error;
    }
  }

  /**
   * 从Supabase获取IBKR配置
   */
  async getIbkrConfig() {
    try {
      const { data, error } = await supabaseClient
        .from('ibkr_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('获取IBKR配置失败:', error);
        throw error;
      }

      return data[0] || null;
    } catch (error) {
      console.error('获取IBKR配置错误:', error);
      throw error;
    }
  }

  /**
   * 更新IBKR配置
   */
  async updateIbkrConfig(config: any) {
    try {
      const { data, error } = await supabaseClient
        .from('ibkr_config')
        .update(config)
        .eq('id', config.id)
        .select();

      if (error) {
        console.error('更新IBKR配置失败:', error);
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error('更新IBKR配置错误:', error);
      throw error;
    }
  }

  /**
   * 创建IBKR配置
   */
  async createIbkrConfig(config: any) {
    try {
      const { data, error } = await supabaseClient
        .from('ibkr_config')
        .insert(config)
        .select();

      if (error) {
        console.error('创建IBKR配置失败:', error);
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error('创建IBKR配置错误:', error);
      throw error;
    }
  }
}

export { IBKRService }; export type { IbkrSyncResult };
