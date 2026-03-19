import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userMessage, projectsData, workstationsData, modulesData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `你是一个工业视觉方案配置助手。用户会用自然语言描述他们想要填写的表单内容。你需要：

1. 从用户指令中识别目标：是哪个项目（通过项目编号如DB260101匹配）、哪个工位（通过编号如06、名称匹配）、或哪个模块
2. 确定要填写的字段和内容
3. 基于项目上下文生成专业、合理的填写内容

当前系统中的数据：
项目列表: ${JSON.stringify(projectsData || [])}
工位列表: ${JSON.stringify(workstationsData || [])}
模块列表: ${JSON.stringify(modulesData || [])}

用户指令: "${userMessage}"

请分析用户意图，找到目标实体，并生成要填写的字段值。

字段映射说明：
- 项目字段: code, name, customer, production_line, product_process, responsible, sales_responsible, vision_responsible, cycle_time_target, quality_strategy, spec_version, notes, environment
- 工位字段: code, name, cycleTime, length, width, height, process_stage, observation_target, motion_description, shot_count, action_script, risk_notes, environment_description, notes, acceptance_accuracy, acceptance_cycle_time, acceptance_compatible_sizes
- 模块字段: name, description, detectionObject, workingDistance, fieldOfViewCommon, resolutionPerPixel, exposure, lightMode, lightAngle, communicationMethod, signalDefinition

注意：
- 匹配项目时，用项目的 code 字段（如 DB260101）进行模糊匹配
- 匹配工位时，可以用工位编号（code字段）、工位名称（name字段）、或工位序号（如"06工位"表示第6个工位）
- 如果用户提到"现场环境说明"，对应字段为 environment_description 或 risk_notes
- 生成的内容应该专业、详细、符合工业视觉行业惯例
- 根据项目的实际上下文（客户、工艺、产品等）生成相关内容`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "fill_target_form",
              description: "定位目标实体并填写表单字段",
              parameters: {
                type: "object",
                properties: {
                  targetType: {
                    type: "string",
                    enum: ["project", "workstation", "module"],
                    description: "目标实体类型",
                  },
                  targetId: {
                    type: "string",
                    description: "目标实体的UUID（从提供的数据中匹配）",
                  },
                  targetLabel: {
                    type: "string",
                    description: "目标实体的可读标签，用于显示（如'DB260101项目的06工位'）",
                  },
                  fields: {
                    type: "object",
                    description: "要填写的字段键值对",
                    additionalProperties: { type: "string" },
                  },
                  explanation: {
                    type: "string",
                    description: "简短说明你要做什么，用于在聊天中显示",
                  },
                },
                required: ["targetType", "targetId", "fields", "explanation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "fill_target_form" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求频率过高，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI 服务异常" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI 未能理解指令" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "AI 返回格式异常" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-form-command error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
