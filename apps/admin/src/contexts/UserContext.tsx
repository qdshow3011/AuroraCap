import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义用户类型
interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

// 定义上下文类型
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 定义Provider组件属性
interface UserProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

// 创建Provider组件
export const UserProvider: React.FC<UserProviderProps> = ({ children, initialUser }) => {
  const [user, setUser] = useState<User | null>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 创建自定义Hook用于使用上下文
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};