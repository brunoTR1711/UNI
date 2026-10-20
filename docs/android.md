# Android e Termux

## Usar o Android apenas como ficha

Inicie o servidor no computador. No navegador do celular ou tablet, abra o endereço de rede exibido pelo servidor, por exemplo `http://IP-DO-PC:3000/jogadores`.

## Usar o Android como servidor

Com o Termux instalado, mantenha a pasta do projeto em um local acessível. Nos exemplos abaixo ela está em `Download/UNI`; ajuste o caminho conforme o nome e o local da sua pasta.

Se os arquivos estiverem no armazenamento compartilhado, autorize o acesso:

```bash
termux-setup-storage
cd /sdcard/Download/UNI
```

Na primeira execução, instale as dependências:

```bash
bash scripts/android/INSTALAR_ANDROID_TERMUX.sh
```

Para iniciar o servidor:

```bash
bash scripts/android/INICIAR_ANDROID_TERMUX.sh
```

Os scripts localizam a raiz do projeto a partir da própria pasta. O uso de `bash` dispensa alterar a permissão de execução dos arquivos.

No próprio tablet, abra `http://localhost:3000`. Nos demais aparelhos da rede e no OBS, use o endereço IP mostrado pelo servidor, incluindo a porta `:3000`.

| Caminho | Tela |
| --- | --- |
| `/mestre` | Painel do mestre |
| `/jogadores` | Seleção de fichas |
| `/jogador/ID` | Ficha individual |
| `/overlay` | Overlay geral |
| `/overlay/ID` | Overlay individual |
| `/efeitos` | Efeitos da stream |

As configurações de OBS e áudio estão no [README](../README.md#obs-e-áudio).

## Durante a sessão

- Mantenha o Termux aberto e o aparelho com energia suficiente.
- O script tenta manter o dispositivo acordado com `termux-wake-lock`.
- Confira as restrições de bateria do Termux caso o servidor seja suspenso.
- Na rede local, use o mesmo Wi-Fi e atualize os links caso o IP do servidor mude.
- Para encerrar normalmente, pressione **Ctrl+C** no Termux.

## Atualizar

Com o projeto clonado pelo Git, execute a partir da raiz:

```bash
bash scripts/android/ATUALIZAR_TERMUX.sh
```

As instruções de instalação via Git, atualização e preservação da mesa estão em [Manutenção](manutencao.md).

## Diagnóstico

Se o Node.js ou o npm não estiverem disponíveis:

```bash
pkg install nodejs -y
npm ci
```

Se outro aparelho não acessar, confira se o servidor está rodando, se o endereço é o IP do tablet com a porta correta e se a rede permite comunicação entre dispositivos.

Para um atalho no Android, abra a página no navegador e use a opção de adicionar à tela inicial, quando disponível.
