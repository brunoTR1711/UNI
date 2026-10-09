# Diagnóstico da animação do dado no PC/Android

Sintoma relatado:

- No Android local (`localhost:3000`) a animação dos números funciona.
- No PC acessando o tablet pelo IP Tailscale (`100.x.x.x:3000`) o som toca, mas a animação pula direto para o resultado final.

## Causas encontradas no código

### 1. O overlay usava uma chave de rolagem diferente do servidor

O servidor emitia a rolagem com um `rollId`, mas o overlay montava o HTML usando outra chave baseada em:

```txt
personagem:recurso:horario:resultado
```

Resultado: os eventos `dice:frame` chegavam no PC, mas não encontravam o elemento visual correto para atualizar.

Corrigido: agora overlay, ficha e mestre usam `roll.id` / `roll.key` como primeira opção.

### 2. Telas remotas dependiam do `state:update` para criar o bloco visual do dado

No Android, a própria tela que clicava parecia começar a animação corretamente. Em telas remotas, principalmente PC/OBS via Tailscale, o som chegava, mas o bloco visual podia só ser criado quando o estado já estava finalizado.

Corrigido: agora o evento `dice:roll` força ficha, mestre e overlay remotos a criarem/renderizarem a rolagem imediatamente, antes do resultado final.

### 3. Havia uma recursão acidental no encerramento da rolagem

Quando o servidor enviava o frame final, a função local de finalizar podia chamar ela mesma de novo. Isso podia travar a atualização visual ou fazer a tela cair direto no estado final.

Corrigido: removida a recursão e protegidos os timers.

### 4. Cache do navegador/OBS

A versão continua usando headers `no-store` e `?v=59` nos scripts e CSS para obrigar PC e OBS a carregarem o JavaScript novo.

## Teste recomendado

1. Fechar o servidor antigo.
2. Iniciar a pasta nova.
3. Abrir no Android: `http://localhost:3000`.
4. Abrir no PC: `http://100.x.x.x:3000/mestre` ou `/overlay`.
5. Dar Ctrl+F5 no PC.
6. No OBS, remover e recriar a fonte de navegador se ela ainda usar cache.

