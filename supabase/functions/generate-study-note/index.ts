import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookId, bookName, chapter, verse } = await req.json()

    if (!bookId || !bookName || !chapter || !verse) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: verseData } = await supabase
      .from('bible_verses')
      .select('text')
      .eq('book_id', bookId)
      .eq('chapter', chapter)
      .eq('verse_number', verse)
      .single()

    const verseText = verseData?.text || ''

    const { data: contextVerses } = await supabase
      .from('bible_verses')
      .select('verse_number, text')
      .eq('book_id', bookId)
      .eq('chapter', chapter)
      .gte('verse_number', Math.max(1, verse - 2))
      .lte('verse_number', verse + 2)
      .order('verse_number')

    const contextText = contextVerses
      ?.map((v: any) => `${v.verse_number}. ${v.text}`)
      .join('\n') || verseText

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const otBooks = ['gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr','ed','ne','et','jo','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl','am','ob','jn','mq','na','hc','sf','ag','zc','ml']
    const isOT = otBooks.includes(bookId)

    const prompt = `Você é um teólogo evangélico reformado com profundo conhecimento dos autores clássicos em domínio público e da Scofield Reference Bible (edição revisada de 1917).

Gere notas de estudo para o versículo abaixo seguindo EXATAMENTE as regras.

Livro: ${bookName}
Capítulo: ${chapter}
Versículo: ${verse}
Texto: "${verseText}"
Testamento: ${isOT ? 'Antigo Testamento' : 'Novo Testamento'}

Contexto (versículos ao redor):
${contextText}

BASE TEOLÓGICA:
- Núcleo (70%): João Calvino, Matthew Henry, Puritanos (John Owen, Thomas Watson, Richard Baxter), Martinho Lutero
- Complemento (20%): Pais da Igreja (Agostinho, Crisóstomo, Atanásio — com filtro reformado), John Wesley
- Aplicação (10%): Charles Finney, R. A. Torrey

REGRAS:
- Cada nota deve usar no máximo 3 autores
- Linguagem clara, moderna e edificante
- Fidelidade total ao texto bíblico
- Evitar viés católico ou sacramental
- Parafrasear ideias (não copiar textos)
- Não usar autores contemporâneos
- Consistência doutrinária reformada com aplicação espiritual

Responda EXATAMENTE no formato JSON abaixo, sem texto fora do JSON, sem markdown, sem backticks:
{"explicacao":"<Explicação direta e objetiva do versículo, máximo 4 linhas. Baseada nos autores do núcleo principal>","aplicacao":"<Aplicação prática espiritual, máximo 2 linhas. Comece com verbo de ação>","autores":"<Lista dos autores usados nesta nota, separados por vírgula, máximo 3>","scofield":"<Nota traduzida da Scofield Reference Bible 1917 para português brasileiro. Inclua: dispensação, referências cruzadas, tipos/figuras, contexto profético. 2-3 parágrafos. Se não houver nota relevante, escreva null>","insight":"<Insight teológico breve, máximo 2 linhas. Pode ser omitido se não houver insight relevante, nesse caso escreva null>"}

Instruções finais:
- Escreva TUDO em português brasileiro
- Não repita o texto do versículo
- Tom reverente mas acessível
- Não use emojis, asteriscos ou markdown
- Para Scofield: traduza fielmente o estilo e conteúdo da edição 1917. Mantenha referências no formato "Livro Capítulo:Versículo"
- Responda SOMENTE o JSON, nada mais`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI API error:', errText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate note' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await response.json()
    const rawContent = aiData.choices?.[0]?.message?.content || ''

    let sections = null
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        sections = JSON.parse(jsonMatch[0])
        // Clean null strings
        for (const key of Object.keys(sections)) {
          if (sections[key] === 'null' || sections[key] === null) {
            delete sections[key]
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse AI JSON, returning raw:', e)
    }

    return new Response(
      JSON.stringify({ note: rawContent, sections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
