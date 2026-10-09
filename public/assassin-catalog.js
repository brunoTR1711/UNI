
(function(){
  const svg={
    skull:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 44v-5c-4-3-7-8-7-14 0-11 9-19 20-19s20 8 20 19c0 6-3 11-7 14v5H19Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M24 44v9M32 44v9M40 44v9" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="25" cy="27" r="3" fill="currentColor"/><circle cx="39" cy="27" r="3" fill="currentColor"/></svg>`,
    violence:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m15 49 16-34 6 13 11-5-8 26H15Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
    torment:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 11c13 0 22 10 25 21-3 11-12 21-25 21S10 43 7 32c3-11 12-21 25-21Z" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="32" r="7" fill="none" stroke="currentColor" stroke-width="4"/><path d="M15 17 9 11M55 17l-6-6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
    eye:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 14c13 0 22 10 25 18-3 8-12 18-25 18S10 40 7 32c3-8 12-18 25-18Z" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="32" r="6" fill="currentColor"/></svg>`,
    chase:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m18 40 16-16" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="m38 18 11 7-8 11" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="48" r="6" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
    drag:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 45c8 0 11-5 16-10 7-7 14-8 24-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="m38 18 14 9-8 14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19" cy="46" r="7" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
    break:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 13 49 45M47 13 15 45" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><rect x="12" y="12" width="40" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
    ritual:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 39 23l18 2-14 12 4 18-15-9-15 9 4-18L7 25l18-2 7-17Z" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="33" r="7" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
    target:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 4v13m0 30v13M4 32h13m30 0h13" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
    hands:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 52 9 34c-1-4 4-6 6-2l4 8-2-18c0-4 5-5 6-1l3 16V16c0-4 5-4 6 0l1 19 2-17c1-4 6-3 6 1l-1 18 3-13c1-4 6-3 6 1l-2 22c-1 7-6 11-14 11h-6c-6 0-10-2-12-6Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
    bloodlust:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8c7 11 14 18 14 28a14 14 0 1 1-28 0c0-10 7-17 14-28Z" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
    drop:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8c7 11 14 18 14 28a14 14 0 1 1-28 0c0-10 7-17 14-28Z" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
    face:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" stroke-width="4"/><path d="M24 26c2-3 5-4 8-4s6 1 8 4M25 40c5 3 9 4 14 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="25" cy="31" r="2" fill="currentColor"/><circle cx="39" cy="31" r="2" fill="currentColor"/></svg>`,
    hook:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M40 12c4 0 8 3 8 8v18c0 11-8 19-19 19-9 0-15-6-15-15 0-8 5-14 13-14 7 0 11 5 11 11 0 5-3 8-8 8-4 0-6-3-6-6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    web:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 12v40M12 32h40M18 18l28 28M46 18 18 46" stroke="currentColor" stroke-width="3"/></svg>`,
    broken:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 44 44 20" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`,
    exhausted:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 46c0-10 5-18 10-24 5 6 10 14 10 24" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 50h24" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
    clover:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="23" cy="23" r="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="41" cy="23" r="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="23" cy="41" r="8" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="41" cy="41" r="8" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 32v20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`
  };
  const styles = [
    { key:'bestial', nome:'BESTIAL', violencia:4, tormento:1, descricao:'Criaturas animalescas e monstruosas, podendo ter características humanoides ou não. Seu objetivo nunca é algo muito elaborado.', package:'bestial', accent:'#e96b1a' },
    { key:'espiritual', nome:'ESPIRITUAL', violencia:0, tormento:5, descricao:'Assassinos fantasmagóricos, espíritos ou demônios que atormentam lentamente e amaldiçoam lugares específicos.', package:'espiritual', accent:'#8dbde8' },
    { key:'maligno', nome:'MALIGNO', violencia:1, tormento:4, descricao:'Extensões de uma força maior. Atormentam suas vítimas em nome de algo mais antigo e cruel.', package:'maligno', accent:'#b16cff' },
    { key:'furtivo', nome:'FURTIVO', violencia:2, tormento:3, descricao:'Stalkers e predadores que perseguem sem serem percebidos, aparecendo de surpresa.', package:'furtivo', accent:'#7ac7d9' },
    { key:'louco', nome:'LOUCO', violencia:3, tormento:2, descricao:'Assassinos guiados por propósito, obsessão ou caos. Seus objetivos causam dor e sofrimento.', package:'louco', accent:'#e2d25e' },
    { key:'acougueiro', nome:'AÇOUGUEIRO', violencia:5, tormento:0, descricao:'Assassinos sanguinários e brutais. Seu modo de agir é visceral, cortando e desmembrando suas vítimas.', package:'acougueiro', accent:'#d1252f' }
  ];
  const abilities = [
    { key:'puxar', nome:'PUXAR', icon:'drag', descricao:'Ainda não acabou. O último sobrevivente que fugir da perseguição pode ser puxado de volta.' },
    { key:'separar', nome:'SEPARAR', icon:'hands', descricao:'Dividir para conquistar. Arraste um sobrevivente para outra sala, iniciando uma perseguição apenas com ele.' },
    { key:'possuir', nome:'POSSUIR', icon:'ritual', descricao:'Seres metafísicos podem habitar corpos vivos. Escolha um sobrevivente para tomar a ação dele no turno dele.' },
    { key:'quebrar', nome:'QUEBRAR', icon:'break', descricao:'Seus golpes são pesados. Seu próximo golpe deixa o alvo sob o efeito Quebrado até o fim do jogo.' },
    { key:'amplificar', nome:'AMPLIFICAR', icon:'violence', descricao:'Seu golpe é amplificado e poderoso. Seu próximo golpe acerta 2 sobreviventes ao mesmo tempo.' },
    { key:'arremessar', nome:'ARREMESSAR', icon:'chase', descricao:'Os obstáculos são úteis pra você. Destrua um obstáculo e arremesse em um sobrevivente, golpeando e deixando-o Incapacitado.' },
    { key:'retaliar', nome:'RETALIAR', icon:'hook', descricao:'Habilidade passiva. O assassino tem um turno após o turno de cada jogador.' },
    { key:'rasgar', nome:'RASGAR', icon:'drop', descricao:'Sofrimento é o tempero. Seus golpes causam Ferida Profunda.' },
    { key:'aviso', nome:'AVISO', icon:'face', descricao:'Você deixa rastros propositais para avisar suas presas. O sobrevivente vê seu rastro sangrento e realiza um teste de Foco; se falhar, você ganha azar.' },
    { key:'atormentar', nome:'ATORMENTAR', icon:'torment', descricao:'Entre na mente dos sobreviventes. O sobrevivente alucina e realiza um teste de Foco; se falhar, recebe dano.' },
    { key:'horda', nome:'HORDA', icon:'web', descricao:'Um é ruim, mas uma horda é pior. Você participa de uma perseguição em 3 turnos diferentes, participando da rolagem de iniciativa.' },
    { key:'infectar', nome:'INFECTAR', icon:'bloodlust', descricao:'A doença é fatal. Ao golpear um sobrevivente, ele fica infectado até ser curado; sempre que for seu turno, testa Foco. Se falhar, perde o turno.' },
    { key:'febre', nome:'FEBRE', icon:'face', descricao:'Ataque o corpo do hospedeiro. O sobrevivente realiza um teste de Fôlego; se falhar, fica Incapacitado.' },
    { key:'acidente', nome:'ACIDENTE', icon:'break', descricao:'Estava fadado a acontecer. O sobrevivente realiza um teste de Fôlego; se falhar, sofre dano.' },
    { key:'karma', nome:'KARMA', icon:'clover', descricao:'É hora de acertar as contas. O sobrevivente realiza um teste cooperativo; se falhar, sofre dano.' },
    { key:'premonicao', nome:'PREMONIÇÃO', icon:'eye', descricao:'Um pequeno vislumbre. O sobrevivente vê sua morte e realiza um teste de cada atributo; se falhar, perde 1 stack permanentemente. Se não tiver mais stacks, recebe dano.' },
    { key:'sabotagem', nome:'SABOTAGEM', icon:'hands', descricao:'Ninguém viu nada. Remova um sucesso de fuga ou de cura de um sobrevivente.' },
    { key:'alibi', nome:'ALIBI', icon:'chase', descricao:'Habilidade passiva. Sempre que um jogador for curado, recebe azar.' },
    { key:'revelacao', nome:'REVELAÇÃO', icon:'skull', descricao:'Bem vindos ao ato 3. Inicia uma perseguição com um golpe surpresa e uma ação bônus.' }
  ];
  const advantages = [
    ['Enganei Você!','Uma saída a menos para vocês. Permite bloquear uma das saídas disponíveis durante a perseguição.','target'],
    ['Morte de Franklin','Quem pode usar itens sou eu! Ao golpear um sobrevivente, faz com que ele perca qualquer item que esteja carregando.','hands'],
    ['Ninguém Escapa da Morte','Uma surpresa desagradável no final. Durante uma perseguição, a partir da terceira rodada, todos ficam Expostos.','skull'],
    ['Açougueiro Desleixado','Seus cortes são mais profundos. Aumenta em 1 os sucessos para ajudar um sobrevivente golpeado.','drop'],
    ['Insidioso','Sua presença é indetectável. Pode realizar ataques surpresa sem iniciar uma perseguição. Gasta 1 ponto de Sede de Sangue.','eye'],
    ['Implacável','Sua vontade de ferir é insaciável. Quando um golpe falhar por qualquer motivo, pode golpear novamente. Pode mudar de alvo caso queira.','hook'],
    ['Lembre-se de Mim','É impossível esquecer o pesadelo que você cria. Aumenta em 1 o número de sucessos necessários para fugir para cada sobrevivente que escape.','target'],
    ['Terceiro Selo','O desespero toma conta. Após golpear um sobrevivente, ele sofre do efeito Alheio por todo o jogo.','face'],
    ['Nascido da Luz','Você é imune à luz. A ação Cegar não tem efeito contra você, e ao ser cegado fica enfurecido.','eye'],
    ['Perdendo a Esperança','A sua obsessão vai perder todos à sua volta. Todos, exceto a Obsessão, têm dificuldade de fuga aumentada em 1 sucesso.','target'],
    ['Brinque com a Sua Comida','Sua sede de sangue aumenta quando vê sua obsessão sofrer. Sempre que a Obsessão tentar fugir, os outros perdem 1 ponto de Foco.','bloodlust'],
    ['Presença Desconcertante','Sua presença causa pavor em todos. Durante uma perseguição, todos os testes recebem -3 no resultado.','torment'],
    ['Resistência','Você é extremamente tolerante à dor. Você é imune ao primeiro atordoamento da perseguição.','violence'],
    ['Soberba','Eles vão se arrepender de se meter no seu caminho. Depois que um sobrevivente atordoar você, ele fica Exposto pelo resto da perseguição.','target'],
    ['Tanatofobia','O medo da morte dificulta o progresso das vítimas. Aumenta em 1 o número de sucessos necessários para fugir para cada sobrevivente Ferido ou Em Risco.','skull'],
    ['Nêmesis','Você é capaz de punir quem quer que seja. Se a Obsessão já estiver morta, o próximo sobrevivente que realizar a ação Atordoar se torna a nova Obsessão.','target'],
    ['Faça Sua Escolha','Você põe em jogo as escolhas das vítimas. O jogador que realizar a ação Ajudar durante uma perseguição fica Exposto durante a perseguição.','hands'],
    ['Dama de Ferro','Ratinhos escondidos são capturados. Quando um jogador escondido aparecer, ele fica Exposto por uma rodada.','target'],
    ['Churrasco com Chilli','Suas vítimas não podem se esconder de você. Após golpear um sobrevivente, faz com que todos os sobreviventes escondidos apareçam.','eye'],
    ['Força Brutal','Sua capacidade de destruir é notável. Ao usar a ação Quebrar Obstáculos, destrua 3 obstáculos de uma só vez.','break'],
    ['Rancor','Sua obsessão deve pagar. Ao iniciar uma perseguição, sua obsessão fica Exposta e não pode se esconder.','target'],
    ['Pavor Contagiante','Todos vão temer o seu perigo. Após golpear a Obsessão, todos perdem 1 stack de Foco.','torment'],
    ['Eco Sanguíneo','O sangue de todos será derramado. Quando um sobrevivente for golpeado, todos os sobreviventes ficam Exaustos.','drop'],
    ['Estridor','Você nota rastros de sangue como ninguém. Sobreviventes Feridos ou Em Risco não podem se esconder durante a perseguição.','drop'],
    ['Discordância','Você se alimenta da discórdia. Falhar em testes sociais remove 1 stack de Cooperação permanentemente.','hands'],
    ['Não Há Onde se Esconder','Eles não podem se esconder para sempre. Ao quebrar um obstáculo, todos os sobreviventes escondidos são revelados.','break'],
    ['Canção de Ninar','Sua presença desmoraliza o grupo. Sempre que falhar em um teste durante a perseguição, recebe -1 no próximo resultado. Acumula até no máximo -9 e dura até o fim da perseguição.','torment'],
    ['Baterias Inclusas','Ganha um surto de energia. Quando um sobrevivente fugir da perseguição, o assassino tem seu turno adiantado. Se alguém fugir, o assassino joga em seguida.','bloodlust'],
    ['Punição Forçada','Chamar sua atenção é uma sentença de morte. Se um sobrevivente ganhar tempo e for golpeado, ele recebe Ferida Profunda.','hook'],
    ['Fúria Espiritual','Os valentões são os primeiros a morrer. Sempre que um obstáculo for usado contra você, ganhe um ponto de azar.','break'],
    ['Táticas Zanshin','Você se antecipa e se prepara. Os obstáculos necessitam 2 sucessos para serem usados.','eye'],
    ['Opressão','Você é uma máquina de destruição. Quando destruir um obstáculo, o último sobrevivente que usou um obstáculo na cena sofre um golpe.','violence'],
    ['Sem Saída','Fugir é uma péssima ideia. Quando um sobrevivente falhar em teste de fuga pela primeira vez, você ganha azar. Uma vez por jogo.','target'],
    ['Deslumbre','Testemunhem a morte e sucumbam ao meu poder. Sempre que um sobrevivente fica Em Risco, todos ficam Expostos por uma rodada.','skull']
  ].map(([nome,descricao,icon],index)=>({ key:`vantagem-${index+1}`, nome, descricao, icon }));
  const effects=[
    { key:'ferida-profunda', nome:'FERIDA PROFUNDA', icon:'drop', description:'Perde 1 Fôlego por rodada até ser curado. Encerra ao chegar a 0 Fôlego.', scene:'attackHit', intensity:'heavy', audio:'killerHitHeavy' },
    { key:'quebrado', nome:'QUEBRADO', icon:'broken', description:'Não recupera Estados de Saúde.', scene:'obstacleBreak', intensity:'heavy', audio:'killerBreak' },
    { key:'incapacitado', nome:'INCAPACITADO', icon:'hands', description:'Não pode atordoar nem cegar.', scene:'special', intensity:'medium', audio:'killerSpecial' },
    { key:'exposto', nome:'EXPOSTO', icon:'skull', description:'Próximo golpe leva a Em Risco; se já estiver Em Risco, morre.', scene:'exposed', intensity:'medium', audio:'killerExposed' },
    { key:'alheio', nome:'ALHEIO', icon:'face', description:'Não pode ficar de tocaia nem resistir.', scene:'torment', intensity:'medium', audio:'killerTorment' },
    { key:'exaustao', nome:'EXAUSTÃO', icon:'exhausted', description:'Não pode usar ações que causem exaustão.', scene:'torment', intensity:'medium', audio:'killerTorment' },
    { key:'sorte', nome:'SORTE', icon:'clover', description:'Recebe 1 rerrolagem extra.', scene:'special', intensity:'light', audio:'killerSpecial' }
  ];
  const violentActions=[
    { key:'procurar', nome:'PROCURAR', icon:'eye', label:'PROCURAR', description:'Gaste 1 Sede de Sangue e 1 ação para retirar um sobrevivente do esconderijo.', intensity:'light', audio:'killerMark' },
    { key:'golpear', nome:'GOLPEAR', icon:'violence', label:'GOLPEAR', description:'Gaste 1 ação para causar 1 Estado de Saúde de dano.', intensity:'heavy', audio:'killerHitHeavy', damage:1 },
    { key:'instalar-armadilha', nome:'INSTALAR ARMADILHA', icon:'web', label:'ARMADILHA', description:'Em cena livre, espalhe armadilhas. Quem cair recebe Ferida Profunda (perde 1 Fôlego por rodada).', intensity:'heavy', audio:'killerBreak', effectKey:'ferida-profunda', effectName:'Ferida Profunda', effectIcon:'drop', effectDescription:'Perde 1 Fôlego por rodada até ser curado.' },
    { key:'quebrar-obstaculo', nome:'QUEBRAR OBSTÁCULO', icon:'break', label:'QUEBRAR OBSTÁCULO', description:'Reduza os obstáculos da cena em 1 ou destrua o caminho até o objetivo.', intensity:'heavy', audio:'killerBreak' },
    { key:'apagar-ritual', nome:'APAGAR UM RITUAL', icon:'ritual', label:'APAGAR RITUAL', description:'Gaste 1 turno para desfazer um ritual preparado na cena.', intensity:'medium', audio:'killerSpecial' }
  ];
  const tormentActions=[
    { key:'alucinar', nome:'ALUCINAR', icon:'eye', label:'ALUCINAR', description:'O alvo testa Foco. Se falhar, fica Alheio (não pode ficar de tocaia nem resistir).', intensity:'medium', audio:'killerTorment', effectKey:'alheio', effectName:'Alheio', effectIcon:'face', effectDescription:'Não pode ficar de tocaia nem resistir.' },
    { key:'assustar', nome:'ASSUSTAR', icon:'face', label:'ASSUSTAR', description:'O alvo testa Fôlego para resistir a uma aparição repentina.', intensity:'medium', audio:'killerApparition' },
    { key:'traumatizar', nome:'TRAUMATIZAR', icon:'torment', label:'TRAUMATIZAR', description:'O alvo testa Cooperação. Se falhar, fica Quebrado (não recupera Saúde).', intensity:'heavy', audio:'killerTorment', effectKey:'quebrado', effectName:'Quebrado', effectIcon:'broken', effectDescription:'Não recupera Estados de Saúde.' },
    { key:'obcecar', nome:'OBCECAR', icon:'target', label:'OBCECAR', description:'O alvo testa Foco. Se falhar, vira a Obsessão (alvo prioritário do assassino).', intensity:'medium', audio:'killerMark', setObsession:true },
    { key:'amedrontar', nome:'AMEDRONTAR', icon:'skull', label:'AMEDRONTAR', description:'O alvo testa Foco. Se falhar, fica Alheio (não pode ficar de tocaia nem resistir) até o fim da próxima perseguição.', intensity:'medium', audio:'killerTorment', effectKey:'alheio', effectName:'Alheio', effectIcon:'face', effectDescription:'Não pode ficar de tocaia nem resistir.' }
  ];
  const sceneEvents = [
    { key:'apparition', label:'APARIÇÃO', category:'presença', intensity:'light', icon:'eye', description:'Revela a presença do assassino com tensão visual.' },
    { key:'chaseStart', label:'INICIAR PERSEGUIÇÃO', category:'caçada', intensity:'medium', icon:'chase', description:'Ativa o estado de perseguição e eleva a tensão.' },
    { key:'chaseEnd', label:'ENCERRAR PERSEGUIÇÃO', category:'caçada', intensity:'light', icon:'chase', description:'Dissipa a tensão e encerra a caçada.' },
    { key:'attackHit', label:'GOLPE ACERTADO', category:'dano', intensity:'heavy', icon:'violence', description:'Impacto, sangue e tremor forte.' },
    { key:'criticalHit', label:'GOLPE CRÍTICO', category:'dano', intensity:'extreme', icon:'violence', description:'Evento brutal com impacto máximo.' },
    { key:'attackMiss', label:'GOLPE ERRADO', category:'dano', intensity:'light', icon:'hook', description:'Passagem rápida e ruído de erro.' },
    { key:'exposed', label:'ALVO EXPOSTO', category:'controle', intensity:'medium', icon:'target', description:'Marca um sobrevivente como exposto.' },
    { key:'dragged', label:'SOBREVIVENTE ARRASTADO', category:'controle', intensity:'heavy', icon:'drag', description:'Separa um sobrevivente do grupo.' },
    { key:'obstacleBreak', label:'OBSTÁCULO DESTRUÍDO', category:'controle', intensity:'heavy', icon:'break', description:'Tremor, impacto e ruptura.' },
    { key:'special', label:'HABILIDADE ESPECIAL', category:'poder', intensity:'heavy', icon:'ritual', description:'Ativa a assinatura do assassino.' },
    { key:'torment', label:'TORMENTO', category:'poder', intensity:'medium', icon:'torment', description:'Distorção psicológica e ruído sombrio.' },
    { key:'obsession', label:'OBSESSÃO MARCADA', category:'controle', intensity:'medium', icon:'target', description:'Destaca a nova obsessão.' },
    { key:'phaseChange', label:'NOVA FASE', category:'clímax', intensity:'extreme', icon:'skull', description:'Transformação dramática do assassino.' },
    { key:'execution', label:'EXECUÇÃO', category:'clímax', intensity:'extreme', icon:'skull', description:'Finalização máxima para a transmissão.' }
  ];
  window.NEVOA_ASSASSIN_CATALOG={ svg, styles, abilities, advantages, effects, violentActions, tormentActions, sceneEvents };
})();
