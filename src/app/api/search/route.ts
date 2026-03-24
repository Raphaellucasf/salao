// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// =====================================================
// API DE BUSCA INTELIGENTE DE SERVIÇOS
// Busca por nome, descrição e keywords/apelidos
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q'); // Termo de busca
    const unitId = searchParams.get('unit_id');
    const category = searchParams.get('category');

    if (!query || query.trim().length < 2) {
      // Se não tem busca, retorna todos os serviços ativos
      let servicesQuery = supabase
        .from('servicos')
        .select('*')
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

    // 1. Busca exata no nome (prioridade máxima)
    let exactQuery = supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .ilike('nome', `%${searchTerm}%`);

    if (category) exactQuery = exactQuery.eq('categoria', category);

    const { data: exactMatches } = await exactQuery;

    // 2. Busca nas keywords/tags (JSONB contains)
    let keywordsQuery = supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .contains('keywords', [searchTerm]);

    if (category) keywordsQuery = keywordsQuery.eq('categoria', category);

    const { data: keywordMatches } = await keywordsQuery;

    // 3. Busca nas keywords e descrição
    let fuzzyQuery = supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .or(`keywords.cs.{"%${searchTerm}%"},descricao.ilike.%${searchTerm}%`);

    if (category) fuzzyQuery = fuzzyQuery.eq('categoria', category);

    const { data: fuzzyMatches } = await fuzzyQuery;

    // Sem FTS (search_vector não disponível na nova tabela)
    const ftsMatches: any[] = [];

    // =====================================================
    // COMBINAR E REMOVER DUPLICATAS
    // =====================================================
    const allResults = [
      ...(exactMatches || []),
      ...(keywordMatches || []),
      ...(fuzzyMatches || []),
      ...(ftsMatches || [])
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
          if (service.keywords && Array.isArray(service.keywords)) {
            if (service.keywords.includes(searchTerm)) {
              score += 80;
            }
            // Keyword parcial
            if (service.keywords.some((kw: string) => kw.includes(searchTerm))) {
              score += 50;
            }
          }
          
          // Descrição
          if (service.description?.toLowerCase().includes(searchTerm)) {
            score += 30;
          }
          
          // Categoria
          if (service.category?.toLowerCase().includes(searchTerm)) {
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
      return a.price - b.price;
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
      fuzzy_matches: fuzzyMatches?.length || 0,
      fts_matches: ftsMatches?.length || 0
    };

    return NextResponse.json({
      services: sortedResults,
      search_term: searchTerm,
      suggestions: suggestions.length > 0 ? suggestions : null,
      stats
    });

  } catch (error) {
    console.error('Search error:', error);
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
