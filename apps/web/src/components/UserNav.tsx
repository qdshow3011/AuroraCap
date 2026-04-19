'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserNavProps {
  user?: any;
  profile?: any;
}

export function UserNav({ user, profile }: UserNavProps) {
  const pathname = usePathname();

  // Get user role from profile or user metadata
  const userRole = profile?.role || user?.user_metadata?.role || user?.role || 'USER';
  const isFundCompany = userRole === 'fund_company' || userRole === 'FUND_COMPANY';

  // Regular user nav items - organized into categories
  const regularNavItems = [
    {
      category: '资产与交易',
      items: [
        { href: '/user', label: '账户概览' },
        { href: '/user/positions', label: '持仓明细' },
        { href: '/user/transactions', label: '交易记录' },
        { href: '/user/fund-flow', label: '资金流水' },
      ]
    },
    {
      category: '投资操作',
      items: [
        { href: '/user/subscribe-apply', label: '申购申请' },
        { href: '/user/redeem-apply', label: '赎回申请' },
        { href: '/user/deposit-guide', label: '入金指导' },
        { href: '/user/withdraw', label: '出金申请' },
      ]
    },
    {
      category: '账户管理',
      items: [
        { href: '/user/profile', label: '个人资料' },
        { href: '/user/contracts', label: '合同管理' },
        { href: '/user/messages', label: '消息中心' },
        { href: '/user/settings', label: '账户设置' },
      ]
    },
    {
      category: '客户服务',
      items: [
        { href: '/user/service', label: '客服系统' },
      ]
    }
  ];

  // Fund company nav items
  const fundCompanyNavItems = [
    {
      category: '基金管理',
      items: [
        { href: '/user/fund-company/products', label: '产品管理' },
        { href: '/user/fund-company/chat', label: '客户对话' },
        { href: '/user/fund-company/official-account', label: '公众号管理' },
      ]
    },
    {
      category: '账户管理',
      items: [
        { href: '/user/profile', label: '个人资料' },
        { href: '/user/settings', label: '账户设置' },
      ]
    }
  ];

  const navItems = isFundCompany ? fundCompanyNavItems : regularNavItems;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 transition-all duration-300 hover:shadow-lg">
      <div className="text-center mb-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-105 hover:bg-blue-50">
          <span className="text-xl md:text-2xl font-bold text-gray-600 transition-colors duration-300 hover:text-blue-600">
            {profile?.name?.charAt(0) || profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <h2 className="text-lg md:text-xl font-semibold transition-colors duration-300 hover:text-blue-600">
          {profile?.name || profile?.full_name || user?.first_name || '用户'}
        </h2>
        <p className="text-gray-500 text-sm md:text-base">
          {isFundCompany ? '基金管理员' : `客户编号: ${profile?.customer_number || profile?.id || 'N/A'}`}
        </p>
        {isFundCompany && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2 transition-all duration-300 hover:bg-purple-200">
            基金管理员账户
          </span>
        )}
      </div>
      
      <div className="border-t pt-4 md:pt-6">
        {navItems.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-6 last:mb-0">
            <h3 className="text-sm md:text-base font-semibold mb-3 text-gray-600 uppercase tracking-wide">
              {category.category}
            </h3>
            <ul className="space-y-1">
              {category.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-sm transition-all duration-300 ${
                        isActive 
                          ? 'font-medium bg-blue-50 text-blue-600 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                      style={{
                        transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}