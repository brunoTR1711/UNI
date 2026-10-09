# Usar no Android

Existem dois modos:

## 1. Android apenas como ficha

O servidor roda no PC e o Android acessa pelo navegador:

```txt
http://IP-DO-PC:3000
```

## 2. Android/Redmi Pad 2 como servidor

Agora esta versão inclui scripts para rodar o servidor diretamente no tablet via Termux.

Leia:

```txt
RODAR_NO_REDMI_PAD_2.md
```

Resumo rápido:

```bash
termux-setup-storage
cd /sdcard/Download/alem-da-nevoa-sheet
chmod +x INSTALAR_ANDROID_TERMUX.sh INICIAR_ANDROID_TERMUX.sh
./INSTALAR_ANDROID_TERMUX.sh
./INICIAR_ANDROID_TERMUX.sh
```

No próprio tablet:

```txt
http://localhost:3000
```

Em outros aparelhos na mesma rede, use o IP mostrado pelo Termux:

```txt
http://IP-DO-TABLET:3000
```

## Instalar como app no Android

No Chrome:

1. Abra o link do servidor.
2. Toque nos três pontos.
3. Escolha **Adicionar à tela inicial** ou **Instalar app**.
