# Manual do usuário — Zonas Colaborativas

Este manual descreve como usar o **Zonas Colaborativas**, um quadro branco online com colaboração em tempo real e zonas com regras diferentes.

---

## 1. Acesso e login

### 1.1 Entrar na aplicação

1. Abra o endereço da aplicação no navegador (em desenvolvimento: **http://localhost:3000**).
2. Na tela inicial, use o cartão de **Entrar** com seu e-mail e senha.
3. Clique em **Entrar** para acessar o quadro.

### 1.2 Criar conta

1. No cartão de login, clique em **Criar conta**.
2. Preencha **Nome**, **Email** e **Senha** (mínimo 8 caracteres).
3. Clique em **Criar conta** para registrar e entrar.

### 1.3 Sair

- No canto superior direito, clique no botão **Sair** (ou use o atalho **Ctrl+K** / **Cmd+K** e escolha **Sair**).

---

## 2. Interface principal

Após o login você verá:

- **Cabeçalho**: logo “Zonas Colaborativas”, indicador de presença (“X online” ou “Conectado”), **Notificações**, botão de **tema** (claro/escuro), seu **nome** e **Sair**.
- **Área central**: o **canvas** (quadro branco) onde você desenha e organiza conteúdo.
- **Barra de ferramentas**: acima do canvas, as ferramentas de desenho e modo zona.
- **Painel direito**: propriedades do objeto, templates, exportar, zonas, sugestões, etc.

---

## 3. Canvas — desenho e edição

### 3.1 Ferramentas

Na barra acima do canvas você pode escolher:

| Ferramenta | Uso |
|------------|-----|
| **Seleção** | Clique em um objeto para selecionar, mover, redimensionar ou apagar (Delete). |
| **Retângulo** | Arraste no canvas para desenhar um retângulo. |
| **Círculo** | Arraste para desenhar uma elipse/círculo. |
| **Linha** | Arraste do ponto inicial ao final para criar uma linha. |
| **Seta** | Arraste para criar uma linha com ponta de seta. |
| **Texto** | Clique para inserir uma caixa de texto; edite o conteúdo diretamente. |
| **Borracha** | Clique em um objeto para removê-lo do canvas. |

### 3.2 Navegação no canvas

- **Arrastar o canvas**: segure **Espaço** e arraste com o mouse para mover a vista.
- **Zoom**: use os botões **+** e **−** na barra de ferramentas para aumentar ou diminuir o zoom.
- **Grade**: o botão de grade liga/desliga a exibição da grade de fundo.

### 3.3 Edição de objetos

- Com a ferramenta **Seleção**, clique em um objeto para selecioná-lo.
- Arraste para mover; use as alças nas bordas para redimensionar.
- Use **Delete** ou **Backspace** para apagar o objeto selecionado.
- No **painel direito** (Propriedades), você pode ajustar cor, traço e outras opções do objeto selecionado.

---

## 4. Zonas

Zonas são áreas do quadro com regras diferentes (quem pode editar, fila de edição, revisão, etc.).

### 4.1 Criar uma zona

1. Na barra de ferramentas, ative **Modo zona** (botão que desenha uma área em destaque).
2. No canvas, **arraste** para desenhar o retângulo da zona.
3. Ao soltar, a zona é criada e aparece na lista **Zonas** no painel direito.

### 4.2 Gerenciar zonas

- No painel **Zonas**, clique em uma zona da lista para selecioná-la.
- Com uma zona selecionada você pode:
  - Alterar **nome** e **tipo** (Livre, Bloqueada com fila, Revisão obrigatória, Somente leitura).
  - Ajustar regras (máx. editores, tempo de edição, papéis permitidos).
  - Clicar em **Salvar** para aplicar as alterações.
  - **Excluir** a zona (a zona some do quadro e da lista).

### 4.3 Tipos de zona

- **Livre**: edição livre por qualquer um com permissão.
- **Bloqueada (Fila)**: acesso controlado por fila de edição.
- **Revisão obrigatória**: alterações passam por revisão.
- **Somente leitura**: apenas visualização.

---

## 5. Templates

No painel **Templates** você pode aplicar estruturas prontas ao quadro:

1. Clique em um dos templates listados (cada um tem nome e descrição).
2. O conteúdo atual do canvas é **substituído** pelo template.
3. A partir daí você pode editar e adicionar mais elementos.

Use templates para começar rápido (por exemplo: fluxos, organogramas, esboços).

---

## 6. Exportar

No painel **Exportar** você pode baixar o quadro nos formatos:

- **JSON**: dados do canvas (para backup ou reutilização).
- **PNG**: imagem em alta resolução.
- **SVG**: gráfico vetorial.
- **PDF**: documento em PDF (orientação paisagem, A4).

Clique no botão do formato desejado; o arquivo será baixado automaticamente.

---

## 7. Detecção automática de zonas

O painel **Detecção automática** sugere zonas com base nos objetos do canvas:

1. Desenhe pelo menos **três objetos** no canvas.
2. Clique em **Gerar sugestões**.
3. O sistema agrupa objetos por proximidade e mostra sugestões de zonas e tipos.
4. Revise as sugestões e use **Aplicar** nas que quiser criar como zonas reais.

---

## 8. Notificações

- No cabeçalho, o ícone **Notificações** mostra se há itens não lidos.
- Clique para abrir a **Central de notificações** e ver a lista (convites, revisões, etc.).
- Itens não lidos aparecem destacados.

---

## 9. Tema e atalhos

### 9.1 Tema claro/escuro

- No cabeçalho, clique no botão **☀️ / 🌙** para alternar entre tema claro e escuro.

### 9.2 Paleta de comandos (atalhos)

- Pressione **Ctrl+K** (Windows/Linux) ou **Cmd+K** (Mac) para abrir a **Paleta de comandos**.
- Digite parte do nome do comando e escolha na lista, por exemplo:
  - **Alternar tema** — muda entre claro e escuro.
  - **Sair** — encerra a sessão.

---

## 10. Colaboração em tempo real

- **Presença**: no cabeçalho, “X online” indica quantas pessoas estão no mesmo quadro no momento.
- **Sincronização**: o canvas é sincronizado em tempo real entre todos os usuários conectados (conteúdo e zonas).
- **Cursores**: em sessões colaborativas, os cursores de outros usuários podem ser exibidos no canvas.
- **Objetos bloqueados**: ao selecionar um objeto que outro usuário está editando, a seleção pode ser liberada automaticamente após um tempo (TTL).

Para uma experiência estável, mantenha uma conexão de internet estável e o navegador atualizado.

---

## 11. Dicas rápidas

1. Use **Espaço + arrastar** para mover a vista sem mexer nos objetos.
2. Use **Seleção** e **Delete** para remover objetos com rapidez.
3. Crie zonas com **Modo zona** e depois refine nome e regras no painel Zonas.
4. Use **Templates** para não começar do zero.
5. **Exporte em PNG ou PDF** para compartilhar o quadro fora da aplicação.
6. Em dúvida, use **Ctrl+K** / **Cmd+K** para ver os comandos disponíveis.

---

## Suporte

Em caso de dúvidas ou problemas, consulte a documentação técnica no repositório (README, arquitetura) ou entre em contato com a equipe do projeto.
