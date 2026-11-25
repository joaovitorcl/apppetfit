/* ═══════════════════════════════════════════════════════════════════════════
   PetFit — Assistente local (chatbot.js)

   Tudo roda no navegador (WebGPU quando disponível). Fluxo (RAG):
     1. QUEBRAR   o guia (chatbot-kb.js) em trechos (chunks) de ~500 caracteres
     2. VETORIZAR cada trecho com um modelo de embeddings multilíngue do Hugging Face
     3. BUSCAR    por similaridade (vetores) + palavras-chave (BM25), fundidas por RRF
     4. RESPONDER com um modelo pequeno (Qwen2.5) usando SÓ os trechos encontrados,
                  ou mostrar os próprios trechos (modo sem gerador)

   TRAVAS CONTRA ALUCINAÇÃO (nesta ordem)
     A. Emergências e pedidos de dose de remédio têm resposta FIXA (sem IA).
     B. Se a busca não encontra nada relevante, o assistente diz que não sabe
        (sem chamar o gerador).
     C. O gerador recebe só os trechos achados + regra de responder NAO_ENCONTRADO.
     D. A resposta gerada é CONFERIDA: números, links e vocabulário que não
        existam nos trechos fazem a resposta ser descartada e trocada pelo
        trecho original do guia.
     E. Toda resposta mostra as fontes (títulos do guia).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  const KB = root.PETFIT_KB;
  if (!KB || !Array.isArray(KB.docs)) { console.warn('[PetChat] chatbot-kb.js não encontrado'); return; }

  /* ───────────────────────── CONFIGURAÇÃO ───────────────────────── */
  const CONFIG = {
    // Biblioteca (versão FIXA, não use "latest")
    transformersUrl: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',
    // Modelo de embeddings (multilíngue, entende português). Exige prefixos "query: " / "passage: ".
    embedModel: 'Xenova/multilingual-e5-small',
    // Geradores (ONNX, rodam em WebGPU com q4f16)
    generators: {
      'full-1.5b': { id: 'onnx-community/Qwen2.5-1.5B-Instruct', label: 'Qwen2.5 1.5B', size: '~1,2 GB' },
      'full-0.5b': { id: 'onnx-community/Qwen2.5-0.5B-Instruct', label: 'Qwen2.5 0.5B', size: '~0,5 GB' }
    },
    // Chunking
    chunkMax: 520,          // caracteres por trecho (máximo)
    chunkMin: 240,          // junta parágrafos curtos até chegar perto disso
    // Busca
    contextChunks: 3,       // quantos trechos vão para o gerador
    rrfK: 60,
    lexWeight: 0.6,         // peso da busca por palavras na fusão
    denseMargin: 0.0,       // sobe/desce a exigência da busca vetorial (ajuste fino)
    minLexScore: 2.0,       // pontuação BM25 mínima para aceitar só por palavras-chave
    // Geração
    maxNewTokens: 220,
    maxQueryChars: 300,
    minSupport: 0.6,        // fração mínima do vocabulário da resposta que precisa existir no contexto
    historyTurns: 12
  };

  const DEBUG = (() => { try { return /chatdebug/.test(location.search) || localStorage.getItem('petfit_chat_debug') === '1'; } catch { return false; } })();
  const log = (...a) => { if (DEBUG) console.log('[PetChat]', ...a); };

  /* ───────────────────── TEXTO: normalização e vocabulário ───────────────────── */
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const STOP = new Set(('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sobre entre e ou mas que se como qual quais quando onde quem ' +
    'eu meu minha meus minhas seu sua seus suas voce voces ele ela eles elas isso isto esse essa esses essas este esta estes estas aquele aquela ja ate ao aos ' +
    'mais menos muito muita muitos muitas tambem so ser estar estao foi sao tem ter tenho pode posso podem preciso fazer faz fazem ha vai vou ir me te lhe ' +
    'devo deve quanto quantos quantas ai la aqui entao porque pq pra pro pelo pela pelos pelas num numa nao sim bem tudo toda todo todos todas outro outra cada algum alguma ainda sempre').split(' '));

  // Sinônimos mais comuns, para a busca por palavras (a busca vetorial já cobre o resto)
  const CANON = {
    cao: 'cachorro', caes: 'cachorro', cachorros: 'cachorro', cachorrinho: 'cachorro', cachorrinha: 'cachorro', cachorrinhos: 'cachorro', cadela: 'cachorro', cadelas: 'cachorro',
    gata: 'gato', gatas: 'gato', gatos: 'gato', gatinho: 'gato', gatinha: 'gato', gatinhos: 'gato', felino: 'gato', felinos: 'gato',
    remedio: 'medicamento', remedios: 'medicamento', medicacao: 'medicamento', medicamentos: 'medicamento',
    vomitar: 'vomito', vomitou: 'vomito', vomitando: 'vomito', vomitei: 'vomito', vomitos: 'vomito',
    exercicio: 'exercicio', exercicios: 'exercicio', treino: 'exercicio', treinar: 'exercicio',
    passear: 'passeio', passeios: 'passeio', caminhada: 'passeio', caminhar: 'passeio', caminhadas: 'passeio',
    habitos: 'habito', tarefas: 'habito', tarefa: 'habito',
    comer: 'comida', racao: 'comida', alimento: 'comida', alimentos: 'comida', alimentacao: 'comida'
  };

  const stem = w => { let s = w; if (s.length > 4 && s.endsWith('s')) s = s.slice(0, -1); return s.slice(0, 6); };

  /** Retorna [{w, s}] (palavra normalizada, radical). Remove stopwords e palavras muito curtas. */
  function analyze(text) {
    const toks = fold(text).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
    const out = [];
    for (let w of toks) {
      w = CANON[w] || w;
      if (STOP.has(w) || w.length < 3) continue;
      out.push({ w, s: stem(w) });
    }
    return out;
  }

  /* ───────────────────────── 1) QUEBRAR (chunking) ───────────────────────── */
  function splitSentences(p) {
    const m = p.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
    return (m || [p]).map(s => s.trim()).filter(Boolean);
  }

  function chunkDoc(doc) {
    const paras = String(doc.texto || '').split(/\n\s*\n/).map(p => p.trim().replace(/\s+/g, ' ')).filter(Boolean);
    const pieces = [];
    let buf = '';
    const flush = () => { if (buf.trim()) pieces.push(buf.trim()); buf = ''; };

    for (const p of paras) {
      const sentences = p.length > CONFIG.chunkMax ? splitSentences(p) : [p];
      let last = '';
      for (const s of sentences) {
        if (buf && buf.length + 1 + s.length > CONFIG.chunkMax) {
          flush();
          // pequena sobreposição: repete a última frase quando o corte caiu no meio de um parágrafo
          if (sentences.length > 1 && last && last.length < 160) buf = last;
        }
        buf = buf ? buf + ' ' + s : s;
        last = s;
      }
      if (buf.length >= CONFIG.chunkMin) flush();
    }
    flush();
    // trechos muito curtos geram vetores pobres: junta com o anterior quando couber
    const merged = [];
    for (const t of pieces) {
      const prev = merged[merged.length - 1];
      if (prev && t.length < 140 && prev.length + 1 + t.length <= CONFIG.chunkMax + 120) merged[merged.length - 1] = prev + ' ' + t;
      else merged.push(t);
    }
    return merged.map((text, i) => ({ id: doc.id + '#' + i, docId: doc.id, titulo: doc.titulo, tema: doc.tema, text }));
  }

  function buildChunks(docs) { return docs.flatMap(chunkDoc); }

  const CHUNKS = buildChunks(KB.docs);
  const docById = Object.fromEntries(KB.docs.map(d => [d.id, d]));
  const docText = id => (docById[id] ? docById[id].texto.split(/\n\s*\n/).map(p => p.trim().replace(/\s+/g, ' ')).join('\n\n') : '');

  /* ───────────────────── 2a) Índice por palavras (BM25) ───────────────────── */
  function buildLex(chunks) {
    const tfs = [], lens = [], df = new Map();
    chunks.forEach(c => {
      const stems = analyze(c.titulo + ' ' + c.text).map(t => t.s);
      const tf = new Map();
      stems.forEach(s => tf.set(s, (tf.get(s) || 0) + 1));
      tfs.push(tf); lens.push(stems.length);
      tf.forEach((_, s) => df.set(s, (df.get(s) || 0) + 1));
    });
    const N = chunks.length, avg = lens.reduce((a, b) => a + b, 0) / Math.max(1, N);
    return { tfs, lens, df, N, avg };
  }

  function lexSearch(lex, qStems) {
    const uniq = [...new Set(qStems)];
    const k1 = 1.2, b = 0.75;
    const scores = new Array(lex.N).fill(0), cov = new Array(lex.N).fill(0);
    if (!uniq.length) return { scores, cov, uniq };
    for (let i = 0; i < lex.N; i++) {
      let sc = 0, hit = 0;
      for (const s of uniq) {
        const f = lex.tfs[i].get(s) || 0;
        if (!f) continue;
        hit++;
        const n = lex.df.get(s) || 0;
        const idf = Math.log(1 + (lex.N - n + 0.5) / (n + 0.5));
        sc += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * lex.lens[i] / lex.avg));
      }
      scores[i] = sc; cov[i] = hit / uniq.length;
    }
    return { scores, cov, uniq };
  }

  let LEX = null;
  const getLex = () => (LEX || (LEX = buildLex(CHUNKS)));

  /* ───────────────────── 2b) Vetorização (Hugging Face / WebGPU) ───────────────────── */
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const nextTick = () => new Promise(r => setTimeout(r, 0));

  const hashStr = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  // Perguntas SEM relação com o guia: servem para medir o "ruído" da similaridade e calibrar o limite de aceitação.
  const NOISE_PROBES = [
    'resultado do jogo de futebol de ontem', 'receita de bolo de cenoura', 'como declarar imposto de renda', 'quem é o presidente do Brasil',
    'qual é a capital da França', 'previsão do tempo para amanhã', 'cotação do dólar hoje', 'como instalar o Windows no computador',
    'qual o melhor celular para comprar', 'história da Segunda Guerra Mundial', 'como aprender inglês rápido', 'letra de uma música famosa',
    'como investir em ações na bolsa', 'qual série assistir hoje', 'como consertar o motor de um carro', 'traduzir uma frase para o espanhol',
    'como funciona a fotossíntese', 'dicas para uma entrevista de emprego'
  ];

  // Cache dos vetores no IndexedDB (evita recalcular a cada abertura)
  const idb = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('petfit-chat', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async get(k) { try { const db = await this.open(); return await new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch { return undefined; } },
    async set(k, v) { try { const db = await this.open(); await new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); } catch { /* cache é opcional */ } }
  };

  let TF = null;
  async function getTF() {
    if (TF) return TF;
    TF = await import(CONFIG.transformersUrl);
    TF.env.allowLocalModels = false;            // não procurar modelos no próprio site
    try { TF.env.backends.onnx.wasm.proxy = false; } catch { /* ignora */ }
    return TF;
  }

  async function detectGPU() {
    try {
      if (!('gpu' in navigator)) return { ok: false };
      const a = await navigator.gpu.requestAdapter();
      if (!a) return { ok: false };
      return { ok: true, f16: a.features.has('shader-f16') };
    } catch { return { ok: false }; }
  }

  function progressTracker(onProgress, label) {
    const files = {};
    return p => {
      if (p.status === 'progress' && p.total) {
        files[p.file] = { l: p.loaded, t: p.total };
        let L = 0, T = 0; Object.values(files).forEach(f => { L += f.l; T += f.t; });
        onProgress(Math.round(L / T * 100), label);
      }
    };
  }

  async function embed(extractor, texts, prefix) {
    const out = [], B = 8;
    for (let i = 0; i < texts.length; i += B) {
      const t = await extractor(texts.slice(i, i + B).map(x => prefix + x), { pooling: 'mean', normalize: true });
      const [n, d] = t.dims, data = t.data;
      for (let r = 0; r < n; r++) out.push(Float32Array.from(data.subarray(r * d, (r + 1) * d)));
      await nextTick();
    }
    return out;
  }

  /** Confere se o modelo devolve vetores válidos (protege contra fp16/WebGPU devolvendo lixo). */
  async function sanityOK(extractor) {
    const [a, b] = await embed(extractor, ['teste de busca', 'gato com vômito'], 'query: ');
    const norm = v => Math.sqrt(dot(v, v));
    const fin = v => v.every(Number.isFinite);
    return fin(a) && fin(b) && Math.abs(norm(a) - 1) < 0.05 && Math.abs(norm(b) - 1) < 0.05 && dot(a, b) < 0.999;
  }

  async function loadEmbedder(gpu, onProgress) {
    const tfm = await getTF();
    const attempts = [];
    if (gpu.ok && gpu.f16) attempts.push({ device: 'webgpu', dtype: 'fp16' });
    attempts.push({ device: 'wasm', dtype: 'q8' });
    let lastErr = null;
    for (const a of attempts) {
      try {
        const extractor = await tfm.pipeline('feature-extraction', CONFIG.embedModel, { ...a, progress_callback: progressTracker(onProgress, 'busca') });
        if (!(await sanityOK(extractor))) throw new Error('vetores inválidos em ' + a.device);
        return { extractor, ...a };
      } catch (e) { lastErr = e; console.warn('[PetChat] embedder falhou:', a, e); }
    }
    throw lastErr || new Error('Não foi possível carregar o modelo de busca');
  }

  async function buildIndex(emb, onStatus) {
    const sig = [KB.version, CONFIG.embedModel, emb.dtype, CHUNKS.length, hashStr(CHUNKS.map(c => c.titulo + c.text).join('|') + NOISE_PROBES.join('|'))].join(':');
    const cached = await idb.get('index:' + sig);
    if (cached && cached.vecs && cached.vecs.length === CHUNKS.length) { log('índice vindo do cache', sig); return cached; }
    onStatus('Indexando o guia (' + CHUNKS.length + ' trechos)…');
    const vecs = await embed(emb.extractor, CHUNKS.map(c => c.titulo + '. ' + c.text), 'passage: ');
    const probes = await embed(emb.extractor, NOISE_PROBES, 'query: ');
    const tops = probes.map(p => Math.max(...vecs.map(v => dot(p, v))));
    const mean = tops.reduce((a, b) => a + b, 0) / tops.length;
    const std = Math.sqrt(tops.reduce((a, b) => a + (b - mean) ** 2, 0) / tops.length);
    const ceiling = Math.max(mean + 2 * std, mean + 0.02);
    const index = { vecs, ceiling, noiseMean: mean, noiseStd: std };
    await idb.set('index:' + sig, index);
    return index;
  }

  /* ───────────────────── 3) BUSCA híbrida + decisão de confiança ───────────────────── */
  function rankOf(scores) {
    const idx = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
    const rank = new Array(scores.length);
    idx.forEach((i, r) => { rank[i] = r; });
    return rank;
  }

  /**
   * @param {string} text  pergunta (já com contexto da conversa, se houver)
   * @param {Float32Array|null} qVec  vetor da pergunta (null no modo leve)
   * @param {{vecs:Float32Array[], ceiling:number}|null} index
   */
  function searchCore(text, qVec, index) {
    const lex = getLex();
    const qStems = analyze(text).map(t => t.s);
    const L = lexSearch(lex, qStems);
    const dense = qVec && index ? index.vecs.map(v => dot(qVec, v)) : null;

    const lexRank = rankOf(L.scores), denseRank = dense ? rankOf(dense) : null;
    const fused = CHUNKS.map((_, i) => {
      let s = 0;
      if (denseRank) s += 1 / (CONFIG.rrfK + denseRank[i]);
      if (L.scores[i] > 0) s += CONFIG.lexWeight / (CONFIG.rrfK + lexRank[i]);
      return s;
    });
    const order = fused.map((s, i) => i).sort((a, b) => fused[b] - fused[a]);
    const top = order.slice(0, CONFIG.contextChunks + 1).map(i => ({ chunk: CHUNKS[i], cos: dense ? dense[i] : null, lex: L.scores[i], cov: L.cov[i], i }));

    const maxCos = dense ? Math.max(...dense) : null;
    const ceiling = index ? index.ceiling + CONFIG.denseMargin : null;
    const bestLex = Math.max(...L.scores, 0);
    const bestCov = Math.max(...top.map(t => t.cov), 0);
    const lexStrong = bestCov >= 0.5 && bestLex >= CONFIG.minLexScore;
    const denseOK = dense ? maxCos >= ceiling : false;

    let conf = 'none';
    if (dense) {
      if (denseOK) conf = bestCov > 0 ? 'high' : 'medium';
      else if (lexStrong) conf = 'medium';
    } else if (lexStrong) {
      conf = bestCov >= 0.99 ? 'high' : 'medium';
    }

    // Só entram no contexto trechos realmente relacionados (o 1º sempre entra se há confiança).
    let ctx = top.filter((t, k) => k < CONFIG.contextChunks && (k === 0 || t.cov >= 0.5 || (dense && t.cos >= ceiling - 0.02)));
    if (conf === 'none') ctx = [];
    // Expansão: se o melhor trecho é um pedaço de um assunto maior, traz os vizinhos do mesmo assunto
    if (ctx.length) {
      const top1 = ctx[0];
      CHUNKS.forEach((c, i) => {
        if (c.docId === top1.chunk.docId && !ctx.some(t => t.i === i) && ctx.length < CONFIG.contextChunks)
          ctx.push({ chunk: c, cos: dense ? dense[i] : null, lex: L.scores[i], cov: L.cov[i], i, sibling: true });
      });
    }
    return { conf, ctx, maxCos, ceiling, bestLex, bestCov, qStems };
  }

  /* ───────────────────── Roteadores de segurança (respostas fixas, sem IA) ───────────────────── */
  const RE_GREET = /^(oi+|ola|opa|e ai|eai|bom dia|boa tarde|boa noite|tudo bem|hey|hello)\b[\s!?.,]*$/;
  const RE_THANKS = /^(obrigad[oa]s?|valeu|vlw|brigad[oa]|thanks)\b[\s!?.,]*$/;

  const EMERGENCY_RULES = [
    { re: /convuls|desmai|colaps|desacord|tremendo muito/, docs: ['pet-emergencias', 'pet-primeiros-socorros'] },
    { re: /nao (consegue )?respir|sem respirar|falta de ar|dificuldade (para|de|em) respirar|respirando mal|engasg|sufoc/, docs: ['pet-emergencias'] },
    { re: /sangr(a|ando|amento|e muito)|hemorragi/, docs: ['pet-emergencias', 'pet-primeiros-socorros'] },
    { re: /atropel|queda grave|foi mordid[oa]/, docs: ['pet-emergencias', 'pet-primeiros-socorros'] },
    { re: /(nao|sem) (consegue )?(urinar|fazer xixi|fazer coco)|esforco (pra|para) (urinar|fazer xixi)/, docs: ['pet-emergencias'] },
    { re: /gengiva[s]? (branca|palida|azul|roxa|arroxeada)|inchad[oa] e dur[oa]|barriga (dura|inchada)|tentando vomitar|vomitar sem conseguir/, docs: ['pet-emergencias'] },
    { re: /golpe de calor|insolacao|superaquec/, docs: ['pet-calor', 'pet-emergencias'] },
    { re: /veneno|raticida|chumbinho|envenen|intoxic/, docs: ['pet-intoxicacao', 'pet-emergencias'] },
    { re: /(comeu|engoliu|ingeriu|lambeu|mastigou|bebeu) .*(veneno|chocolate|uva|passa|cebola|alho|xilitol|remedio|medicamento|comprimido|lirio|raticida|cafe|macadamia|alcool)/, docs: ['pet-intoxicacao', 'pet-alimentos-toxicos'] }
  ];

  const RE_DOSE = /\b(dose|doses|dosagem|posologia|miligrama|quantos? (mg|ml|comprimidos?|gotas?|capsulas?)|(posso|pode|devo|da pra|dar) (dar|tomar|usar|aplicar|dou)\b.*\b(dipirona|paracetamol|ibuprofeno|aspirina|tylenol|dramin|buscopan|rivotril|antibiotico|anti[ -]?inflamatorio|corticoide|remedio|medicamento|comprimido))/;

  function routeSafety(f) {
    const docs = [];
    for (const r of EMERGENCY_RULES) if (r.re.test(f)) r.docs.forEach(d => { if (!docs.includes(d)) docs.push(d); });
    if (docs.length) return { kind: 'emergency', docs };
    if (RE_DOSE.test(f) && !/racao|comida|petisco|porcao|agua/.test(f)) return { kind: 'dose', docs: ['pet-remedios-humanos'] };
    return null;
  }

  /* ───────────────────── 4) Geração e conferência (anti-alucinação) ───────────────────── */
  const SYSTEM_PROMPT =
    'Você é o assistente do aplicativo PetFit. Responda em português do Brasil, de forma curta, clara e amigável (no máximo 5 frases ou uma lista curta). ' +
    'Use APENAS as informações do CONTEXTO. Não invente números, doses, nomes de remédios, diagnósticos, prazos ou funções do app que não estejam no CONTEXTO. ' +
    'Se o CONTEXTO não responder à pergunta, responda somente: NAO_ENCONTRADO. ' +
    'Você não faz diagnóstico; em dúvidas de saúde, recomende o veterinário.';

  function buildMessages(question, ctx, prevQuestion) {
    const ctxText = ctx.map((c, i) => `[${i + 1}] ${c.chunk.titulo}: ${c.chunk.text}`).join('\n\n');
    const prev = prevQuestion ? `(Pergunta anterior do usuário, para contexto: ${prevQuestion})\n` : '';
    // As regras também vão na mensagem do usuário: alguns modelos ONNX dão pouco peso ao system prompt.
    const user = `CONTEXTO:\n${ctxText}\n\n${prev}PERGUNTA: ${question}\n\n` +
      'Responda usando SOMENTE o CONTEXTO acima, sem acrescentar fatos, números ou doses de fora dele. ' +
      'Se o CONTEXTO não responder, escreva apenas: NAO_ENCONTRADO.';
    return [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: user }];
  }

  // Palavras genéricas de resposta que não precisam estar no contexto
  const GENERIC = new Set(('recome importa melhor procur consul orient geral sempre quando depend precis deve pode ajuda cuidad atenc necess ' +
    'adequ indica segui fazer aconte outro outra algum podem devem tamben ainda partir manter evita comece') .split(' ').map(w => stem(fold(w))));

  function grounded(answer, ctxText) {
    const A = fold(answer), C = fold(ctxText);
    // 1) números (doses, prazos, porcentagens) precisam existir no contexto
    const nums = A.replace(/^\s*\d+[.)]\s+/gm, '').match(/\d+(?:[.,]\d+)?/g) || [];
    const ctxNums = new Set(C.match(/\d+(?:[.,]\d+)?/g) || []);
    for (const n of nums) if (!ctxNums.has(n)) return { ok: false, reason: 'número fora do guia: ' + n };
    // 2) links, e-mails e telefones
    const links = A.match(/https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+|\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g) || [];
    for (const l of links) if (!C.includes(l)) return { ok: false, reason: 'link/contato fora do guia' };
    // 3) vocabulário: quanto da resposta é sustentado pelo contexto
    const ctxStems = new Set(analyze(C).map(t => t.s));
    const words = analyze(A).filter(t => t.w.length >= 6);
    if (words.length >= 4) {
      const unsupported = words.filter(t => !ctxStems.has(t.s) && !GENERIC.has(t.s));
      const support = 1 - unsupported.length / words.length;
      if (support < CONFIG.minSupport) return { ok: false, reason: 'vocabulário fora do guia (' + Math.round(support * 100) + '% sustentado): ' + unsupported.slice(0, 6).map(t => t.w).join(', ') };
    }
    return { ok: true };
  }

  /* ───────────────────── Textos fixos ───────────────────── */
  const NOT_FOUND =
    'Não encontrei isso no guia do PetFit, então prefiro não chutar. Eu respondo sobre o funcionamento do app, a saúde do pet e atividades para fazer junto com ele. ' +
    'Tente perguntar de outro jeito. Para questões de saúde específicas do seu pet, o veterinário é quem pode avaliar.';
  const DISCLAIMER = 'ℹ️ Orientação geral, que não substitui a avaliação do veterinário.';
  const ALERT = '⚠️ Isso pode ser uma emergência. Entre em contato agora com um veterinário (de preferência uma clínica 24 horas). Enquanto isso, veja as orientações do guia:';

  /* ───────────────────── Exposição para testes ───────────────────── */
  const core = { CONFIG, fold, analyze, chunkDoc, buildChunks, CHUNKS, buildLex, lexSearch, searchCore, routeSafety, grounded, buildMessages, docText, RE_GREET, RE_THANKS, NOT_FOUND };
  root.PetChat = { _core: core };

  if (typeof document === 'undefined') return;   // (testes em Node: sem interface)

  /* ═══════════════════════════════════════════════════════════════════════
     INTERFACE
     ═══════════════════════════════════════════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignora */ } }
  };

  const MODES = ['full-1.5b', 'full-0.5b', 'semantic', 'light'];
  const state = {
    gpu: null, mode: null, ready: false, loading: null,
    embedder: null, index: null, gen: null,
    busy: false, lastQ: '', history: [], pendingConsent: null
  };

  let el = {};

  function setStatus(text, kind) {
    el.status.textContent = text || '';
    el.status.className = 'chat-status' + (kind ? ' ' + kind : '');
    el.status.hidden = !text;
  }
  function setProgress(pct) {
    if (pct == null) { el.progress.hidden = true; return; }
    el.progress.hidden = false; el.progress.value = pct;
  }
  function scrollDown() { el.messages.scrollTop = el.messages.scrollHeight; }

  function addMsg(role, text, opts = {}) {
    const row = document.createElement('div');
    row.className = 'chat-msg ' + (role === 'user' ? 'chat-user' : 'chat-bot') + (opts.alert ? ' chat-alert' : '');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    const body = document.createElement('div');
    body.className = 'chat-text';
    body.textContent = text;                                   // sempre textContent (sem HTML)
    bubble.appendChild(body);
    row.appendChild(bubble);
    el.messages.appendChild(row);
    const isBot = role !== 'user';
    // resposta longa do assistente: mantém o COMEÇO visível (a pessoa lê de cima para baixo)
    const reveal = () => {
      if (!isBot) return scrollDown();
      const top = row.getBoundingClientRect().top - el.messages.getBoundingClientRect().top;
      el.messages.scrollTop += top - 4;
    };
    reveal();
    const api = { row, bubble, body, setText(t) { body.textContent = t; reveal(); } };
    api.addSources = (ctx, extra) => {
      const titles = [...new Set((ctx || []).map(c => (c.chunk ? c.chunk.titulo : c)))];
      if (!titles.length && !extra) return;
      const s = document.createElement('div');
      s.className = 'chat-sources';
      if (titles.length) s.textContent = '📚 Fonte: ' + titles.join(' · ');
      if (DEBUG && extra) { const d = document.createElement('div'); d.className = 'chat-debug'; d.textContent = extra; s.appendChild(d); }
      bubble.appendChild(s);
      reveal();
    };
    return api;
  }

  function addNote(text) {
    const n = document.createElement('div');
    n.className = 'chat-note';
    n.textContent = text;
    el.messages.appendChild(n);
    scrollDown();
  }

  function setBusy(b) {
    state.busy = b;
    el.send.disabled = b;
    el.input.disabled = b;
    el.messages.setAttribute('aria-busy', String(b));
    if (!b && el.modal.classList.contains('active')) el.input.focus();
  }

  /* ── modos e consentimento de download ── */
  function modeNeeds(mode) {
    return { embed: mode !== 'light', gen: mode.startsWith('full') ? mode : null };
  }
  function consentKey(mode) { const n = modeNeeds(mode); return 'petfit_chat_ok_' + (n.embed ? 'e' : '') + (n.gen ? n.gen : ''); }

  function describeDownload(mode) {
    const gpu = state.gpu || {};
    const embedSize = gpu.ok && gpu.f16 ? '~235 MB' : '~118 MB';
    if (mode === 'light') return null;
    let t = 'Busca semântica (' + CONFIG.embedModel + ', ' + embedSize + ')';
    if (mode.startsWith('full')) { const g = CONFIG.generators[mode]; t += ' + resposta gerada (' + g.label + ', ' + g.size + ')'; }
    return t + '. O download acontece uma vez e fica guardado no navegador. Use Wi-Fi se puder.';
  }

  function applyModeToSelect() {
    el.mode.value = state.mode;
    [...el.mode.options].forEach(o => { if (o.value.startsWith('full')) o.disabled = !(state.gpu && state.gpu.ok && state.gpu.f16); });
  }

  function chooseDefaultMode() {
    const saved = LS.get('petfit_chat_mode');
    const gpuOK = state.gpu && state.gpu.ok && state.gpu.f16;
    if (saved && MODES.includes(saved) && (gpuOK || !saved.startsWith('full'))) return saved;
    if (!gpuOK) return 'semantic';
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    return mobile ? 'full-0.5b' : 'full-1.5b';
  }

  function requestConsent(mode) {
    return new Promise(resolve => {
      const card = document.createElement('div');
      card.className = 'chat-card';
      const p1 = document.createElement('p'); p1.className = 'chat-card-title'; p1.textContent = 'Ativar o assistente no seu aparelho';
      const p2 = document.createElement('p'); p2.textContent = 'Para responder, o assistente baixa modelos do Hugging Face e roda tudo no seu navegador: ' + describeDownload(mode);
      const row = document.createElement('div'); row.className = 'chat-card-actions';
      const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'btn-primary'; ok.textContent = 'Baixar e ativar';
      const light = document.createElement('button'); light.type = 'button'; light.className = 'btn-secondary'; light.textContent = 'Modo leve (sem baixar)';
      row.append(ok, light); card.append(p1, p2, row);
      el.messages.appendChild(card); scrollDown();
      const done = v => { card.remove(); resolve(v); };
      ok.addEventListener('click', () => done('ok'));
      light.addEventListener('click', () => done('light'));
    });
  }

  async function ensureReady() {
    if (state.ready && state.mode === el.mode.value) return;
    if (state.loading) return state.loading;
    state.loading = (async () => {
      if (!state.gpu) state.gpu = await detectGPU();
      if (!state.mode) { state.mode = chooseDefaultMode(); applyModeToSelect(); }
      let mode = el.mode.value && MODES.includes(el.mode.value) ? el.mode.value : state.mode;
      if (mode.startsWith('full') && !(state.gpu.ok && state.gpu.f16)) { mode = 'semantic'; addNote('Este aparelho não oferece WebGPU com suporte a f16; usando busca semântica + trechos do guia (sem gerador).'); }
      state.mode = mode; applyModeToSelect(); LS.set('petfit_chat_mode', mode);

      const needs = modeNeeds(mode);
      if (needs.embed && !LS.get(consentKey(mode))) {
        const choice = await requestConsent(mode);
        if (choice === 'light') { state.mode = 'light'; applyModeToSelect(); LS.set('petfit_chat_mode', 'light'); }
        else LS.set(consentKey(mode), '1');
      }

      const n2 = modeNeeds(state.mode);
      if (n2.embed && !state.embedder) {
        setStatus('Carregando o modelo de busca…'); setProgress(0);
        state.embedder = await loadEmbedder(state.gpu, (p, l) => { setStatus('Baixando modelo de ' + l + '… ' + p + '%'); setProgress(p); });
        setProgress(null);
        setStatus('Indexando o guia…');
        state.index = await buildIndex(state.embedder, t => setStatus(t));
        log('embedder', state.embedder.device, state.embedder.dtype, 'ceiling', state.index.ceiling.toFixed(3), 'noise', state.index.noiseMean.toFixed(3), '±', state.index.noiseStd.toFixed(3));
      }
      if (n2.gen && !state.gen) {
        const g = CONFIG.generators[n2.gen];
        try {
          setStatus('Carregando o gerador de respostas (' + g.label + ')…'); setProgress(0);
          const tfm = await getTF();
          const pipe = await tfm.pipeline('text-generation', g.id, { device: 'webgpu', dtype: 'q4f16', progress_callback: progressTracker((p) => { setStatus('Baixando ' + g.label + '… ' + p + '%'); setProgress(p); }, g.label) });
          state.gen = { pipe, key: n2.gen };
        } catch (e) {
          console.warn('[PetChat] gerador falhou:', e);
          addNote('Não consegui carregar o gerador (' + (e && e.message ? e.message : e) + '). Seguindo só com trechos do guia.');
        }
        setProgress(null);
      }
      state.ready = true;
      refreshStatus();
    })();
    try { await state.loading; } finally { state.loading = null; setProgress(null); }
  }

  function refreshStatus() {
    const parts = [];
    if (state.embedder) parts.push('busca ' + state.embedder.device);
    else parts.push('palavras-chave');
    if (state.gen) parts.push('resposta gerada ' + CONFIG.generators[state.gen.key].label + ' · WebGPU');
    else if (state.embedder) parts.push('trechos do guia');
    setStatus('Pronto · ' + parts.join(' + '), 'ok');
  }

  /* ── resposta ── */
  function greetingText() {
    const pet = (typeof App !== 'undefined' && App.profile && App.profile.petName) ? App.profile.petName : 'seu pet';
    return 'Oi! Eu sou o assistente do PetFit. Posso ajudar com dúvidas sobre o app, a saúde de ' + pet + ' e ideias de atividades para vocês fazerem juntos. O que você quer saber?';
  }

  function answerFixed(route) {
    const text = route.docs.map(docText).filter(Boolean).join('\n\n');
    const intro = route.kind === 'emergency' ? ALERT : 'Não posso indicar doses nem liberar remédios.';
    const m = addMsg('bot', intro + '\n\n' + text, { alert: route.kind === 'emergency' });
    m.addSources(route.docs.map(id => ({ chunk: { titulo: docById[id].titulo } })));
  }

  function usesHealthTopic(ctx) { return ctx.some(c => c.chunk.tema === 'pet'); }

  /** Modo sem gerador: mostra o próprio texto do guia (assunto inteiro se for curto). Retorna {text, titles}. */
  function extractive(res) {
    const top = res.ctx[0].chunk;
    const doc = docById[top.docId];
    const whole = docText(top.docId);
    const body = whole.length <= 700 ? whole : top.text;
    const head = res.conf === 'medium'
      ? 'Encontrei este trecho no guia que parece relacionado (pode não responder exatamente à sua pergunta):'
      : 'Do guia do PetFit — ' + doc.titulo + ':';
    return { text: head + '\n\n' + body, titles: [doc.titulo] };
  }
  const extractiveText = res => extractive(res).text;

  function debugLine(res) {
    return 'conf=' + res.conf + ' cos=' + (res.maxCos == null ? '–' : res.maxCos.toFixed(3)) + ' limite=' + (res.ceiling == null ? '–' : res.ceiling.toFixed(3)) +
      ' lex=' + res.bestLex.toFixed(2) + ' cob=' + res.bestCov.toFixed(2);
  }

  async function generate(question, res, bubble) {
    const messages = buildMessages(question, res.ctx, state.lastQ && state.lastQ !== question ? state.lastQ : '');
    const tfm = await getTF();
    let streamed = '';
    const streamer = new tfm.TextStreamer(state.gen.pipe.tokenizer, {
      skip_prompt: true, skip_special_tokens: true,
      callback_function: t => { streamed += t; bubble.setText(streamed); }
    });
    const out = await state.gen.pipe(messages, { max_new_tokens: CONFIG.maxNewTokens, do_sample: false, repetition_penalty: 1.05, streamer });
    const g = out && out[0] && out[0].generated_text;
    const last = Array.isArray(g) ? g[g.length - 1] : null;
    return String((last && last.content) || streamed || '').trim();
  }

  // Frases que claramente continuam a pergunta anterior ("e para gatos?", "ele pode comer isso?")
  const FOLLOWUP = /^(e|mas|entao|tambem|ainda)\b|\b(ele|ela|eles|elas|isso|isto|disso|nisso|nele|nela|dele|dela)\b/;

  async function runSearch(text) {
    let qVec = null;
    if (state.embedder && state.index) qVec = (await embed(state.embedder.extractor, [text], 'query: '))[0];
    const res = searchCore(text, qVec, state.index);
    log(text, debugLine(res), res.ctx.map(c => c.chunk.id));
    return res;
  }

  async function answer(q) {
    const words = q.trim().split(/\s+/).length;
    const follow = !!state.lastQ && words <= 6 && FOLLOWUP.test(fold(q));
    // Pergunta nova é buscada sozinha (não herda o assunto anterior). Só continuações herdam.
    let res = await runSearch(follow ? state.lastQ + ' ' + q : q);
    // Frase muito curta sem resultado: tenta de novo junto com a pergunta anterior
    if (res.conf === 'none' && !follow && state.lastQ && words <= 3) {
      const r2 = await runSearch(state.lastQ + ' ' + q);
      if (r2.conf !== 'none') res = r2;
    }

    if (res.conf === 'none' || !res.ctx.length) {
      const m = addMsg('bot', NOT_FOUND);
      if (DEBUG) m.addSources([], debugLine(res));
      return;
    }

    const health = usesHealthTopic(res.ctx);
    let final = null;

    if (state.gen) {
      const m = addMsg('bot', 'Pensando…');
      m.row.classList.add('chat-streaming');
      try {
        const raw = await generate(q, res, m);
        const ctxText = res.ctx.map(c => c.chunk.titulo + ' ' + c.chunk.text).join(' ');
        if (/NAO[_ ]?ENCONTRADO/i.test(raw)) {
          m.setText(NOT_FOUND);
        } else {
          const g = grounded(raw, ctxText);
          log('conferência', g);
          if (g.ok) { m.setText(raw + (health ? '\n\n' + DISCLAIMER : '')); final = raw; }
          else { m.setText(extractiveText(res) + '\n\n(A resposta gerada foi descartada porque trazia algo que não está no guia.)' + (health ? '\n\n' + DISCLAIMER : '')); }
        }
        m.row.classList.remove('chat-streaming');
        m.addSources(final ? res.ctx : extractive(res).titles, DEBUG ? debugLine(res) : null);
        return finalize(q, final || extractiveText(res));
      } catch (e) {
        m.row.classList.remove('chat-streaming');
        console.warn('[PetChat] geração falhou:', e);
        if (/device.*lost|mapAsync|OrtRun|out of memory/i.test(String(e && e.message || e))) { state.gen = null; addNote('A GPU ficou sem memória; o gerador foi desligado. Seguindo com trechos do guia.'); refreshStatus(); }
        m.setText(extractiveText(res) + (health ? '\n\n' + DISCLAIMER : ''));
        m.addSources(extractive(res).titles, DEBUG ? debugLine(res) : null);
        return finalize(q, extractiveText(res));
      }
    }

    const m = addMsg('bot', extractiveText(res) + (health ? '\n\n' + DISCLAIMER : ''));
    m.addSources(extractive(res).titles, DEBUG ? debugLine(res) : null);
    finalize(q, extractiveText(res));
  }

  function finalize(q, a) {
    state.lastQ = q;
    state.history.push({ q, a });
    if (state.history.length > CONFIG.historyTurns) state.history.shift();
  }

  async function ask(raw) {
    const q = String(raw || '').trim().slice(0, CONFIG.maxQueryChars);
    if (!q || state.busy) return;
    setBusy(true);
    addMsg('user', q);
    try {
      const f = fold(q);
      if (RE_GREET.test(f)) { addMsg('bot', greetingText()); return; }
      if (RE_THANKS.test(f)) { addMsg('bot', 'Por nada! Se precisar de mais alguma coisa, é só perguntar. 🐾'); return; }
      const route = routeSafety(f);
      if (route) { answerFixed(route); finalize(q, ''); return; }
      await ensureReady();
      await answer(q);
    } catch (e) {
      console.error('[PetChat]', e);
      addMsg('bot', 'Não consegui responder agora (' + (e && e.message ? e.message : e) + '). Abra “Opções do assistente” e tente o modo leve, que não precisa baixar nada.');
      setStatus('Erro ao preparar o assistente', 'error');
      state.embedder = null; state.index = null; state.ready = false;
    } finally {
      setBusy(false);
    }
  }

  /* ── abrir / limpar / sugestões ── */
  const SUGGESTIONS = [
    'Como concluo um hábito?',
    'O que é a Energia da Dupla?',
    'Meu pet pode comer chocolate?',
    'Exercícios para fazer com meu cachorro'
  ];

