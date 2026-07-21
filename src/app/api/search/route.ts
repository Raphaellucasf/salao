import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';

// =====================================================
// API DE BUSCA INTELIGENTE DE SERVIÇOS
// Busca por nome, descrição e keywords/apelidos
// =====================================================

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q'); // Termo de busca
    const category = searchParams.get('category');
    const supabase = createServerSupabase(authResult.unitId);

    if (query && query.trim().length > 80) {
      return NextResponse.json({ error: 'Termo de busca muito longo' }, { status: 400 });
    }

    if (!query || query.trim().length < 2) {
      // Se não tem busca, retorna todos os serviços ativos
      let servicesQuery = supabase
        .from('servicos')
        .select('*')
        .eq('unit_id', authResult.unitId)
        .eq('ativo', true)
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true });

      if (category) servicesQuery = servicesQuery.eq('categoria', category);

      const { data, error } = await servicesQuery;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ services: data, search_term: null });
    }

    // =====================================================
    // BUSCA INTELIGENTE COM MÚLTIPLAS ESTRATÉGIAS
    // =====================================================
    const searchTerm = query.trim().toLowerCase();

    // Consultas independentes são executadas em paralelo. Não interpolamos texto
    // do usuário em filtros PostgREST compostos.
    let exactQuery = supabase
      .from('servicos')
      .select('*')
      .eq('unit_id', authResult.unitId)
      .eq('ativo', true)
      .ilike('nome', `%${searchTerm}%`);

    if (category) exactQuery = exactQuery.eq('categoria', category);

    let keywordsQuery = supabase
      .from('servicos')
      .select('*')
      .eq('unit_id', authResult.unitId)
      .eq('ativo', true)
      .contains('termos_busca', [searchTerm]);

    if (category) keywordsQuery = keywordsQuery.eq('categoria', category);

    let descriptionQuery = supabase
      .from('servicos')
      .select('*')
      .eq('unit_id', authResult.unitId)
      .eq('ativo', true)
      .ilike('descricao', `%${searchTerm}%`);

    if (category) descriptionQuery = descriptionQuery.eq('categoria', category);

    const [exactResult, keywordResult, descriptionResult] = await Promise.all([
      exactQuery,
      keywordsQuery,
      descriptionQuery,
    ]);
    const queryError = exactResult.error || keywordResult.error || descriptionResult.error;
    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }
    const exactMatches = exactResult.data ?? [];
    const keywordMatches = keywordResult.data ?? [];
    const descriptionMatches = descriptionResult.data ?? [];

    // =====================================================
    // COMBINAR E REMOVER DUPLICATAS
    // =====================================================
    const allResults = [
      ...(exactMatches || []),
      ...(keywordMatches || []),
      ...(descriptionMatches || []),
    ];

    // Remover duplicatas por ID e calcular score
    const uniqueResults = Array.from(
      new Map(
        allResults.map(service => {
          // Calcular score de relevância
          let score = 0;
          
          // Nome exato = alta prioridade
          if (service.nome?.toLowerCase().includes(searchTerm)) {
            score += 100;
          }
          
          // Keyword exata
          if (service.termos_busca && Array.isArray(service.termos_busca)) {
            if (service.termos_busca.includes(searchTerm)) {
              score += 80;
            }
            // Keyword parcial
            if (service.termos_busca.some((kw: string) => kw.includes(searchTerm))) {
              score += 50;
            }
          }
          
          // Descrição
          if (service.descricao?.toLowerCase().includes(searchTerm)) {
            score += 30;
          }
          
          // Categoria
          if (service.categoria?.toLowerCase().includes(searchTerm)) {
            score += 20;
          }

          return [service.id, { ...service, relevance_score: score }];
        })
      ).values()
    );

    // Ordenar por relevância
    const sortedResults = uniqueResults.sort((a, b) => {
      // Primeiro por score
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      // Depois por preço (mais barato primeiro)
      return Number(a.preco || 0) - Number(b.preco || 0);
    });

    // =====================================================
    // SUGESTÕES INTELIGENTES
    // =====================================================
    const suggestions = [];

    // Se busca por "brancos", sugerir "coloração"
    if (searchTerm.includes('branco') || searchTerm.includes('raiz')) {
      suggestions.push({
        term: 'coloração',
        reason: 'Cobrir brancos geralmente requer coloração'
      });
    }

    // Se busca por "liso", sugerir "progressiva"
    if (searchTerm.includes('liso') || searchTerm.includes('alisar')) {
      suggestions.push({
        term: 'progressiva',
        reason: 'Para alisar o cabelo'
      });
    }

    // Se busca por "clarear", sugerir "luzes"
    if (searchTerm.includes('clarear') || searchTerm.includes('loiro')) {
      suggestions.push({
        term: 'luzes',
        reason: 'Para clarear o cabelo'
      });
    }

    // =====================================================
    // ESTATÍSTICAS DA BUSCA
    // =====================================================
    const stats = {
      total_results: sortedResults.length,
      exact_matches: exactMatches?.length || 0,
      keyword_matches: keywordMatches?.length || 0,
      description_matches: descriptionMatches.length,
    };

    return NextResponse.json({
      services: sortedResults,
      search_term: searchTerm,
      suggestions: suggestions.length > 0 ? suggestions : null,
      stats
    });

  } catch {
    return NextResponse.json(
      { error: 'Erro na busca' },
      { status: 500 }
    );
  }
}

// =====================================================
// EXEMPLOS DE USO
// =====================================================
/*
1. Busca simples:
   GET /api/search?q=coloração

2. Busca por apelido:
   GET /api/search?q=tingir
   -> Encontra "Coloração" porque tem a keyword "tingir"

3. Busca com categoria:
   GET /api/search?q=cabelo&category=Química

4. Listar todos por categoria:
   GET /api/search?category=MegaHair

KEYWORDS SUGERIDAS PARA CADA SERVIÇO:

Coloração:
["tingir", "pintar", "cobrir brancos", "fazer raiz", "mudar cor", "retoque"]

Luzes:
["mechas", "californianas", "ombre", "clarear", "descolorir", "loiro"]

Progressiva:
["alisar", "escovar", "liso", "frizz", "escova definitiva"]

MegaHair:
["alongar", "aplique", "fibra", "tic tac", "fita", "nano"]

Corte:
["cortar", "aparar", "franja", "repicado", "chanel"]
*/
