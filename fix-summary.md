# 邀请码管理功能修复总结

## 已修复的问题

### 1. 新用户注册时邀请码状态更新错误
**错误信息**：`Error updating invitation code status: {code: PGRST204, details: null, hint: null, message: Could not find the 'used_at' column of 'invite_codes' in the schema cache}`

**修复方法**：在 `apps/mobile/src/api/auth/register.ts` 中移除了对不存在的 `used_at` 列的更新，仅保留 `status` 和 `used_by` 字段。

### 2. 获取已使用邀请码失败错误
**错误信息**：`获取已使用邀请码失败: {code: PGRST201, details: Array(3), hint: Try changing 'users' to one of the following: 'use…nd the desired relationship in the 'details' key., message: Could not embed because more than one relationship was found for 'invite_codes' and 'users'}`

**修复方法**：
- 在 `apps/mobile/src/api/auth/invitation.ts` 中使用明确的关系别名：
  - `users:used_by(*)` → `used_by_user:users!used_by(*)`
  - `users:users!inner(invite_code)` → `invited_users:users!inner(invite_code)`
  - 更新数据转换逻辑以使用新的别名

- 在 `apps/admin/src/pages/user-center/used-invitation-codes.tsx` 中重构了查询逻辑：
  - 采用两步查询法：先获取所有已使用邀请码，再批量获取相关用户信息
  - 使用映射表进行快速查找和数据转换
  - 避免了复杂的多表关联查询

## 验证结果

- **移动端 API**：通过 `npm run lint` 验证，无错误
- **管理后台**：通过代码重构解决了关系冲突问题，清理了未使用变量

## 核心功能实现

1. ✅ 新用户注册时邀请码有效性验证
2. ✅ 邀请码写入 users 表
3. ✅ 通过邀请码关联邀请人
4. ✅ 已使用邀请码详情页展示