<<<<<<< HEAD
  /* ── v9.0 · "Como funciona": explicação para o público, aberta pelo botão "Assistente PetFit" da barra ── */
  const G15 = CONFIG.generators['full-1.5b'], G05 = CONFIG.generators['full-0.5b'];
  const HOWTO = [
    { icon: '💬', titulo: 'O que eu faço',
      texto: 'Tiro dúvidas sobre o app (hábitos, Energia da Dupla, exercícios), sobre a saúde e a rotina do seu pet e dou ideias de atividades para vocês fazerem juntos.' },
    { icon: '🔒', titulo: 'Tudo no seu aparelho',
      texto: 'Eu rodo no seu navegador. Suas perguntas e os dados da dupla não saem do aparelho.' },
    { icon: '⬇️', titulo: 'No primeiro uso',
      texto: 'Antes de baixar qualquer modelo de IA, eu peço a sua permissão. O download acontece uma vez e fica guardado no navegador (use Wi-Fi se puder). Se preferir não baixar nada, escolha o Modo leve.' },
    { icon: '📚', titulo: 'Só respondo com o guia do PetFit',
      texto: 'Cada resposta mostra a fonte. Se o assunto não estiver no guia, eu aviso que não sei, em vez de inventar.' },
    { icon: '⚠️', titulo: 'Saúde e emergências',
      texto: 'Não indico doses nem remédios. Em caso de emergência, procure um veterinário na hora. Minhas respostas não substituem a avaliação do veterinário.' },
    { icon: '⚙️', titulo: 'Como eu respondo',
      texto: 'Em “Opções do assistente” (embaixo) você escolhe: Completo (resposta gerada, ' + G15.size + '), Completo leve (' + G05.size + '), Busca semântica + trechos do guia, ou Modo leve (nada para baixar). Se o seu aparelho não tiver WebGPU, eu uso a busca com trechos do guia.' }
  ];

  function revealTop(node) {
    const top = node.getBoundingClientRect().top - el.messages.getBoundingClientRect().top;
    el.messages.scrollTop += top - 4;
  }

  function addGuideCard() {
    const card = document.createElement('div');
    card.className = 'chat-card chat-howto';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', 'Como funciona o Assistente PetFit');
    const title = document.createElement('p');
    title.className = 'chat-card-title';
    title.textContent = '🐾 Como funciona o Assistente PetFit';
    card.appendChild(title);
    HOWTO.forEach(it => {
      const item = document.createElement('div');
      item.className = 'chat-howto-item';
      const ic = document.createElement('span'); ic.className = 'chat-howto-icon'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = it.icon;
      const box = document.createElement('div');
      const h = document.createElement('strong'); h.className = 'chat-howto-title'; h.textContent = it.titulo;
      const t = document.createElement('p'); t.className = 'chat-howto-text'; t.textContent = it.texto;
      box.append(h, t); item.append(ic, box); card.appendChild(item);
    });
    el.messages.appendChild(card);
    return card;
  }

  function addChips(host) {
=======
  function renderWelcome() {
    el.messages.textContent = '';
    const m = addMsg('bot', greetingText());
>>>>>>> 47c3cfd756ebc4a5df23a8c1208053e46ab6e4e0
    const chips = document.createElement('div');
    chips.className = 'chat-chips';
    SUGGESTIONS.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chat-chip'; b.textContent = s;
      b.addEventListener('click', () => { chips.remove(); ask(s); });
      chips.appendChild(b);
    });
