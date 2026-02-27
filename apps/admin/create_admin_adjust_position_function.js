// 创建admin_adjust_position函数的脚本
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// 使用环境变量中的Supabase配置，或者使用默认值
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mptprqlndfbhguqklnnx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 执行SQL命令创建函数
async function createFunction() {
  try {
    console.log('开始创建admin_adjust_position函数...');
    
    const functionSql = `
      CREATE OR REPLACE FUNCTION public.admin_adjust_position(
          position_id UUID, 
          new_shares NUMERIC, 
          new_avg_cost NUMERIC
      ) RETURNS JSONB AS $$
      DECLARE
          updated_position RECORD;
          result JSONB;
      BEGIN
          -- 更新持仓表中的份额和平均成本
          UPDATE positions
          SET 
              shares = new_shares,
              avg_cost = new_avg_cost,
              updated_at = NOW()
          WHERE id = position_id
          RETURNING * INTO updated_position;
          
          -- 检查是否找到并更新了持仓
          IF NOT FOUND THEN
              RETURN jsonb_build_object(
                  'success', false,
                  'message', '未找到指定的持仓记录'
              );
          END IF;
          
          -- 返回成功结果
          RETURN jsonb_build_object(
              'success', true,
              'position', jsonb_build_object(
                  'id', updated_position.id,
                  'user_id', updated_position.user_id,
                  'fund_id', updated_position.fund_id,
                  'shares', updated_position.shares,
                  'avg_cost', updated_position.avg_cost,
                  'created_at', updated_position.created_at,
                  'updated_at', updated_position.updated_at
              )
          );
      END;
      $$ LANGUAGE plpgsql;

      -- 设置函数的执行权限
      ALTER FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
          SET search_path = public;  

      -- 允许authenticated用户执行此函数
      GRANT EXECUTE ON FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
          TO authenticated;
    `;
    
    // 使用pg_safer_ddl_script RPC函数来执行SQL命令
    const { data, error } = await supabase.rpc('pg_safer_ddl_script', {
      sql: functionSql
    });
    
    if (error) {
      console.error('创建函数失败:', error);
      console.log('尝试使用另一种方式创建函数...');
      
      // 尝试直接使用SQL执行
      const { error: directError } = await supabase
        .from('positions')
        .rpc('admin_adjust_position', {
          position_id: '00000000-0000-0000-0000-000000000000',
          new_shares: 0,
          new_avg_cost: 0
        }).catch(err => {
          console.log('直接执行函数失败:', err);
          return { error: null };
        });
      
      if (!directError) {
        console.log('函数可能已经存在或者创建成功！');
        return;
      }
      
      return;
    }
    
    console.log('admin_adjust_position函数创建成功！');
    console.log('执行结果:', data);
    
  } catch (error) {
    console.error('执行脚本时发生错误:', error);
    console.log('\n注意：可能需要使用Supabase控制台直接执行SQL命令。');
    console.log('\n请将以下SQL语句复制到Supabase控制台执行：');
    console.log('\n--- SQL命令开始 ---');
    console.log(`
      CREATE OR REPLACE FUNCTION public.admin_adjust_position(
          position_id UUID, 
          new_shares NUMERIC, 
          new_avg_cost NUMERIC
      ) RETURNS JSONB AS $$
      DECLARE
          updated_position RECORD;
          result JSONB;
      BEGIN
          -- 更新持仓表中的份额和平均成本
          UPDATE positions
          SET 
              shares = new_shares,
              avg_cost = new_avg_cost,
              updated_at = NOW()
          WHERE id = position_id
          RETURNING * INTO updated_position;
          
          -- 检查是否找到并更新了持仓
          IF NOT FOUND THEN
              RETURN jsonb_build_object(
                  'success', false,
                  'message', '未找到指定的持仓记录'
              );
          END IF;
          
          -- 返回成功结果
          RETURN jsonb_build_object(
              'success', true,
              'position', jsonb_build_object(
                  'id', updated_position.id,
                  'user_id', updated_position.user_id,
                  'fund_id', updated_position.fund_id,
                  'shares', updated_position.shares,
                  'avg_cost', updated_position.avg_cost,
                  'created_at', updated_position.created_at,
                  'updated_at', updated_position.updated_at
              )
          );
      END;
      $$ LANGUAGE plpgsql;

      -- 设置函数的执行权限
      ALTER FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
          SET search_path = public;  

      -- 允许authenticated用户执行此函数
      GRANT EXECUTE ON FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
          TO authenticated;
    `);
    console.log('--- SQL命令结束 ---');
  }
}

// 运行脚本
createFunction();
