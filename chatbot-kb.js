/* ═══════════════════════════════════════════════════════════════════════════
   PetFit — Base de conhecimento do assistente (chatbot-kb.js)

   O assistente SÓ responde com o que está escrito aqui. Se algo não estiver
   neste arquivo, ele diz que não encontrou (é assim que evitamos alucinação).

   COMO EDITAR
   • Cada item de `docs` é um assunto: { id, tema, titulo, texto }.
   • `tema`: 'app' (funcionamento do app) · 'pet' (saúde do pet) · 'dupla' (atividades pet + tutor).
   • `texto`: separe os parágrafos com uma linha em branco. O chatbot quebra o
     texto em trechos (chunks) sozinho, então escreva frases completas e
     autoexplicativas (cada parágrafo deve fazer sentido isolado).
   • Não é preciso mudar versão: ao editar o texto, os vetores são recalculados
     automaticamente na próxima vez que o assistente for aberto.
   • Conteúdo de saúde: escreva só orientações gerais e amplamente aceitas.
     Nunca coloque doses de medicamentos nem diagnósticos.
   ═══════════════════════════════════════════════════════════════════════════ */
window.PETFIT_KB = {
  version: 1,
  docs: [

    /* ───────────────────────────── APP ───────────────────────────── */
    {
      id: 'app-visao-geral', tema: 'app', titulo: 'O que é o PetFit',
      texto:
`O PetFit é um aplicativo de hábitos para o pet e para o tutor. Você registra as tarefas de cuidado do pet (alimentação, passeio, escovação, medicação, brincadeira) e, ao concluí-las, o app sugere um microexercício para o tutor fazer na hora. Assim, os dois se cuidam juntos.

A barra inferior tem as abas Hoje, Pet, Evolução, Ajustes e Montar Dupla. No centro, acima da barra, fica o botão Novo Hábito.

No topo da tela Hoje aparecem o Progresso do Dia e a Energia da Dupla. Abaixo ficam o filtro de categorias e a lista de hábitos do dia.`
    },
    {
      id: 'app-habitos-padrao', tema: 'app', titulo: 'Hábitos que já vêm no app',
      texto:
`Na primeira abertura, o app traz 7 hábitos padrão: Alimentação da manhã (08:00), Passeio matinal (09:00), Escovação do pelo (10:00), Medicação (se necessário) (12:00), Brincadeira ativa (16:00), Alimentação da noite (18:00) e Passeio noturno (20:00).

Você pode criar novos hábitos e excluir os que não usa. Para excluir, segure o cartão do hábito e escolha Excluir no menu.`
    },
    {
      id: 'app-novo-habito', tema: 'app', titulo: 'Como criar um novo hábito',
      texto:
`Toque no botão Novo Hábito, no centro da parte de baixo da tela. Preencha o nome do hábito, escolha a categoria e o horário, e toque em Salvar Hábito.

As categorias disponíveis são: Alimentação, Passeio, Medicação, Escovação, Brincadeira, Higiene e Outro.

Dica: use nomes específicos. O app lê o título do hábito para escolher exercícios que combinem com a tarefa. Por exemplo, "Passeio no parque" rende exercícios melhores que apenas "Passeio".

A edição de um hábito já criado ainda não está disponível: ao escolher Editar, o app avisa que a edição chega em breve.`
    },
    {
      id: 'app-concluir-habito', tema: 'app', titulo: 'Como concluir, desmarcar e excluir um hábito',
      texto:
`Para concluir um hábito, toque no botão redondo (✓) do cartão ou deslize o cartão para a esquerda. O app abre a sugestão de exercício. O hábito só é marcado como concluído quando você toca em Concluir & Marcar Hábito. O botão Fechar fecha a sugestão sem concluir o hábito.

Para desmarcar um hábito já concluído, toque no ✓ de novo ou deslize o cartão para a direita.

Para abrir o menu rápido, segure o cartão por cerca de meio segundo. O menu tem Concluir ou Desmarcar, Ver exercício, Editar e Excluir.

Na primeira abertura, um aviso explica esses gestos. Você pode fechá-lo no ✕ e ele não volta.`
    },
    {
      id: 'app-filtro', tema: 'app', titulo: 'Filtro de categorias',
      texto:
`Acima da lista de hábitos há uma barra de filtros com as opções Todos, Alimentação, Passeio, Medicação, Escovação e Brincadeira. Toque em uma delas para ver só os hábitos daquela categoria. A barra pode ser deslizada para o lado.`
    },
    {
      id: 'app-exercicios', tema: 'app', titulo: 'Exercícios sugeridos para o tutor',
      texto:
`Quando você conclui um hábito do pet, o PetFit sugere um microexercício para o tutor fazer durante ou perto da tarefa. O app tem 77 exercícios, organizados nas categorias dos hábitos: Alimentação, Passeio, Medicação, Escovação, Brincadeira, Higiene e Outro.

O exercício é escolhido pela categoria, pelo título e pelo horário do hábito. Quem anda com o cachorro recebe exercícios de pé, com uma mão livre para a guia. Quem dá banho recebe exercícios sem saltos, por causa do piso molhado.

Cada sugestão mostra um rótulo de momento (antes, durante ou depois da tarefa) e uma dica de segurança própria da tarefa. O mesmo exercício não aparece duas vezes seguidas.

Hábitos à noite (a partir das 19h, antes das 6h, ou com "noite" ou "noturno" no título) não recebem exercícios barulhentos ou com saltos, como polichinelos, pulos, tiros de corrida e escadas.`
    },
    {
      id: 'app-video-exercicio', tema: 'app', titulo: 'Vídeo-tutorial dos exercícios',
      texto:
`Abaixo do exercício aparece o texto "Não sabe realizar? Veja esse vídeo no YouTube!" com o botão Ver vídeo. Ele abre o tutorial em outra aba e a sugestão continua aberta para você voltar e concluir o hábito. O app tem 27 vídeos em português.

Se o exercício não tiver vídeo, esse bloco não aparece. Vídeos do YouTube podem ser removidos pelos autores.`
    },
    {
      id: 'app-progresso-energia', tema: 'app', titulo: 'Progresso do Dia e Energia da Dupla',
      texto:
`O Progresso do Dia mostra a porcentagem de hábitos concluídos hoje. Ao chegar em 100%, o app faz uma comemoração com confete.

A Energia da Dupla depende dessa porcentagem: Alta (🔥) a partir de 80%, Média (⚡) a partir de 50%, Aquecendo (💡) acima de 0% e Baixa (💤) quando nenhum hábito foi concluído.`
    },
    {
      id: 'app-evolucao', tema: 'app', titulo: 'Aba Evolução, sequência e histórico',
      texto:
`A aba Evolução abre a Evolução da Dupla, com quatro números: Dias em sequência, Total concluído, Energia média e Exercícios feitos. Abaixo há o gráfico de histórico dos últimos 7 dias.

Os hábitos são reiniciados todo dia. Ao virar o dia, a porcentagem do dia anterior vai para o histórico. O app guarda até 30 dias.

A sequência conta os dias seguidos em que a dupla concluiu pelo menos 50% dos hábitos. O dia de hoje entra na conta assim que chega a 50%.`
    },
    {
      id: 'app-perfil', tema: 'app', titulo: 'Perfil do pet e do tutor (Montar Dupla)',
      texto:
`Para cadastrar a dupla, toque na aba Montar Dupla. Primeiro você preenche o perfil do pet: foto, nome e espécie (obrigatórios) e raça (opcional). Depois preenche o perfil do tutor, com nome e foto. Ao final, toque em Finalizar cadastro.

A aba Pet e a foto do pet no topo da tela abrem o Perfil da Dupla, que mostra as fotos e os nomes do pet e do tutor junto com as estatísticas. Nessa tela os nomes são só para visualização; para mudar, use Montar Dupla.

A foto do pet escolhida passa a aparecer no cabeçalho do app.`
    },
    {
      id: 'app-ajustes', tema: 'app', titulo: 'Ajustes: tema, tamanho do texto, créditos e restaurar dados',
      texto:
`Em Ajustes você escolhe o Tema (Automático, Claro ou Escuro) e o Tamanho do texto (Padrão, Grande ou Maior). O modo Automático acompanha o tema do seu aparelho. Também dá para alternar claro e escuro pelo botão de lua ou sol no topo da tela.

Em Ajustes há ainda os Créditos do app, com os criadores do PetFit, e a opção Restaurar dados da dupla. Restaurar apaga os dados atuais e volta o app ao padrão, e essa ação não pode ser desfeita.

O ícone de chave inglesa 🔧 ao lado de "PetFit v8.0" é o modo debug: carrega um perfil de demonstração e não grava nada, então seus dados reais ficam intactos. Tocar nele de novo, ou recarregar a página, volta aos seus dados.`
    },
    {
      id: 'app-dados', tema: 'app', titulo: 'Onde ficam os dados, sincronização e uso offline',
      texto:
`Os dados do PetFit (hábitos, perfil, histórico) ficam salvos no próprio aparelho, no navegador, e são gravados automaticamente a cada ação. Não é preciso criar conta. Por isso, limpar os dados do navegador pode apagar o progresso.

A sincronização manual (botão Sincronizar e puxar para atualizar) foi removida na versão 8.0, porque os dados já são salvos sozinhos. O app tem suporte opcional a Firebase para guardar dados na nuvem, mas ele vem desativado.

Sem internet, o app mostra o aviso "Sem conexão — seus dados estão salvos localmente". O suporte offline completo ainda está pendente.`
    },
    {
      id: 'app-assistente', tema: 'app', titulo: 'Sobre este assistente',
      texto:
`O assistente do PetFit roda no seu navegador. A busca e a resposta usam modelos de linguagem baixados uma vez e guardados no aparelho; sua pergunta não é enviada a um servidor de IA.

Ele responde só com base no guia interno do PetFit, que cobre o funcionamento do app, a saúde do pet e atividades para fazer junto com o pet. Quando o guia não tem a resposta, ele avisa em vez de inventar.

O assistente não faz diagnóstico e não substitui o veterinário.`
    },

    /* ───────────────────────── SAÚDE DO PET ───────────────────────── */
    {
      id: 'pet-emergencias', tema: 'pet', titulo: 'Sinais de emergência: quando ir ao veterinário agora',
      texto:
`Procure um veterinário imediatamente (de preferência uma clínica 24 horas) se o pet tiver: dificuldade para respirar, gengivas muito pálidas, azuladas ou arroxeadas, convulsão, desmaio ou colapso, sangramento que não para, trauma forte (atropelamento, queda, briga), suspeita de ter comido veneno ou substância tóxica, ou incapacidade de urinar.

Também é urgência quando o abdômen fica inchado e duro, ou quando o pet tenta vomitar sem conseguir. Esse quadro é mais perigoso em cães grandes e de peito profundo.

Gato que faz esforço na caixa de areia sem urinar, ou entra e sai da caixa repetidamente, precisa de atendimento rápido, principalmente se for macho.

Na dúvida sobre a gravidade, ligue para a clínica antes de decidir esperar.`
    },
    {
      id: 'pet-alimentos-toxicos', tema: 'pet', titulo: 'Alimentos e plantas perigosos para cães e gatos',
      texto:
`Alimentos que não devem ser oferecidos a cães e gatos: chocolate, uva e uva-passa, cebola, alho, álcool, café e outros produtos com cafeína, massa de pão crua, nozes-macadâmia e qualquer produto com xilitol (um adoçante presente em alguns chicletes, doces e pastas de amendoim).

Ossos cozidos podem lascar e machucar o pet. Restos de comida temperada e gordurosa também fazem mal.

Para gatos, lírios são extremamente perigosos: mesmo pequenas quantidades da planta podem causar problema nos rins. Se o gato mastigou ou lambeu um lírio, procure o veterinário.

Se você não tem certeza de que um alimento ou planta é seguro, não ofereça e pergunte ao veterinário.`
    },
    {
      id: 'pet-intoxicacao', tema: 'pet', titulo: 'O que fazer se o pet comeu algo perigoso',
      texto:
`Se suspeitar que o pet comeu algo tóxico, ligue para o veterinário ou para uma clínica 24 horas imediatamente, sem esperar aparecerem sintomas. Informe o que foi ingerido, a quantidade aproximada, o horário e o peso do pet.

Não provoque vômito por conta própria, a não ser que o veterinário oriente. Em alguns casos o vômito piora a situação.

Se possível, leve a embalagem do produto ou uma foto dela.`
    },
    {
      id: 'pet-remedios-humanos', tema: 'pet', titulo: 'Remédios humanos e doses de medicamento',
      texto:
`Não dê remédio de uso humano ao pet por conta própria. Medicamentos comuns, como paracetamol e ibuprofeno, podem ser muito perigosos para cães e principalmente para gatos.

A dose de qualquer medicamento depende da espécie, do peso, da idade e do problema do pet. Por isso o PetFit não informa doses: quem define o remédio e a dose é o veterinário.

Guarde todos os medicamentos, de humanos e do pet, fora do alcance dele.`
    },
    {
      id: 'pet-medicacao-rotina', tema: 'pet', titulo: 'Dar medicação ao pet no dia a dia',
      texto:
`Siga exatamente a receita do veterinário: remédio, horário e duração do tratamento. Não pare o tratamento antes do prazo só porque o pet melhorou, a menos que o veterinário diga que pode.

Se esquecer uma dose, ou o pet cuspir ou vomitar o remédio, não repita a dose por conta própria. Ligue para o veterinário e pergunte o que fazer.

Criar um hábito de Medicação no PetFit, com o horário certo, ajuda a lembrar. Perguntas sobre o remédio, a bula ou efeitos devem ir ao veterinário ou ao farmacêutico.`
    },
    {
      id: 'pet-vacinas', tema: 'pet', titulo: 'Vacinas e vermífugo',
      texto:
`A vacinação protege contra doenças graves. Cães e gatos recebem vacinas múltiplas e a vacina antirrábica, e filhotes precisam de uma série de doses no início da vida.

O calendário de vacinas e de vermífugo depende da idade, do histórico do pet e da região onde vive. Quem define esse calendário é o veterinário.

Muitos municípios fazem campanhas anuais de vacinação antirrábica. Vale consultar a prefeitura ou a vigilância em saúde da sua cidade.`
    },
    {
      id: 'pet-pulgas-carrapatos', tema: 'pet', titulo: 'Pulgas, carrapatos e vermes',
      texto:
`Pulgas e carrapatos causam coceira e podem transmitir doenças, por isso a prevenção é importante. Depois de passeios em grama, parques e terrenos, olhe a pele do pet, principalmente orelhas, axilas, virilha e entre os dedos.

Use somente produtos antiparasitários indicados pelo veterinário e adequados à espécie, ao peso e à idade do pet.

Atenção: produtos de uso em cães que contêm permetrina podem ser tóxicos para gatos. Nunca use em gato um produto feito para cachorro.`
    },
    {
      id: 'pet-calor', tema: 'pet', titulo: 'Calor, golpe de calor e asfalto quente',
      texto:
`Pets sofrem com o calor. Nunca deixe o pet dentro de um carro fechado, nem por pouco tempo. Em dias quentes, passeie em horários mais frescos, leve água e procure sombra.

Sinais de golpe de calor: respiração muito ofegante, muita saliva, gengivas muito vermelhas, fraqueza, vômito ou desmaio. É uma emergência. Leve o pet para um local fresco e ventilado, ofereça água, molhe o corpo com água fresca (não gelada) e procure um veterinário com urgência.

Cães de focinho achatado (como bulldog, pug e shih-tzu) e gatos de focinho achatado têm mais risco. Pets idosos, filhotes e com excesso de peso também.

O asfalto e a areia quentes podem queimar as patas. Encoste a palma da mão no chão: se você não aguenta ficar com ela ali por cerca de 5 segundos, está quente demais para o pet.`
    },
    {
      id: 'pet-peso-alimentacao', tema: 'pet', titulo: 'Peso, alimentação e água',
      texto:
`O excesso de peso é comum e prejudica as articulações, o coração e a disposição do pet. Para avaliar, passe a mão pelas costelas: elas devem ser sentidas sem esforço, sem pressão forte. Olhando de cima, deve haver uma cintura visível.

Dê a ração na quantidade indicada na embalagem para o peso e a idade do pet, ou a que o veterinário recomendou. Petiscos não devem passar de cerca de 10% das calorias do dia.

Mudanças de ração devem ser graduais, ao longo de alguns dias, para evitar problemas de barriga. Deixe sempre água fresca e limpa à disposição. Se o pet passar a beber ou urinar muito mais que o normal, converse com o veterinário.`
    },
    {
      id: 'pet-dentes', tema: 'pet', titulo: 'Saúde bucal e escovação dos dentes',
      texto:
`Escovar os dentes do pet com regularidade ajuda a prevenir tártaro e problemas de gengiva. Use escova e pasta feitas para pets. Nunca use pasta de dente humana, porque ela não é feita para ser engolida pelo pet.

Comece devagar: deixe o pet cheirar e provar a pasta, escove poucos dentes por vez e dê um elogio ou carinho ao final.

Procure o veterinário se notar mau hálito forte e persistente, tártaro, gengiva vermelha ou sangrando, dificuldade para mastigar ou o pet deixar de comer.`
    },
    {
      id: 'pet-pele-pelo-orelha-unha', tema: 'pet', titulo: 'Pelo, pele, banho, orelhas e unhas',
      texto:
`A escovação do pelo tira pelos soltos, evita nós e permite ver a pele. A frequência depende do tipo de pelo: pelos longos pedem escovação mais frequente.

Use shampoo próprio para pets, pois o produto humano não é adequado para a pele deles. Seque bem, principalmente dobras de pele e orelhas.

Coçar muito, perder pelo em falhas, feridas, caroços novos ou pele vermelha merecem avaliação do veterinário. O mesmo vale para orelhas com cheiro forte, secreção ou quando o pet balança a cabeça e coça a orelha com frequência.

Ao cortar as unhas, evite a parte interna (o "vivo"), que tem vasos sanguíneos e dói se cortada. Na dúvida, peça para um veterinário ou tosador mostrar como fazer.`
    },
    {
      id: 'pet-vomito-diarreia', tema: 'pet', titulo: 'Vômito, diarreia e perda de apetite',
      texto:
`Um episódio isolado de vômito ou fezes moles, com o pet ativo, bebendo água e comendo normalmente, pode ser apenas observado por um tempo.

Procure o veterinário se o vômito ou a diarreia se repetirem, se houver sangue, se o pet estiver muito quieto, sem forças, com dor na barriga, ou se não quiser beber água.

Filhotes, idosos e pets com outras doenças desidratam mais rápido e devem ser avaliados mais cedo.

Gato que fica mais de um dia sem comer merece avaliação veterinária, pois ficar muito tempo sem se alimentar pode causar problemas no fígado.`
    },
    {
      id: 'pet-sinais-dor', tema: 'pet', titulo: 'Sinais de dor e mudanças de comportamento',
      texto:
`Pets escondem a dor. Fique atento a mudanças: hesitar para pular ou subir escadas, andar mais devagar, ficar quieto ou isolado, lamber ou morder sempre o mesmo ponto, gemer ao ser tocado, mudar o apetite ou ficar agressivo sem motivo.

Gatos costumam esconder ainda mais e podem demonstrar dor só com mudanças sutis, como deixar de se limpar ou de usar a caixa de areia.

Esses sinais não dão um diagnóstico, mas são motivo para marcar uma consulta. Não dê remédio por conta própria.`
    },
    {
      id: 'pet-gatos', tema: 'pet', titulo: 'Cuidados específicos com gatos',
      texto:
`Gatos precisam de caixa de areia limpa e em local calmo. Uma regra comum é ter uma caixa para cada gato e mais uma extra. Mudanças no jeito de urinar (esforço, sangue, urinar fora da caixa) devem ser vistas pelo veterinário rápido.

Eles precisam de arranhador, locais altos para subir e brincadeiras que imitam a caça, como varinhas com pena. Sessões curtas e frequentes funcionam bem.

Mantenha água fresca em mais de um ponto da casa. Plantas como lírios são perigosas para gatos.`
    },
    {
      id: 'pet-caes-exercicio', tema: 'pet', titulo: 'Exercício e passeio para cães',
      texto:
`A necessidade de exercício varia com a raça, a idade, o porte e a saúde do cão. Passeios diários, com tempo para cheirar, fazem bem ao corpo e à mente.

Aumente a intensidade aos poucos. Sinais de que o cão precisa parar e descansar: ofegar demais, diminuir o passo, deitar no caminho ou se recusar a andar. Leve água para o cão.

Filhotes em crescimento devem fazer atividades curtas e sem impacto excessivo nas articulações. Cães idosos ou com dor nas articulações precisam de passeios mais leves. Em caso de doença ou dor, pergunte ao veterinário qual atividade é adequada.`
    },
    {
      id: 'pet-filhotes-idosos', tema: 'pet', titulo: 'Filhotes e pets idosos',
      texto:
`Filhotes precisam de vacinas, vermífugo, alimentação própria para a idade, descanso e socialização gradual. Não devem fazer exercícios intensos ou de muito impacto.

Pets idosos se beneficiam de consultas de rotina mais frequentes, de camas confortáveis, de piso que não escorregue e de atividades leves e regulares. Dificuldade para levantar, subir degraus ou mudanças de apetite e de sede devem ser avaliadas.

Uma consulta de rotina com o veterinário ao menos uma vez por ano é uma boa prática para pets adultos.`
    },
    {
      id: 'pet-comportamento', tema: 'pet', titulo: 'Tédio, ansiedade e enriquecimento',
      texto:
`Pets entediados ou ansiosos podem latir, destruir objetos, arranhar móveis ou ficar agitados. Passeios, brincadeiras, brinquedos recheáveis, jogos de farejar e tempo de atenção ajudam a gastar energia e a relaxar.

Mantenha uma rotina previsível de comida, passeio e descanso. Mudanças bruscas estressam muitos pets.

Se o comportamento mudou de repente, pode haver dor ou doença: converse com o veterinário. Em casos de ansiedade intensa, procure um veterinário ou profissional de comportamento animal.`
    },
    {
      id: 'pet-primeiros-socorros', tema: 'pet', titulo: 'Primeiros socorros básicos',
      texto:
`Sangramento: pressione o local com um pano ou gaze limpa e leve o pet ao veterinário. Não retire objetos cravados na pele.

Convulsão: afaste móveis e objetos, mantenha o ambiente calmo e não coloque a mão na boca do pet. Marque quanto tempo dura e leve ao veterinário logo depois, ou chame ajuda imediatamente se durar muito ou se repetir.

Pet ferido pode morder por causa da dor, mesmo sendo dócil. Se precisar levantar o pet, faça com cuidado e, se possível, com ajuda de outra pessoa.

Primeiros socorros não substituem o atendimento veterinário.`
    },

    /* ───────────────── DUPLA: PET + TUTOR TRABALHANDO JUNTOS ───────────────── */
    {
      id: 'dupla-por-que-juntos', tema: 'dupla', titulo: 'Cuidar da saúde do pet e do tutor juntos',
      texto:
`A ideia do PetFit é que a rotina do pet seja também a rotina de movimento do tutor. Passear, brincar e escovar são tarefas que já acontecem todo dia e podem ganhar um pequeno exercício para o tutor.

Comece com metas realistas e aumente aos poucos. Constância vale mais que intensidade: poucos minutos todos os dias criam o hábito.

Descanso também faz parte do cuidado. Pet e tutor precisam de dias mais leves.`
    },
    {
      id: 'dupla-meta-oms', tema: 'dupla', titulo: 'Quanto o tutor deve se mexer',
      texto:
`A Organização Mundial da Saúde recomenda que adultos façam de 150 a 300 minutos de atividade física aeróbica moderada por semana. Passeios em ritmo animado com o pet podem ajudar a chegar nessa meta.

Se você está começando, comece com menos e aumente aos poucos. Quem tem problema de saúde, dor ou está há muito tempo sem se exercitar deve conversar antes com um médico ou profissional de educação física.`
    },
    {
      id: 'dupla-ideias-cachorro', tema: 'dupla', titulo: 'Atividades para fazer com o cachorro',
      texto:
`Passeio ativo: caminhe em ritmo mais animado e, em área segura, alterne trechos mais rápidos com trechos mais calmos.

Aproveite as pausas em que o cão fareja: faça afundos, elevação de panturrilha ou alongue as pernas. Ao recolher o cocô, agache de verdade, com as costas retas.

Brincar de bola ou de buscar: agache a cada arremesso. Em casa, subir e descer a escada com calma, jogos de esconder petiscos e brincadeiras de puxar a corda também movimentam os dois.

Termine o passeio com um alongamento das pernas e ofereça água ao cão.`
    },
    {
      id: 'dupla-ideias-gato', tema: 'dupla', titulo: 'Atividades para fazer com o gato',
      texto:
`Brincar com varinha ou pena é uma boa atividade para o gato, e o tutor pode aproveitar para agachar, alongar os braços e se movimentar enquanto conduz a brincadeira. Prefira sessões curtas e frequentes.

Ao limpar a caixa de areia, agache com as costas retas em vez de se curvar. Alongue as costas e os ombros depois.

Respeite o gato: se ele perder o interesse ou se afastar, encerre a brincadeira.`
    },
    {
      id: 'dupla-seguranca', tema: 'dupla', titulo: 'Segurança ao se exercitar com o pet',
      texto:
`Use guia curta e firme e nunca enrole a guia na mão. Corra só onde não há trânsito e onde é seguro para o pet.

Faça um breve aquecimento antes e um alongamento depois. Leve água para os dois e evite os horários mais quentes do dia.

Observe o pet: ofegar demais, diminuir o passo, deitar ou recusar andar são sinais para parar. Filhotes, idosos, pets com excesso de peso e de focinho achatado cansam mais rápido.

Use calçado adequado, atenção ao piso escorregadio e, à noite, escolha locais iluminados e evite exercícios com saltos.`
    },
    {
      id: 'dupla-rotina-petfit', tema: 'dupla', titulo: 'Montar uma rotina com o PetFit',
      texto:
`Use os hábitos como âncoras: associe o exercício do tutor a tarefas que você já faz com o pet, como o passeio, a brincadeira e a escovação.

Defina horários fixos nos hábitos para criar rotina. Dê títulos específicos, como "Passeio no parque" ou "Brincar de bola", para o app escolher exercícios que combinem melhor.

Para manter a sequência, conclua pelo menos 50% dos hábitos do dia. Acompanhe o Progresso do Dia e a Energia da Dupla para ver como está o dia, e a aba Evolução para ver a semana.`
    },
    {
      id: 'dupla-profissionais', tema: 'dupla', titulo: 'Quando procurar um profissional',
      texto:
`Para o pet, o veterinário é quem avalia a saúde, define vacinas, remédios e o nível de atividade adequado. Para o tutor, médico ou profissional de educação física podem orientar o exercício, especialmente quem tem doenças, dores ou limitações.

O PetFit e este assistente dão orientações gerais de bem-estar e não substituem uma consulta.`
    }
  ]
};
