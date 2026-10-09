# Rodar o servidor no Redmi Pad 2 / Android

Esta versão permite que o **tablet rode o servidor**. O Redmi Pad 2 vira a máquina principal do painel: mestre, jogadores e OBS acessam o endereço IP do tablet pela rede Wi-Fi.

## O que você precisa instalar no tablet

1. Instale o **Termux**.
   - Preferencialmente pela F-Droid.
   - A versão da Play Store costuma ser antiga.
2. Instale um app para extrair ZIP, se o gerenciador de arquivos do tablet não extrair sozinho.
3. Extraia a pasta `alem-da-nevoa-sheet` para algum lugar fácil, por exemplo:

```txt
Downloads/alem-da-nevoa-sheet
```

## Primeira instalação

Abra o Termux e rode:

```bash
termux-setup-storage
```

Aceite a permissão de arquivos.

Depois entre na pasta do projeto. Normalmente fica assim:

```bash
cd /sdcard/Download/alem-da-nevoa-sheet
```

Se a pasta estiver em `Downloads`, também pode ser:

```bash
cd /sdcard/Downloads/alem-da-nevoa-sheet
```

Agora rode:

```bash
chmod +x INSTALAR_ANDROID_TERMUX.sh INICIAR_ANDROID_TERMUX.sh
./INSTALAR_ANDROID_TERMUX.sh
```

Esse passo instala o Node.js e as dependências.

## Abrir o servidor

Depois da instalação, sempre que quiser abrir a mesa, rode:

```bash
cd /sdcard/Download/alem-da-nevoa-sheet
./INICIAR_ANDROID_TERMUX.sh
```

ou, se sua pasta estiver em `Downloads`:

```bash
cd /sdcard/Downloads/alem-da-nevoa-sheet
./INICIAR_ANDROID_TERMUX.sh
```

O Termux vai mostrar endereços parecidos com:

```txt
http://192.168.0.23:3000
```

Esse é o endereço do tablet na rede.

## Como abrir no próprio tablet

No navegador do Redmi Pad 2, abra:

```txt
http://localhost:3000
```

ou:

```txt
http://127.0.0.1:3000
```

## Como abrir em outros celulares/computadores

Todos precisam estar no mesmo Wi-Fi do tablet.

No outro aparelho, abra o IP mostrado pelo Termux, por exemplo:

```txt
http://192.168.0.23:3000
```

Rotas principais:

```txt
/mestre       Painel do mestre
/jogadores    Seleção de personagens/fichas
/jogador/id   Ficha de personagem
/overlay      Overlay geral
/overlay/id   Overlay individual
/efeitos      Efeitos visuais da stream
```

## Como usar com OBS no PC

Se o servidor estiver rodando no tablet, o OBS do PC deve usar o IP do tablet.

Exemplo de fonte Navegador no OBS:

```txt
http://192.168.0.23:3000/overlay
```

ou overlay individual:

```txt
http://192.168.0.23:3000/overlay/leandro
```

A resolução recomendada do overlay individual continua:

```txt
960 x 720
```

## Importante para não cair no meio da sessão

No Redmi Pad 2:

- deixe o tablet carregando;
- desligue economia de bateria para o Termux;
- não feche o Termux;
- deixe a tela ligada ou use o bloqueio de energia do Termux;
- mantenha todos os dispositivos no mesmo Wi-Fi;
- se o IP do tablet mudar, atualize o link no OBS e nos celulares.

## Se der erro `npm: command not found`

Rode de novo:

```bash
pkg install nodejs -y
npm install
```

## Se não conseguir acessar de outro aparelho

Confira:

1. O outro aparelho está no mesmo Wi-Fi?
2. O servidor está rodando no Termux?
3. O endereço usado é o IP do tablet, não o IP do PC?
4. O link tem `:3000` no final?
5. O roteador não está com isolamento de clientes Wi-Fi ativado?

## Parar o servidor

No Termux, aperte:

```txt
CTRL + C
```
