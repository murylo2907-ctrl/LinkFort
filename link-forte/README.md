# Link Forte – Backup / Réplica do Site

Réplica estática organizada do site [linkforte.com.br](https://linkforte.com.br), extraída via API pública WordPress/WooCommerce para backup e recuperação enquanto o painel admin não estiver acessível.

## Estrutura do projeto

```
link-forte/
├── README.md                 ← este arquivo
├── package.json              ← scripts npm
├── scripts/
│   └── build.mjs             ← baixa imagens e gera JSON de dados
├── _raw/                     ← dados brutos extraídos do site original
│   ├── home.html
│   ├── pages.json
│   ├── products.json
│   └── ...
└── site/                     ← site estático pronto para publicar
    ├── index.html            ← página inicial
    ├── loja.html             ← catálogo completo
    ├── produto.html          ← detalhe do produto (?slug=...)
    ├── quem-somos.html
    ├── seja-parceiro.html
    ├── contato.html
    ├── assets/
    │   ├── css/style.css
    │   ├── js/main.js
    │   └── images/           ← logo, hero e fotos dos produtos
    └── data/
        ├── products.json     ← 10 produtos com preços
        ├── pages.json        ← conteúdo das páginas
        └── site.json         ← dados gerais da empresa
```

## O que foi extraído

| Item | Status |
|------|--------|
| 10 produtos WooCommerce (nome, preço, imagem, descrição) | ✅ |
| Páginas: Quem Somos, Seja Parceiro, Contato | ✅ |
| Logo, imagem hero, fotos dos produtos | ✅ |
| Telefone, e-mail, endereço, CNPJ, redes sociais | ✅ |
| Carrinho / checkout / pagamento integrado | ❌ (precisa WordPress) |
| Painel admin para editar conteúdo | ❌ (precisa recuperar hosting) |

## Como visualizar localmente

```bash
cd link-forte
npm run serve
```

Abra [http://localhost:3000](http://localhost:3000)

Ou abra `site/index.html` diretamente no navegador (alguns recursos JSON podem exigir servidor local).

## Atualizar dados do site original

Se o site original mudar, rode novamente:

```bash
cd link-forte

# Baixar dados atualizados (requer internet)
curl.exe -s "https://linkforte.com.br/wp-json/wc/store/v1/products?per_page=100" -o _raw/products.json
curl.exe -s "https://linkforte.com.br/wp-json/wp/v2/pages?per_page=100" -o _raw/pages.json

# Reprocessar imagens e JSON
npm run build
```

## Publicar na internet

1. Faça upload da pasta `site/` para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, cPanel).
2. Aponte o domínio `linkforte.com.br` para o novo servidor **ou** use um subdomínio temporário (ex: `novo.linkforte.com.br`).
3. Quando recuperar o WordPress original, pode substituir ou manter esta versão como fallback.

## Recuperar o WordPress original (recomendado)

1. Identificar a **hospedagem** (via WHOIS, faturas ou e-mails antigos).
2. Contatar suporte com **CNPJ 30.284.480/0001-20** e documentos.
3. Recuperar acesso FTP/cPanel → exportar banco + arquivos.
4. Resetar senha admin via phpMyAdmin se necessário.

## Limitações

- Compras redirecionam para o site original em `linkforte.com.br`.
- Formulário de contato envia via WhatsApp (não grava em banco).
- Não inclui plugins WordPress (Joinchat, SEO, etc.) – apenas equivalente visual/funcional básico.

## Empresa

**Link Forte Solucoes Digitais LTDA**  
CNPJ: 30.284.480/0001-20  
Curitiba – PR
