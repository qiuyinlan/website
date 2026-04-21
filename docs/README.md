# 微习惯系统

一个手机和电脑都能打开的超大字微习惯页面。

## 功能

- 主界面只显示当前微习惯，字号很大
- 点击“完成”后自动跳到下一个
- 支持“跳过”
- 设置页可以新增、停用、删除、排序微习惯
- 默认本地模式可直接使用
- 配好 Supabase 后可登录同步到手机和电脑
- 支持 PWA，可安装到桌面或手机主屏

## 目录结构

- `index.html`: 页面结构
- `styles.css`: 样式
- `app.js`: 业务逻辑
- `config.js`: 前端配置
- `manifest.webmanifest`: PWA 清单
- `sw.js`: service worker
- `supabase/schema.sql`: Supabase 建表脚本

## 直接运行

最简单的方法是用一个静态服务器打开：

```bash
cd /home/xuzichun/website/docs
python3 -m http.server 8080 --bind 127.0.0.1
```

然后访问：

```text
http://127.0.0.1:8080
```

## 本地模式

如果 `config.js` 里的 Supabase 配置为空，页面会自动进入本地模式：

- 习惯列表存在浏览器 `localStorage`
- 可以直接先用
- 手机和电脑不会同步

## 开启同步

1. 去 Supabase 创建项目
2. 在项目里执行 `supabase/schema.sql`
3. 把 `config.js` 改成你的项目配置：

```js
window.APP_CONFIG = {
  appName: "微习惯系统",
  supabaseUrl: "https://你的项目.supabase.co",
  supabaseAnonKey: "你的 anon key",
};
```

4. 手机和电脑都访问这个页面
5. 用同一个邮箱和密码注册/登录
6. 之后习惯和当天完成记录会同步

## 说明

- 目前同步的是：
  - 习惯列表
  - 当天完成情况
- 更复杂的周期、提醒、统计图暂时没有做
- 这个版本优先保证“先能用”
