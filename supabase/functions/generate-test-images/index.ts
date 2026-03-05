import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Color constants - white background, navy accents, bright cyan for shooting lines
const C = {
  bg: '#FFFFFF',
  navy: '#003D7A',
  navyLight: '#4A90D9',
  cyan: '#22d3ee',       // bright cyan for shooting direction lines
  orange: '#F5A623',
  green: '#10B981',
  greenBg: '#ECFDF5',
  gray: '#333333',
  grayLight: '#666666',
  gridLine: '#E6E6E6',
  red: '#DC2626',
  border: '#D1D5DB',
};

function generateFrontView(wsName: string, wsCode: string, wsType: string, moduleType: string): string {
  const title = `${wsCode} 正视图`;
  const cameraY = 60;
  const lightY = 220;
  const productY = 400;
  const cameraX = 400;
  const lightPositions = wsType === 'turntable'
    ? [{ x: 200, angle: 30 }, { x: 600, angle: -30 }]
    : [{ x: 250, angle: 45 }, { x: 550, angle: -45 }];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${C.bg}"/>
  <!-- Grid -->
  ${[100,200,300,400,500].map(y=>`<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="${C.gridLine}" stroke-width="0.5"/>`).join('')}
  ${[100,200,300,400,500,600,700].map(x=>`<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="${C.gridLine}" stroke-width="0.5"/>`).join('')}

  <text x="400" y="35" fill="${C.navy}" font-size="18" font-family="Arial" text-anchor="middle" font-weight="bold">${title}</text>
  <text x="400" y="55" fill="${C.grayLight}" font-size="12" font-family="Arial" text-anchor="middle">${wsName} | ${moduleType}</text>

  <!-- Camera at top -->
  <rect x="${cameraX-40}" y="${cameraY}" width="80" height="50" rx="4" fill="${C.navy}" stroke="${C.navy}" stroke-width="2"/>
  <text x="${cameraX}" y="${cameraY+30}" fill="#FFFFFF" font-size="11" font-family="Arial" text-anchor="middle">相机</text>
  <circle cx="${cameraX}" cy="${cameraY+50}" r="15" fill="${C.bg}" stroke="${C.navy}" stroke-width="2"/>

  <!-- Lens -->
  <rect x="${cameraX-12}" y="${cameraY+50}" width="24" height="30" rx="2" fill="${C.bg}" stroke="${C.navy}" stroke-width="1.5"/>
  <text x="${cameraX}" y="${cameraY+100}" fill="${C.gray}" font-size="10" font-family="Arial" text-anchor="middle">镜头</text>

  <!-- Shooting direction lines - bright cyan -->
  <line x1="${cameraX}" y1="${cameraY+80}" x2="${cameraX-80}" y2="${productY}" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="8,4" opacity="0.85"/>
  <line x1="${cameraX}" y1="${cameraY+80}" x2="${cameraX+80}" y2="${productY}" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="8,4" opacity="0.85"/>
  <line x1="${cameraX}" y1="${cameraY+80}" x2="${cameraX}" y2="${productY}" stroke="${C.cyan}" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.6"/>

  <!-- Light sources -->
  ${lightPositions.map((lp, i) => `
  <polygon points="${lp.x},${lightY} ${lp.x-25},${lightY+40} ${lp.x+25},${lightY+40}" fill="${C.orange}" stroke="${C.orange}" stroke-width="1.5" opacity="0.8"/>
  <text x="${lp.x}" y="${lightY+18}" fill="#FFFFFF" font-size="9" font-family="Arial" text-anchor="middle">L${i+1}</text>
  <line x1="${lp.x}" y1="${lightY+40}" x2="${cameraX}" y2="${productY}" stroke="${C.orange}" stroke-width="1" stroke-dasharray="5,5" opacity="0.4"/>
  `).join('')}

  <!-- Product -->
  <rect x="280" y="${productY}" width="240" height="60" rx="3" fill="${C.greenBg}" stroke="${C.green}" stroke-width="2"/>
  <text x="400" y="${productY+35}" fill="${C.green}" font-size="13" font-family="Arial" text-anchor="middle">待测件</text>

  <!-- Base -->
  <rect x="180" y="${productY+70}" width="440" height="20" rx="2" fill="${C.bg}" stroke="${C.border}" stroke-width="1.5"/>
  <text x="400" y="${productY+85}" fill="${C.grayLight}" font-size="10" font-family="Arial" text-anchor="middle">${wsType === 'turntable' ? '旋转台' : wsType === 'platform' ? '检测平台' : wsType === 'robot' ? '机器人臂' : '传送带'}</text>

  <!-- Axes -->
  <line x1="50" y1="550" x2="150" y2="550" stroke="${C.red}" stroke-width="2" marker-end="url(#arrowR)"/>
  <line x1="50" y1="550" x2="50" y2="470" stroke="${C.green}" stroke-width="2" marker-end="url(#arrowG)"/>
  <text x="155" y="555" fill="${C.red}" font-size="12" font-family="Arial">X</text>
  <text x="42" y="465" fill="${C.green}" font-size="12" font-family="Arial">Y</text>

  <!-- Dimension -->
  <line x1="280" y1="${productY+100}" x2="520" y2="${productY+100}" stroke="${C.grayLight}" stroke-width="1"/>
  <text x="400" y="${productY+115}" fill="${C.grayLight}" font-size="10" font-family="Arial" text-anchor="middle">240mm</text>

  <defs>
    <marker id="arrowR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="${C.red}"/></marker>
    <marker id="arrowG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="${C.green}"/></marker>
  </defs>
</svg>`;
}

function generateSideView(wsName: string, wsCode: string, wsType: string, moduleType: string): string {
  const title = `${wsCode} 侧视图`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${C.bg}"/>
  ${[100,200,300,400,500].map(y=>`<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="${C.gridLine}" stroke-width="0.5"/>`).join('')}

  <text x="400" y="35" fill="${C.navy}" font-size="18" font-family="Arial" text-anchor="middle" font-weight="bold">${title}</text>
  <text x="400" y="55" fill="${C.grayLight}" font-size="12" font-family="Arial" text-anchor="middle">${wsName} | ${moduleType}</text>

  <!-- Support column -->
  <rect x="380" y="60" width="40" height="320" rx="3" fill="${C.bg}" stroke="${C.border}" stroke-width="1.5"/>

  <!-- Camera at top -->
  <rect x="360" y="60" width="80" height="45" rx="4" fill="${C.navy}" stroke="${C.navy}" stroke-width="2"/>
  <text x="400" y="87" fill="#FFFFFF" font-size="11" font-family="Arial" text-anchor="middle">相机</text>
  <rect x="388" y="105" width="24" height="25" rx="2" fill="${C.bg}" stroke="${C.navy}" stroke-width="1.5"/>

  <!-- Shooting direction - bright cyan -->
  <line x1="400" y1="130" x2="400" y2="380" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="8,4" opacity="0.85"/>
  <line x1="400" y1="130" x2="340" y2="380" stroke="${C.cyan}" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.6"/>
  <line x1="400" y1="130" x2="460" y2="380" stroke="${C.cyan}" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.6"/>

  <!-- Working distance -->
  <line x1="470" y1="130" x2="470" y2="380" stroke="${C.orange}" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="490" y="260" fill="${C.orange}" font-size="10" font-family="Arial" transform="rotate(90, 490, 260)">工作距离 300mm</text>

  <!-- Light -->
  <polygon points="250,250 225,290 275,290" fill="${C.orange}" stroke="${C.orange}" stroke-width="1.5" opacity="0.8"/>
  <line x1="250" y1="290" x2="400" y2="380" stroke="${C.orange}" stroke-width="1" stroke-dasharray="5,5" opacity="0.4"/>
  <text x="250" y="310" fill="${C.gray}" font-size="10" font-family="Arial" text-anchor="middle">光源</text>

  <!-- Product -->
  <rect x="300" y="380" width="200" height="50" rx="3" fill="${C.greenBg}" stroke="${C.green}" stroke-width="2"/>
  <text x="400" y="410" fill="${C.green}" font-size="12" font-family="Arial" text-anchor="middle">待测件</text>

  <!-- Base -->
  <rect x="200" y="440" width="400" height="25" rx="2" fill="${C.bg}" stroke="${C.border}" stroke-width="1.5"/>
  ${wsType === 'turntable' ? `<circle cx="400" cy="452" r="8" fill="none" stroke="${C.border}" stroke-width="1.5"/>` : ''}

  <!-- Axes -->
  <line x1="50" y1="550" x2="150" y2="550" stroke="${C.navy}" stroke-width="2"/>
  <line x1="50" y1="550" x2="50" y2="470" stroke="${C.green}" stroke-width="2"/>
  <text x="155" y="555" fill="${C.navy}" font-size="12" font-family="Arial">Z</text>
  <text x="42" y="465" fill="${C.green}" font-size="12" font-family="Arial">Y</text>

  <!-- Height -->
  <line x1="620" y1="60" x2="620" y2="440" stroke="${C.grayLight}" stroke-width="1"/>
  <text x="640" y="250" fill="${C.grayLight}" font-size="10" font-family="Arial" transform="rotate(90,640,250)">设备高度 380mm</text>
</svg>`;
}