<<<<<<< HEAD
    host.appendChild(chips);
  }

  /** Botão "Assistente PetFit" da barra inferior: abre o chat e explica como ele funciona. */
  function openGuide() {
    if (!el || !el.modal || !el.messages) return;
    if (typeof App !== 'undefined' && App.openModal) App.openModal('modalChat');
    else el.modal.classList.add('active');
    detectGPU().then(g => { state.gpu = state.gpu || g; if (!state.mode) { state.mode = chooseDefaultMode(); } applyModeToSelect(); });

    const conversing = !!el.messages.querySelector('.chat-user');
    if (!conversing) {
      // conversa ainda não começou: troca a saudação padrão pela explicação
      el.messages.textContent = '';
      state.history = []; state.lastQ = '';
      addMsg('bot', 'Oi! Eu sou o Assistente PetFit. 🐾 Veja abaixo como eu funciono. Depois, é só tocar numa pergunta ou escrever a sua.');
      const card = addGuideCard();
      addChips(card);
      el.messages.scrollTop = 0;   // começa lendo do topo
      keepFocusOffInput(card);
    } else {
      // já existe conversa: não apaga nada, só acrescenta a explicação no fim
      const card = addGuideCard();
      revealTop(card);
      keepFocusOffInput(card);
    }
  }

  /** App.openModal() foca o 1º campo após 300 ms; no guia isso abriria o teclado do celular por cima da explicação. */
  function keepFocusOffInput(card) {
    card.tabIndex = -1;
    setTimeout(() => { if (el.modal.classList.contains('active')) card.focus({ preventScroll: true }); }, 420);
  }

  function renderWelcome() {
    el.messages.textContent = '';
    const m = addMsg('bot', greetingText());
    addChips(m.bubble);
    const how = document.createElement('button');
    how.type = 'button'; how.className = 'chat-chip chat-chip-how'; how.textContent = 'ℹ️ Como o assistente funciona?';
    how.addEventListener('click', () => { how.remove(); revealTop(addGuideCard()); });
    m.bubble.querySelector('.chat-chips').appendChild(how);
=======
    m.bubble.appendChild(chips);
>>>>>>> 47c3cfd756ebc4a5df23a8c1208053e46ab6e4e0
    state.history = []; state.lastQ = '';
  }

  function open(question) {
    if (typeof App !== 'undefined' && App.openModal) App.openModal('modalChat');
    else el.modal.classList.add('active');
    if (!el.messages.children.length) renderWelcome();
    detectGPU().then(g => { state.gpu = state.gpu || g; if (!state.mode) { state.mode = chooseDefaultMode(); } applyModeToSelect(); });
    if (question) ask(question);
  }

  function close() {
    if (typeof App !== 'undefined' && App.closeModal) App.closeModal('modalChat');
    else el.modal.classList.remove('active');
    el.modal.style.height = '';
  }

  function init() {
    el = {
      modal: $('modalChat'), messages: $('chatMessages'), form: $('chatForm'), input: $('chatInput'), send: $('chatSend'),
      status: $('chatStatus'), progress: $('chatProgress'), mode: $('chatMode'), clear: $('chatClear'), closeBtn: $('closeChat'),
      askForm: $('askBar'), askInput: $('askInput')
    };
    if (!el.modal || !el.messages || !el.form) { console.warn('[PetChat] elementos do chat não encontrados no HTML'); return; }

    // Barra de uma linha na tela inicial → abre o chat já com a pergunta
    if (el.askForm) el.askForm.addEventListener('submit', e => {
      e.preventDefault();
      const q = el.askInput.value.trim();
      if (!q) { el.askInput.focus(); return; }
      el.askInput.value = '';
      el.askInput.blur();
      open(q);
    });

    el.form.addEventListener('submit', e => { e.preventDefault(); const q = el.input.value; el.input.value = ''; ask(q); });
    el.closeBtn.addEventListener('click', close);
    el.clear.addEventListener('click', renderWelcome);
    el.mode.addEventListener('change', () => {
      state.mode = el.mode.value; LS.set('petfit_chat_mode', state.mode);
      if (!state.mode.startsWith('full')) state.gen = null;          // libera o gerador ao sair do modo completo
      if (state.mode === 'light') { state.embedder = null; state.index = null; }
      state.ready = false;
      addNote('Modo alterado. O assistente será preparado na próxima pergunta.');
      setStatus('');
    });

    // Gestos do app: arrastar para baixo fecha o modal. Dentro do chat, rolar a conversa não pode fechá-lo.
    ['touchend'].forEach(ev => { el.messages.addEventListener(ev, e => e.stopPropagation(), { passive: true }); el.form.addEventListener(ev, e => e.stopPropagation(), { passive: true }); });

    // Teclado virtual: acompanha a área visível para o campo não ficar escondido
    if (window.visualViewport) {
      const fit = () => { if (el.modal.classList.contains('active')) el.modal.style.height = window.visualViewport.height + 'px'; };
      window.visualViewport.addEventListener('resize', fit);
    }

    el.status.hidden = true; el.progress.hidden = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
<<<<<<< HEAD
  Object.assign(root.PetChat, { ask, open, openGuide, close, state });
=======
  Object.assign(root.PetChat, { ask, open, close, state });
>>>>>>> 47c3cfd756ebc4a5df23a8c1208053e46ab6e4e0

})(typeof window !== 'undefined' ? window : globalThis);
