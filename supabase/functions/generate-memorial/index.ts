import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

    // Create client with user's JWT for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for storage access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { vertices, formData, tipoServico } = await req.json();

    if (!vertices || vertices.length < 2) {
      return new Response(JSON.stringify({ error: "Adicione pelo menos 2 vértices" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map service type to template sub_type
    const subTypeMap: Record<string, string> = {
      georref_rural: "Georreferenciamento",
      desmembramento: "Desmembramento",
      usucapiao: "Usucapião",
      levant_urbano: "Georreferenciamento",
      demarcacao: "Desmembramento",
      loteamento: "Desmembramento",
    };
    const targetSubType = subTypeMap[tipoServico] || "Georreferenciamento";

    // Fetch matching template
    const { data: templates } = await supabaseUser
      .from("templates")
      .select("*")
      .eq("category", "memorial")
      .ilike("sub_type", targetSubType)
      .order("created_at", { ascending: false })
      .limit(1);

    let templateContent = "";
    if (templates && templates.length > 0) {
      const template = templates[0];
      // Download the template file from storage
      const { data: fileData, error: fileError } = await supabaseAdmin.storage
        .from("templates")
        .download(template.file_path);

      if (fileData && !fileError) {
        templateContent = await fileData.text();
      }
    }

    // Calculate area and perimeter
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].e * vertices[j].n - vertices[j].e * vertices[i].n;
    }
    area = Math.abs(area) / 2;

    let perim = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      perim += Math.hypot(vertices[j].e - vertices[i].e, vertices[j].n - vertices[i].n);
    }

    // Build azimuth table
    const azimuths = vertices.map((v: any, i: number) => {
      const j = (i + 1) % vertices.length;
      const next = vertices[j];
      let az = Math.atan2(next.e - v.e, next.n - v.n) * (180 / Math.PI);
      az = ((az % 360) + 360) % 360;
      const dist = Math.hypot(next.e - v.e, next.n - v.n);
      return { de: v.label, para: next.label, azimute: az.toFixed(4), distancia: dist.toFixed(3), confrontante: v.cf };
    });

    const verticesTable = vertices
      .map((v: any) => `${v.label}: E=${v.e.toFixed(3)}, N=${v.n.toFixed(3)}, Alt=${v.alt.toFixed(2)}, Tipo=${v.tipo}, Conf=${v.cf}`)
      .join("\n");

    const systemPrompt = `Você é um engenheiro agrimensor especialista em memoriais descritivos para georreferenciamento de imóveis rurais e urbanos no Brasil, seguindo as normas do INCRA, SIGEF e NBR 14166.

Gere um memorial descritivo completo, técnico e formal, usando os dados fornecidos.

${templateContent ? `REGRA OBRIGATÓRIA — SIGA O MODELO DE REFERÊNCIA COM EXATIDÃO:
Você DEVE reproduzir FIELMENTE o modelo de referência abaixo. Copie exatamente:
- A estrutura e ordem das seções (cabeçalho, corpo, encerramento)
- O layout e espaçamento entre parágrafos
- A tipografia: palavras, números e trechos em **negrito** devem permanecer em negrito
- A formatação de coordenadas, azimutes e distâncias (casas decimais, símbolos, unidades)
- O estilo de linguagem, vocabulário técnico e fraseologia
- A pontuação, capitalização e abreviações
- Os títulos e subtítulos exatamente como aparecem no modelo
- A forma de citar confrontantes, marcos e vértices

NÃO invente seções extras. NÃO altere a ordem. NÃO mude o estilo de escrita.
Apenas substitua os dados do modelo pelos dados reais fornecidos pelo usuário.

--- MODELO DE REFERÊNCIA (COPIE O FORMATO EXATO) ---
${templateContent}
--- FIM DO MODELO DE REFERÊNCIA ---` : "Use o formato padrão INCRA/SIGEF para memoriais descritivos."}

O memorial deve incluir:
1. Cabeçalho com dados do imóvel e proprietário
2. Descrição do perímetro com azimutes, distâncias e confrontantes
3. Tabela de coordenadas UTM
4. Encerramento com área total, perímetro e assinatura do RT`;

    const userPrompt = `Gere o memorial descritivo com os seguintes dados:

DADOS DO PROJETO:
- Proprietário: ${formData.prop || "Não informado"}
- Denominação: ${formData.denom || "Não informado"}
- Município: ${formData.mun || "Não informado"}
- UF: ${formData.uf || "Não informado"}
- Fuso UTM: ${formData.fuso || "22S"}
- Matrícula: ${formData.mat || "Não informada"}
- Cartório: ${formData.cart || "Não informado"}
- Responsável Técnico: ${formData.rt || "Não informado"}
- CREA: ${formData.crea || "Não informado"}
- ART: ${formData.art || "Não informada"}
- Data: ${formData.data || "Não informada"}
- Tipo de Serviço: ${tipoServico}

VÉRTICES (${vertices.length}):
${verticesTable}

AZIMUTES E DISTÂNCIAS:
${azimuths.map((a: any) => `${a.de} → ${a.para}: Az=${a.azimute}°, Dist=${a.distancia}m, Confrontante: ${a.confrontante || "N/I"}`).join("\n")}

RESUMO:
- Área: ${area.toFixed(2)} m² (${(area / 10000).toFixed(4)} ha)
- Perímetro: ${perim.toFixed(3)} m
- Total de vértices: ${vertices.length}`;

    // Call Lovable AI Gateway with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error("Erro no serviço de IA");
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-memorial error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