function generateTopView(wsName: string, wsCode: string, wsType: string, moduleType: string): string {
  const title = `${wsCode} 俯视图`;
  const conveyorSvg = wsType === 'turntable'
    ? `<circle cx="400" cy="350" r="120" fill="none" stroke="${C.border}" stroke-width="2" stroke-dasharray="8,4"/>
       <circle cx="400" cy="350" r="20" fill="${C.bg}" stroke="${C.border}" stroke-width="1.5"/>
       <text x="400" y="355" fill="${C.grayLight}" font-size="9" font-family="Arial" text-anchor="middle">旋转轴</text>`
    : wsType === 'robot'
    ? `<circle cx="400" cy="350" r="100" fill="none" stroke="${C.border}" stroke-width="1.5" stroke-dasharray="6,4"/>
       <line x1="400" y1="350" x2="480" y2="280" stroke="${C.border}" stroke-width="3"/>
       <circle cx="480" cy="280" r="8" fill="${C.bg}" stroke="${C.border}" stroke-width="1.5"/>`
    : `<rect x="180" y="300" width="440" height="100" rx="3" fill="none" stroke="${C.border}" stroke-width="1.5" stroke-dasharray="6,4"/>
       <line x1="180" y1="350" x2="620" y2="350" stroke="${C.gridLine}" stroke-width="1" stroke-dasharray="3,3"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${C.bg}"/>
  ${[100,200,300,400,500].map(y=>`<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="${C.gridLine}" stroke-width="0.5"/>`).join('')}

  <text x="400" y="35" fill="${C.navy}" font-size="18" font-family="Arial" text-anchor="middle" font-weight="bold">${title}</text>
  <text x="400" y="55" fill="${C.grayLight}" font-size="12" font-family="Arial" text-anchor="middle">${wsName} | ${moduleType}</text>

  ${conveyorSvg}

  <!-- Product -->
  <rect x="350" y="320" width="100" height="60" rx="3" fill="${C.greenBg}" stroke="${C.green}" stroke-width="2"/>
  <text x="400" y="355" fill="${C.green}" font-size="11" font-family="Arial" text-anchor="middle">待测件</text>

  <!-- FOV - bright cyan -->
  <circle cx="400" cy="350" r="70" fill="${C.cyan}" fill-opacity="0.08" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="6,3"/>
  <circle cx="400" cy="350" r="5" fill="${C.navy}"/>
  <text x="400" y="290" fill="${C.cyan}" font-size="10" font-family="Arial" text-anchor="middle" font-weight="bold">相机视野 FOV</text>

  <!-- Lights -->
  <circle cx="250" cy="350" r="18" fill="${C.orange}" stroke="${C.orange}" stroke-width="1.5" opacity="0.8"/>
  <text x="250" y="355" fill="#FFFFFF" font-size="9" font-family="Arial" text-anchor="middle">L1</text>
  <circle cx="550" cy="350" r="18" fill="${C.orange}" stroke="${C.orange}" stroke-width="1.5" opacity="0.8"/>
  <text x="550" y="355" fill="#FFFFFF" font-size="9" font-family="Arial" text-anchor="middle">L2</text>

  <!-- Axes -->
  <line x1="50" y1="550" x2="150" y2="550" stroke="${C.red}" stroke-width="2"/>
  <line x1="50" y1="550" x2="50" y2="470" stroke="${C.navy}" stroke-width="2"/>
  <text x="155" y="555" fill="${C.red}" font-size="12" font-family="Arial">X</text>
  <text x="42" y="465" fill="${C.navy}" font-size="12" font-family="Arial">Z</text>

  <line x1="180" y1="500" x2="620" y2="500" stroke="${C.grayLight}" stroke-width="1"/>
  <text x="400" y="520" fill="${C.grayLight}" font-size="10" font-family="Arial" text-anchor="middle">工位宽度 440mm</text>
</svg>`;
}

