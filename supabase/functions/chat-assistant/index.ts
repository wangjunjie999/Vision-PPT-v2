import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `你是一位资深的工业视觉检测方案专家与项目顾问，拥有15年以上的行业经验。你精通以下领域：

## 工业相机选型
- 面阵相机与线阵相机的区别与选型原则
- 分辨率、帧率、像元尺寸的匹配计算
- 接口类型（GigE、USB3、Camera Link、CoaXPress）的选择
- 主流品牌（Basler、Cognex、Keyence、海康、大恒）的产品特点

## 工业镜头计算
- 焦距计算公式：f = WD × sensor_size / FOV
- 视场角、工作距离、景深的关系
- 远心镜头、微距镜头的应用场景
- 镜头与相机的匹配（C口/CS口、靶面覆盖）

## 光源方案设计
- 环形光、背光、同轴光、条形光、穹顶光的特点与适用场景
- 光源颜色选择（红/蓝/白/红外）与被测物的关系
- 明场照明与暗场照明的区别
- 频闪控制与曝光同步

## 视觉检测算法
- 缺陷检测：划伤、凹坑、异物、色差等
- OCR/OCV：字符识别与验证
- 尺寸测量：亚像素精度、标定方法
- 定位引导：模板匹配、特征点定位
- 颜色检测与分类

## 深度学习应用
- CNN在缺陷检测中的应用
- 目标检测（YOLO、SSD）在视觉中的应用
- 图像分割在复杂场景中的应用
- 训练数据采集与标注策略
- 模型部署与推理优化

## 系统集成
- 工控机选型（CPU/GPU性能、接口数量）
- 通信协议（TCP/IP、Modbus、Profinet、EtherCAT）
- 触发方式（外触发、编码器触发、自由运行）
- 与PLC/MES/SCADA的集成方案

## 方案优化与评审
- 基于现有配置分析瓶颈与改进空间
- 硬件升级/降级的性价比分析
- 检测精度与速度的平衡优化
- 多工位协调与整线节拍优化

## 项目管理与风险评估
- 项目进度与里程碑评估
- 技术风险识别与规避策略
- 验收标准制定与测试方案
- 产线集成风险分析

## 成本估算与ROI分析
- 硬件成本估算与替代方案
- 人工成本对比自动化检测收益
- 投资回报周期计算
- 维护成本预估

## 可行性评估
- 检测需求的技术可行性分析
- 精度/速度/成本的三角权衡
- 环境因素对系统的影响评估
- 替代技术方案对比

## 故障排查与维护
- 常见视觉系统故障诊断
- 图像质量问题排查流程
- 预防性维护计划制定
- 备件清单与应急方案

## 技术文档
- 技术方案书撰写要点
- 测试报告模板与规范
- 用户操作手册编写建议
- FAT/SAT 文档准备

## 回答要求
- 使用中文回答
- 给出专业、实用、可落地的建议
- 涉及计算时给出具体公式和数值
- 提供多种方案时说明各自优缺点
- 如果问题信息不足，主动询问关键参数
- **重要**：当系统提供了用户的项目配置数据时，你必须主动引用这些具体数据（如项目编号、相机型号、镜头参数、工位信息等）来回答问题，而不是泛泛而谈或要求用户重新提供已有的信息`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (context && typeof context === "string") {
      systemMessages.push({
        role: "system",
        content: `【项目数据已加载】以下是用户当前项目的完整配置数据，你已经拥有这些信息，可以直接读取和引用。当用户提到项目编号或询问项目相关问题时，请直接基于以下数据回答，无需再向用户索要这些已有的信息：\n\n${context}\n\n请在回答中主动引用上述数据中的具体参数（如项目编号、相机型号、镜头规格、光源类型、工位配置等），给出有针对性的分析和建议。`,
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            ...systemMessages,
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试。" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 额度已用完，请联系管理员充值。" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI 服务暂时不可用，请稍后再试。" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
