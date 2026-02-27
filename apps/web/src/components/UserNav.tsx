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

  // Regular user nav items
  const regularNavItems = [
    { href: '/user', label: '账户概览' },
    { href: '/user/positions', label: '持仓明细' },
    { href: '/user/transactions', label: '交易记录' },
    { href: '/user/fund-flow', label: '资金流水' },
    { href: '/user/subscribe-apply', label: '申购申请' },
    { href: '/user/redeem-apply', label: '赎回申请' },
    { href: '/user/deposit-guide', label: '入金指导' },
    { href: '/user/withdraw', label: '出金申请' },
    { href: '/user/profile', label: '个人资料' },
    { href: '/user/settings', label: '账户设置' },
  ];

  // Fund company nav items
  const fundCompanyNavItems = [
    { href: '/user/fund-company/products', label: '产品管理' },
    { href: '/user/fund-company/chat', label: '客户对话' },
    { href: '/user/fund-company/official-account', label: '公众号管理' },
    { href: '/user/profile', label: '个人资料' },
    { href: '/user/settings', label: '账户设置' },
  ];

  const navItems = isFundCompany ? fundCompanyNavItems : regularNavItems;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-gray-500">
            {profile?.name?.charAt(0) || profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <h2 className="text-xl font-semibold">{profile?.name || profile?.full_name || user?.first_name || '用户'}</h2>
        <p className="text-gray-500">
          {isFundCompany ? '基金管理员' : `客户编号: ${profile?.customer_number || profile?.id || 'N/A'}`}
        </p>
        {isFundCompany && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
            基金管理员账户
          </span>
        )}
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">{isFundCompany ? '基金管理' : '账户管理'}</h3>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === item.href 
                    ? 'font-medium bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}