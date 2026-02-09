import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "未授权" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "用户未登录" }, 401);
    }

    const { templateId, templateUrl } = await req.json();

    // Get template file URL
    let fileUrl = templateUrl;
    let templateName = "template";

    if (templateId && !fileUrl) {
      const { data: template, error: dbError } = await supabase
        .from("ppt_templates")
        .select("file_url, name")
        .eq("id", templateId)
        .single();

      if (dbError || !template?.file_url) {
        return json({ error: "模板不存在或未上传文件" }, 404);
      }
      fileUrl = template.file_url;
      templateName = template.name || "template";
    }

    if (!fileUrl) {
      return json({ error: "未提供模板文件" }, 400);
    }

    // Download the PPTX file
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return json({ error: `无法下载模板文件: ${fileResponse.status}` }, 500);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();

    // Use JSZip to decompress
    const JSZip = (await import("npm:jszip@3.10.1")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);

    const styles = await extractStyles(zip);

    return json({
      templateName,
      styles,
    });
  } catch (error) {
    console.error("Extract template styles error:", error);
    return json({ error: `提取错误: ${error.message}` }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ==================== STYLE EXTRACTION ====================

interface ExtractedStyles {
  backgroundType: "solid" | "gradient" | "image" | "none";
  backgroundColor?: string;
  gradientColors?: string[];
  themeColors?: Record<string, string>;
  schemeColorMap?: Record<string, string>;
  titleFont?: string;
  bodyFont?: string;
  titleFontEA?: string;
  bodyFontEA?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  slideWidth?: number;
  slideHeight?: number;
  logo?: { data: string; width?: number; height?: number };
  footer?: { hasPageNumber: boolean; hasDate: boolean; hasFooterText: boolean; footerText?: string };
  layouts?: Array<{ name: string; type: string; placeholders: Array<{ type: string; x: number; y: number; w: number; h: number }> }>;
  masterCount: number;
  layoutCount: number;
}

async function extractStyles(zip: any): Promise<ExtractedStyles> {
  const styles: ExtractedStyles = {
    backgroundType: "none",
    masterCount: 0,
    layoutCount: 0,
  };

  // 1. Parse presentation.xml for slide dimensions
  const presXml = await readZipFile(zip, "ppt/presentation.xml");
  if (presXml) {
    parsePresentation(presXml, styles);
  }

  // 2. Parse theme
  const themeXml = await readZipFile(zip, "ppt/theme/theme1.xml");
  if (themeXml) {
    parseTheme(themeXml, styles);
  }

  // 3. Count masters and layouts
  const masterFiles = Object.keys(zip.files).filter((f: string) =>
    f.match(/^ppt\/slideMasters\/slideMaster\d+\.xml$/)
  );
  const layoutFiles = Object.keys(zip.files).filter((f: string) =>
    f.match(/^ppt\/slideLayouts\/slideLayout\d+\.xml$/)
  );
  styles.masterCount = masterFiles.length;
  styles.layoutCount = layoutFiles.length;

  // 4. Parse first slide master for background
  if (masterFiles.length > 0) {
    const masterXml = await readZipFile(zip, masterFiles[0]);
    if (masterXml) {
      parseBackground(masterXml, styles);
    }
  }

  // 5. Try to extract logo from slide master
  if (masterFiles.length > 0) {
    await extractLogo(zip, masterFiles[0], styles);
  }

  // 6. Parse layouts for info
  const layouts: ExtractedStyles["layouts"] = [];
  for (const layoutFile of layoutFiles.slice(0, 10)) {
    const xml = await readZipFile(zip, layoutFile);
    if (xml) {
      const layout = parseLayout(xml, layoutFile);
      if (layout) layouts.push(layout);
    }
  }
  styles.layouts = layouts;

  return styles;
}

async function readZipFile(zip: any, path: string): Promise<string | null> {
  try {
    const file = zip.file(path);
    if (!file) return null;
    return await file.async("string");
  } catch {
    return null;
  }
}

// ==================== PARSERS ====================

function parsePresentation(xml: string, styles: ExtractedStyles) {
  // <p:sldSz cx="12192000" cy="6858000"/>
  const sldSz = xml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
  if (sldSz) {
    styles.slideWidth = parseInt(sldSz[1]); // EMU
    styles.slideHeight = parseInt(sldSz[2]);
  }
}

function parseTheme(xml: string, styles: ExtractedStyles) {
  // Extract color scheme
  const schemeMap: Record<string, string> = {};
  const colorNames: Record<string, string> = {
    dk1: "text",
    dk2: "text2",
    lt1: "background",
    lt2: "background2",
    accent1: "primary",
    accent2: "secondary",
    accent3: "accent",
    accent4: "accent2",
    accent5: "accent3",
    accent6: "accent4",
    hlink: "hyperlink",
  };

  for (const [schemeKey, themeKey] of Object.entries(colorNames)) {
    // Match patterns like <a:dk1><a:srgbClr val="000000"/></a:dk1>
    // or <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
    const pattern = new RegExp(
      `<a:${schemeKey}>\\s*(?:<a:srgbClr\\s+val="([A-Fa-f0-9]{6})"[^/]*/?>|<a:sysClr[^>]*lastClr="([A-Fa-f0-9]{6})"[^/]*/?>)`,
      "s"
    );
    const match = xml.match(pattern);
    if (match) {
      const color = (match[1] || match[2] || "").toUpperCase();
      if (color) {
        schemeMap[schemeKey] = color;
      }
    }
  }

  // Build themeColors from scheme
  const themeColors: Record<string, string> = {};
  for (const [schemeKey, themeKey] of Object.entries(colorNames)) {
    if (schemeMap[schemeKey]) {
      themeColors[themeKey] = schemeMap[schemeKey];
    }
  }

  if (Object.keys(themeColors).length > 0) {
    styles.themeColors = themeColors;
  }
  if (Object.keys(schemeMap).length > 0) {
    styles.schemeColorMap = schemeMap;
  }

  // Extract fonts
  // Major font (title): <a:majorFont><a:latin typeface="Calibri Light"/>
  const majorLatin = xml.match(/<a:majorFont>[^]*?<a:latin\s+typeface="([^"]+)"/s);
  if (majorLatin) styles.titleFont = majorLatin[1];

  const majorEA = xml.match(/<a:majorFont>[^]*?<a:ea\s+typeface="([^"]+)"/s);
  if (majorEA) styles.titleFontEA = majorEA[1];

  // Minor font (body): <a:minorFont><a:latin typeface="Calibri"/>
  const minorLatin = xml.match(/<a:minorFont>[^]*?<a:latin\s+typeface="([^"]+)"/s);
  if (minorLatin) styles.bodyFont = minorLatin[1];

  const minorEA = xml.match(/<a:minorFont>[^]*?<a:ea\s+typeface="([^"]+)"/s);
  if (minorEA) styles.bodyFontEA = minorEA[1];
}

