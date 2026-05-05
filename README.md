# GX-Sentinel

GX-SENTINEL
├── 📂 backend                 # Python FastAPI 后端核心
│   ├── 📂 agents              # Agentic AI 逻辑层 (基于 LangGraph)
│   │   ├── graph_allocator.py # Module 1: 收入分配 Agent 状态机
│   │   ├── graph_guardian.py  # Module 2: 消费拦截/审计 Agent 状态机
│   │   ├── graph_mentor.py    # Module 4: 财务导师/周报生成 Agent
│   │   ├── state.py           # 
 (TypedDict)
│   │   └── tools.py           # 供 Agent 调用的外部工具
│   ├── 📂 firebase            # Firebase 管理逻辑
│   │   ├── crud.py            # 封装数据库的增删改查 (Create, Read, Update, Delete)
│   │   └── init.py            # Firebase Admin SDK 初始化配置
│   ├── 📂 model               # 数据模型定义
│   │   ├── firestore_models.py # 定义存储在 Firestore 中的文档结构
│   │   └── models.py          # FastAPI 接收/返回的 Pydantic 数据模型 (API Contract)
│   ├── 📂 routers             # API 路由接口 (根据功能模块拆分)
│   │   ├── allocator.py       # Module 1: 处理收入分配相关接口
│   │   ├── chat.py            # Module 4: 处理 AI 聊天与报告接口
│   │   ├── interceptor.py     # Module 2: 核心拦截器 (Sync/Async/Outcome) 接口
│   │   ├── social.py          # Module 5: 社交排行榜与奖励接口
│   │   └── transaction.py     # Module 3: 模拟交易流与手动记录接口
│   ├── 📂 services            # 核心业务引擎 (Resilience 模型计算、Runway 公式等)
│   └── main.py                # 后端入口文件，配置 FastAPI 路由与中间件
│
├── 📂 chrome-extension/src    # Chrome 浏览器扩展程序 (拦截器前端)
│   ├── background.ts          # 扩展 Service Worker，处理跨域请求与状态
│   ├── content-script.ts      # 注入 Shopee/Lazada 页面的脚本，抓取价格并触发拦截
│   └── overlay-ui.ts          # 拦截器 UI 组件 (红色认知摩擦层、理由输入框)
│
├── 📂 frontend                # React Web Dashboard (主控台前端)
│   ├── 📂 src                 # React 源代码
│   └── ...                    # (包含 Gauge 图表、Risk Profile、社交排名等组件)
│
├── .gitignore                 # 忽略文件配置 (禁止上传 .env 或 venv)
└── README.md                  # 项目说明文档