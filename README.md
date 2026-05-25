# FaceSync 👤🔄

Sistema de reconhecimento facial em tempo real com detecção e registro de rostos via câmera. O projeto utiliza WebSocket para garantir comunicação bidirecional de baixa latência entre o frontend e o backend.

## 🚀 Demonstração de Uso

O fluxo principal da aplicação é simples e direto:

```text
Acesso ao App → Escolha da Ação (Registrar ou Reconhecer)
     │
     ├── Registrar: Informa o nome → Câmera detecta rosto → Registro automático
     │
     └── Reconhecer: Câmera identifica rostos em tempo real → Exibe nome e similaridade

```

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnologia | Finalidade |
| --- | --- |
| **ASP.NET Core 10** | API REST e SignalR Hub |
| **SignalR** | Comunicação em tempo real (WebSocket) |
| **OpenCvSharp** | Detecção de rostos via Haar Cascade |
| **ONNX Runtime** | Geração de embeddings com modelo ArcFace (w600k_r50) |
| **EF Core** | Mapeamento Objeto-Relacional (ORM) |
| **pgvector** | Busca por similaridade vetorial nativa no banco |
| **FluentMigrator** | Gerenciamento de migrations do banco de dados |
| **PostgreSQL 16** | Banco de dados principal |

### Frontend

| Tecnologia | Finalidade |
| --- | --- |
| **Next.js 14** | Framework React (App Router) |
| **TypeScript** | Tipagem estática e segurança de código |
| **Tailwind CSS** | Estilização utilitária |
| **SignalR Client** | Comunicação com o hub do backend |
| **Canvas API** | Renderização dos bounding boxes no vídeo |

---

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas inspirada na **Clean Architecture**, visando separação de responsabilidades e manutenibilidade:

```text
FaceSync.Api           → Controllers, Hubs, Filters
FaceSync.Application   → Use Cases, Helpers, Constants
FaceSync.Domain        → Entities, Interfaces de Repositório
FaceSync.Communication → Requests e Responses (DTOs)
FaceSync.Infra         → Repositórios, Serviços, Migrations
FaceSync.Exceptions    → Exceções customizadas

```

### Fluxo de Reconhecimento

```text
Frontend (Frame em base64 JPEG)
    ▼
SignalR Hub → DetectFaceUseCase
    │ (1) OpenCV detecta rosto(s) na imagem
    │ (2) ONNX Runtime gera embedding (vetor de 512 floats)
    │ (3) pgvector busca por similaridade coseno no banco
    ▼
RecognitionResult (Bounding box + nome + similaridade)
    ▼
Frontend (Canvas API desenha os retângulos sobre o vídeo)

```

### Fluxo de Registro

```text
Frontend detecta rosto via SendFrame
    ▼
Aguarda 1.5s para estabilização
    ▼
RegisterFaceUseCase
    │ (1) Detecta e valida (exige 1 rosto, bloqueia duplicatas)
    │ (2) Gera embedding com ArcFace
    │ (3) Verifica similaridade coseno com registros existentes
    │ (4) Rejeita se a similaridade for >= 45% com alguém já cadastrado
    ▼
Salva no PostgreSQL na coluna vector(512)

```

---

## ⚙️ Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em seu ambiente:

* [.NET 10 SDK](https://dotnet.microsoft.com/download)
* [Node.js 18+](https://nodejs.org/)
* [Docker](https://www.docker.com/) (para subir a instância do PostgreSQL via Docker Compose)

---

## 🚀 Instalação e Execução

**1. Clone o repositório**

```bash
git clone https://github.com/Luiz-Hen-Reis/facesync.git
cd facesync

```

**2. Suba o Banco de Dados**
O projeto utiliza o `docker-compose.yml` exclusivamente para disponibilizar o PostgreSQL 16 com a extensão `pgvector`.

```bash
docker compose up -d postgres

```

> **Nota:** Caso utilize um PostgreSQL local fora do Docker, execute `CREATE EXTENSION IF NOT EXISTS vector;` no seu banco.

**3. Configure o Backend**
Crie o arquivo de configurações locais (`appsettings.Development.json`) no diretório `src/Backend/FaceSync.Api/` com o seguinte conteúdo:

```json
{
  "ConnectionStrings": {
    "PostgresConnection": "Host=localhost;Port=5432;Database=facesync_dev;Username=facesync;Password=facesync123"
  }
}

```

**4. Adicione o Modelo ONNX**
Devido aos limites de tamanho do GitHub, o modelo `w600k_r50.onnx` não é versionado.

* Baixe o modelo no repositório oficial do [InsightFace](https://github.com/deepinsight/insightface).
* Salve o arquivo no diretório: `src/Backend/FaceSync.Api/Models/w600k_r50.onnx`

**5. Execute a API (Backend)**

```bash
cd src/Backend/FaceSync.Api
dotnet run

```

**6. Execute a Aplicação Web (Frontend)**
Em um novo terminal:

```bash
cd src/Frontend/facesync-next
npm install
npm run dev

```

---

## 🧠 Detalhes Técnicos

### Similaridade Coseno e Threshold

Cada rosto registrado gera um vetor de 512 números (embedding). O sistema compara novos rostos com os já cadastrados utilizando a **similaridade coseno** (quanto mais próximo de 1, mais parecidos).

O threshold padrão é **0.45**:

* **Valor >= 0.45:** Mesmo rosto (reconhece o usuário ou bloqueia cadastro duplicado).
* **Valor < 0.45:** Rosto diferente (marca como desconhecido ou permite novo cadastro).

Ajuste essa constante no backend caso necessário:

```csharp
// FaceSync.Application/Constants/FaceRecognitionConstants.cs
public const float SimilarityThreshold = 0.45f;

```

### Busca Vetorial Direto no Banco (pgvector)

Para garantir performance, a busca de similaridade não carrega os registros na memória do C#. Ela é executada nativamente no banco de dados através da extensão `pgvector`:

```sql
SELECT *, 1 - ("Embeddings" <=> query_vector) AS similarity
FROM "UserFaces"
WHERE ("Embeddings" <=> query_vector) <= threshold
ORDER BY "Embeddings" <=> query_vector
LIMIT 1;

```

### Tratamento de Erros no SignalR

Todas as exceções de domínio herdam da classe base `AppException`. Elas são capturadas pelo `HubExceptionFilter`, que intercepta a falha e envia a mensagem de erro ao cliente pelo evento `"Error"`, mantendo a conexão WebSocket ativa e estável.

---

## 📂 Estrutura de Pastas

```text
facesync/
├── src/
│   ├── Backend/
│   │   ├── FaceSync.Api/          (Hubs, Filters, Models, Classifiers)
│   │   ├── FaceSync.Application/  (Use Cases, Constants, Helpers)
│   │   ├── FaceSync.Domain/       (Entities, Repository Interfaces)
│   │   ├── FaceSync.Infra/        (DbContext, Repositories, Migrations, Services)
│   │   ├── FaceSync.Communication/(DTOs: Requests, Responses)
│   │   └── FaceSync.Exceptions/   (Exceções customizadas)
│   └── Frontend/
│       └── facesync-next/         (App Router, Types, Hooks, Components)
└── docker-compose.yml

```

---

## 📜 Créditos

* **ArcFace w600k_r50:** [deepinsight/insightface](https://github.com/deepinsight/insightface)
* **Haar Cascade Classifier:** [opencv/opencv](https://github.com/opencv/opencv)
* **pgvector:** [pgvector/pgvector](https://github.com/pgvector/pgvector)

---

## 📄 Licença

Distribuído sob a licença **MIT**.