function parseBackground(xml: string, styles: ExtractedStyles) {
  // Solid fill: <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
  const solidFill = xml.match(/<a:solidFill>\s*<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/);
  if (solidFill) {
    styles.backgroundType = "solid";
    styles.backgroundColor = solidFill[1];
    return;
  }

  // Gradient fill
  const gradientMatch = xml.match(/<a:gradFill>/);
  if (gradientMatch) {
    styles.backgroundType = "gradient";
    const colors: string[] = [];
    const gsMatches = xml.matchAll(/<a:gs\b[^>]*>[\s\S]*?<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/g);
    for (const m of gsMatches) {
      colors.push(m[1]);
    }
    if (colors.length > 0) {
      styles.gradientColors = colors;
    }
    return;
  }

  // Check for scheme color background
  const schemeClr = xml.match(/<a:solidFill>\s*<a:schemeClr\s+val="([^"]+)"/);
  if (schemeClr && styles.schemeColorMap) {
    const resolved = styles.schemeColorMap[schemeClr[1]];
    if (resolved) {
      styles.backgroundType = "solid";
      styles.backgroundColor = resolved;
    }
  }
}

async function extractLogo(zip: any, masterFile: string, styles: ExtractedStyles) {
  try {
    const masterXml = await readZipFile(zip, masterFile);
    if (!masterXml) return;

    // Find relationship IDs for images: r:embed="rId3"
    // Look for small images (likely logos) in the master
    const relsPath = masterFile.replace("slideMasters/", "slideMasters/_rels/") + ".rels";
    const relsXml = await readZipFile(zip, relsPath);
    if (!relsXml) return;

    // Find image relationships
    const imgRels = [...relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]*\.(png|jpg|jpeg|gif|svg))"/gi)];
    if (imgRels.length === 0) return;

    // Try the first image as logo
    for (const rel of imgRels.slice(0, 1)) {
      let imgPath = rel[2];
      // Resolve relative path
      if (imgPath.startsWith("../")) {
        imgPath = "ppt/" + imgPath.replace("../", "");
      } else if (!imgPath.startsWith("ppt/")) {
        imgPath = "ppt/slideMasters/" + imgPath;
      }

      const imgFile = zip.file(imgPath);
      if (imgFile) {
        const imgData = await imgFile.async("base64");
        const ext = rel[3].toLowerCase();
        const mimeType = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
        styles.logo = {
          data: `data:${mimeType};base64,${imgData}`,
        };
        break;
      }
    }
  } catch (e) {
    console.warn("Logo extraction failed:", e);
  }
}

function parseLayout(xml: string, filePath: string): { name: string; type: string; placeholders: Array<{ type: string; x: number; y: number; w: number; h: number }> } | null {
  // Extract layout name
  const nameMatch = xml.match(/<p:cSld\s+name="([^"]*)"/);
  const name = nameMatch ? nameMatch[1] : filePath.split("/").pop()?.replace(".xml", "") || "unknown";

  // Determine layout type from name
  let type = "content";
  const nameLower = name.toLowerCase();
  if (nameLower.includes("title") && nameLower.includes("slide")) type = "title";
  else if (nameLower.includes("blank")) type = "blank";
  else if (nameLower.includes("section")) type = "section";
  else if (nameLower.includes("two")) type = "two-content";

  // Extract placeholders
  const placeholders: Array<{ type: string; x: number; y: number; w: number; h: number }> = [];
  const phMatches = [...xml.matchAll(/<p:sp>[\s\S]*?<p:ph([^/]*)\/>[\s\S]*?<a:off\s+x="(\d+)"\s+y="(\d+)"[\s\S]*?<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/g)];

  for (const m of phMatches) {
    const typeMatch = m[1].match(/type="([^"]*)"/);
    const phType = typeMatch ? typeMatch[1] : "body";
    const EMU_TO_INCHES = 914400;
    placeholders.push({
      type: phType,
      x: parseInt(m[2]) / EMU_TO_INCHES,
      y: parseInt(m[3]) / EMU_TO_INCHES,
      w: parseInt(m[4]) / EMU_TO_INCHES,
      h: parseInt(m[5]) / EMU_TO_INCHES,
    });
  }

  return { name, type, placeholders };
}
