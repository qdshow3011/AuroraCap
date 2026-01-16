'use client';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--background)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--surface)] rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-8">
            Aurora Intelligent Fund SPC Ltd. 隐私政策
          </h1>
          
          <div className="text-lg text-[var(--text-secondary)] mb-12">
            最近更新日期：2026年1月
          </div>
          
          <div className="prose prose-lg max-w-none text-[var(--text-primary)]">
            <p className="mb-8">
              Aurora Intelligent Fund SPC Ltd.（以下简称“AIF”或“本公司”）尊重并保护用户的隐私。本隐私政策描述了我们如何收集、使用、披露和保护您的个人信息。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">一、信息收集</h2>
            <p className="mb-6">
              我们可能收集以下类型的个人信息：
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>个人身份信息（姓名、邮箱、电话、身份证号码等）</li>
              <li>财务信息（投资偏好、资产状况等）</li>
              <li>浏览信息（IP地址、浏览器类型、访问时间等）</li>
              <li>其他与投资咨询相关的信息</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">二、信息使用</h2>
            <p className="mb-6">
              我们收集的个人信息将用于以下目的：
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>身份验证和资格审查</li>
              <li>提供投资咨询和服务</li>
              <li>处理投资申请和交易</li>
              <li>发送重要通知和更新</li>
              <li>改进我们的产品和服务</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">三、信息披露</h2>
            <p className="mb-6">
              我们不会向第三方出售或出租您的个人信息，但在以下情况下可能会披露：
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>获得您的明确同意</li>
              <li>遵守法律要求或响应政府部门的合法请求</li>
              <li>保护本公司或他人的权利、财产或安全</li>
              <li>与我们的服务提供商共享（仅用于提供服务）</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">四、信息安全</h2>
            <p className="mb-6">
              我们采取合理的安全措施保护您的个人信息，防止未经授权的访问、使用或披露。这些措施包括：
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>数据加密和安全存储</li>
              <li>访问控制和身份验证</li>
              <li>定期安全审计和评估</li>
              <li>员工培训和保密协议</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">五、您的权利</h2>
            <p className="mb-6">
              根据适用法律，您可能享有以下权利：
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>访问和获取您的个人信息</li>
              <li>更正或更新您的个人信息</li>
              <li>删除您的个人信息</li>
              <li>限制或反对个人信息的处理</li>
              <li>数据可携带权</li>
              <li>撤回同意的权利</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">六、隐私政策的变更</h2>
            <p className="mb-6">
              我们可能会不时更新本隐私政策。更新后的政策将在网站上发布，并更新最近更新日期。我们鼓励您定期查看本政策，了解我们如何保护您的隐私。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">七、联系方式</h2>
            <p className="mb-6">
              如果您对本隐私政策有任何疑问或 concerns，请通过以下方式联系我们：
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>邮箱：privacy@auroraintelligentfund.com</li>
              <li>电话：[电话号码]</li>
              <li>地址：[公司地址]</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}