function generateSchematic(moduleName: string, moduleType: string, wsCode: string): string {
  const typeLabels: Record<string, string> = {
    positioning: '定位引导', defect: '缺陷检测', ocr: '字符识别',
    measurement: '尺寸测量', deeplearning: '深度学习',
  };
  const label = typeLabels[moduleType] || moduleType;
  const typeColors: Record<string, string> = {
    positioning: '#003D7A', defect: '#DC2626', ocr: '#7C3AED',
    measurement: '#F5A623', deeplearning: '#10B981',
  };
  const color = typeColors[moduleType] || '#003D7A';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${C.bg}"/>
  ${[100,200,300,400,500].map(y=>`<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="${C.gridLine}" stroke-width="0.5"/>`).join('')}
  ${[100,200,300,400,500,600,700].map(x=>`<line x1="${x}" y1="0" x2="${x}" y2="600" stroke="${C.gridLine}" stroke-width="0.5"/>`).join('')}

  <text x="400" y="35" fill="${C.navy}" font-size="18" font-family="Arial" text-anchor="middle" font-weight="bold">${wsCode} 光学方案</text>
  <text x="400" y="55" fill="${C.grayLight}" font-size="13" font-family="Arial" text-anchor="middle">${moduleName} — ${label}</text>

  <!-- Camera + Lens -->
  <rect x="340" y="80" width="120" height="55" rx="5" fill="${C.navy}" stroke="${C.navy}" stroke-width="2"/>
  <text x="400" y="112" fill="#FFFFFF" font-size="13" font-family="Arial" text-anchor="middle">工业相机</text>
  <rect x="375" y="135" width="50" height="35" rx="3" fill="${C.bg}" stroke="${C.navy}" stroke-width="1.5"/>
  <text x="400" y="158" fill="${C.navy}" font-size="10" font-family="Arial" text-anchor="middle">镜头</text>

  <!-- FOV cone - bright cyan -->
  <polygon points="400,170 280,380 520,380" fill="${C.cyan}" fill-opacity="0.06" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="8,4"/>
  <text x="400" y="300" fill="${C.cyan}" font-size="12" font-family="Arial" text-anchor="middle" opacity="0.7" font-weight="bold">视野范围</text>

  <!-- Left light -->
  <rect x="120" y="200" width="60" height="40" rx="4" fill="${C.orange}" stroke="${C.orange}" stroke-width="1.5" opacity="0.85"/>
  <text x="150" y="225" fill="#FFFFFF" font-size="10" font-family="Arial" text-anchor="middle">光源</text>
  <line x1="180" y1="230" x2="350" y2="400" stroke="${C.orange}" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.5"/>

  <!-- Right light -->
  <rect x="620" y="200" width="60" height="40" rx="4" fill="${C.orange}" stroke="${C.orange}" stroke-width="1.5" opacity="0.85"/>
  <text x="650" y="225" fill="#FFFFFF" font-size="10" font-family="Arial" text-anchor="middle">光源</text>
  <line x1="620" y1="230" x2="450" y2="400" stroke="${C.orange}" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.5"/>

  <!-- Product -->
  <rect x="280" y="380" width="240" height="60" rx="4" fill="${C.greenBg}" stroke="${C.green}" stroke-width="2"/>
  <text x="400" y="415" fill="${C.green}" font-size="13" font-family="Arial" text-anchor="middle">待测件</text>

  <!-- Detection badge -->
  <rect x="300" y="470" width="200" height="35" rx="18" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="1.5"/>
  <text x="400" y="493" fill="${color}" font-size="14" font-family="Arial" text-anchor="middle" font-weight="bold">检测类型: ${label}</text>

  <!-- Parameters -->
  <text x="50" y="540" fill="${C.gray}" font-size="11" font-family="Arial">工作距离: 300mm</text>
  <text x="250" y="540" fill="${C.gray}" font-size="11" font-family="Arial">视野: 50×40mm</text>
  <text x="450" y="540" fill="${C.gray}" font-size="11" font-family="Arial">分辨率: 0.025mm/px</text>
  <text x="650" y="540" fill="${C.gray}" font-size="11" font-family="Arial">帧率: 60fps</text>

  <!-- Controller -->
  <rect x="620" y="380" width="120" height="60" rx="4" fill="${C.bg}" stroke="${C.border}" stroke-width="1.5"/>
  <text x="680" y="405" fill="${C.gray}" font-size="10" font-family="Arial" text-anchor="middle">工控机</text>
  <text x="680" y="420" fill="${C.grayLight}" font-size="9" font-family="Arial" text-anchor="middle">GPU加速</text>
  <line x1="460" y1="107" x2="620" y2="400" stroke="${C.border}" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
</svg>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { project_code } = await req.json();
    if (!project_code) {
      return new Response(JSON.stringify({ error: 'project_code required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: project, error: pErr } = await supabase.from('projects').select('id').eq('code', project_code).single();
    if (pErr || !project) {
      return new Response(JSON.stringify({ error: 'Project not found', detail: pErr }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: workstations } = await supabase.from('workstations').select('id, name, code, type').eq('project_id', project.id).order('code');
    if (!workstations?.length) {
      return new Response(JSON.stringify({ error: 'No workstations found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: any[] = [];

    for (const ws of workstations) {
      const { data: layouts } = await supabase.from('mechanical_layouts').select('id').eq('workstation_id', ws.id);
      const { data: modules } = await supabase.from('function_modules').select('id, name, type').eq('workstation_id', ws.id);

      const layout = layouts?.[0];
      const module = modules?.[0];

      if (layout) {
        const views = [
          { key: 'front', svg: generateFrontView(ws.name, ws.code, ws.type, module?.type || 'unknown') },
          { key: 'side', svg: generateSideView(ws.name, ws.code, ws.type, module?.type || 'unknown') },
          { key: 'top', svg: generateTopView(ws.name, ws.code, ws.type, module?.type || 'unknown') },
        ];

        const updateData: Record<string, any> = {};
        for (const view of views) {
          const filePath = `${layout.id}/${ws.code}_${view.key}_view.svg`;
          const svgBlob = new Blob([view.svg], { type: 'image/svg+xml' });
          const { error: uploadErr } = await supabase.storage
            .from('workstation-views')
            .upload(filePath, svgBlob, { contentType: 'image/svg+xml', upsert: true });
          if (uploadErr) { console.error(`Upload error for ${filePath}:`, uploadErr); continue; }
          const { data: urlData } = supabase.storage.from('workstation-views').getPublicUrl(filePath);
          updateData[`${view.key}_view_image_url`] = urlData.publicUrl;
          updateData[`${view.key}_view_saved`] = true;
        }

        const { error: updateErr } = await supabase.from('mechanical_layouts').update(updateData).eq('id', layout.id);
        results.push({ ws: ws.code, layout: layout.id, views: Object.keys(updateData).length / 2, error: updateErr?.message });
      }

      if (module) {
        const schematicSvg = generateSchematic(module.name, module.type, ws.code);
        const filePath = `${module.id}/${ws.code}_${module.type}_schematic.svg`;
        const svgBlob = new Blob([schematicSvg], { type: 'image/svg+xml' });
        const { error: uploadErr } = await supabase.storage
          .from('module-schematics')
          .upload(filePath, svgBlob, { contentType: 'image/svg+xml', upsert: true });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('module-schematics').getPublicUrl(filePath);
          const { error: updateErr } = await supabase.from('function_modules')
            .update({ schematic_image_url: urlData.publicUrl })
            .eq('id', module.id);
          results.push({ ws: ws.code, module: module.id, type: module.type, schematic: true, error: updateErr?.message });
        } else {
          results.push({ ws: ws.code, module: module.id, schematicUploadError: uploadErr.message });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
