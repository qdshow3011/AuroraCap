'use client';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--background)] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--surface)] rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-8">
            Aurora Intelligent Fund SPC Ltd. 服务条款
          </h1>
          
          <div className="text-lg text-[var(--text-secondary)] mb-12">
            最近更新日期：2026年1月
          </div>
          
          <div className="prose prose-lg max-w-none text-[var(--text-primary)]">
            <p className="mb-8">
              欢迎访问 Aurora Intelligent Fund SPC Ltd.（以下简称“AIF”或“本公司”）官方网站。使用本网站即表示您已阅读并同意受以下条款约束。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">一、合格投资者确认</h2>
            <p className="mb-6">
              本网站所展示的投资产品（包括但不限于AI变革先锋基金、AI发展平衡基金、AI基础增利基金）仅针对符合法律定义的“合格投资者”或“专业投资者”。用户在浏览特定产品信息前，须自行确认其具备相应的风险识别与承受能力。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">二、独立投资组合（SPC）资产隔离</h2>
            <p className="mb-6">
              AIF 依据[注册地法律]设立为独立投资组合公司。投资者应理解，各子基金（Segregated Portfolios）之间的资产与负债在法律上严格隔离。任何单一投资组合的债务仅由该组合资产承担，不涉及本公司其他投资组合或公司整体资产。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">三、募集政策与规模管理</h2>
            <p className="mb-6">
              <strong>策略容量控制：</strong>为维护现有投资者的利益及策略执行的有效性，本公司有权根据市场流动性和策略容量对各基金（如 AI基础增利基金）的管理规模（AUM）实施动态控制。
            </p>
            <p className="mb-6">
              <strong>认购申请权限：</strong>本公司保留接受或拒绝任何认购申请的最终决定权，并有权在不预先通知的情况下中止或限制特定投资组合的认购通道。
            </p>
            <p className="mb-6">
              <strong>费率结构：</strong>网站显示的费率条款（如早鸟期费率或管理费减免）受特定时间窗口或认购批次限制，具体以正式的认购协议（Subscription Agreement）为准。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">四、投资风险披露</h2>
            <p className="mb-6">
              <strong>科技赛道波动：</strong>鉴于 AI 产业的技术演进速度快、市场波动性大，投资者可能面临本金损失的风险。
            </p>
            <p className="mb-6">
              <strong>操盘逻辑：</strong>尽管本公司由华尔街精英团队运用成长性投资理念进行操盘，但过往业绩不代表未来收益，专业分析策略亦不构成对投资回报的保证。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">五、知识产权声明</h2>
            <p className="mb-6">
              本网站所有的品牌标识、Slogan、投研策略说明及分析模型均受知识产权法保护。未经 AIF 书面授权，严禁对上述内容进行抓取、复制或用于任何商业传播。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">六、隐私与数据安全</h2>
            <p className="mb-6">
              您在申请受邀资格或咨询过程中提供的个人数据，将仅用于身份验证及提供相关的专业价值投资分析。我们严格遵守国际数据保护准则，防止信息泄露。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">七、免责声明</h2>
            <p className="mb-6">
              本网站内容仅供参考。AIF 不对因依赖本网站信息而产生的任何决策结果承担法律责任。建议投资者在签署正式合同前，寻求独立的法律、税务及财务建议。
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6 text-[var(--text-primary)]">八、法律管辖</h2>
            <p className="mb-6">
              本条款受 [公司注册地法律] 管辖，并依其解释。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}