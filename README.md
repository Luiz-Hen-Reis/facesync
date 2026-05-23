# FaceSync

Sistema de reconhecimento facial em tempo real com detecção e registro de rostos via câmera, utilizando WebSocket para comunicação bidirecional entre frontend e backend.

---

## Demonstração

```text
Abriu o app → Escolhe Registrar ou Reconhecer
     │
     ├── Registrar → Informa nome → Câmera detecta rosto → Registra automaticamente
     │
     └── Reconhecer → Câmera identifica rostos em tempo real → Exibe nome e similaridade
```

---

## Stack

### Backend

| Tecnologia            | Uso                                                  |
| --------------------- | ---------------------------------------------------- |
| ASP.NET Core 10       | API e SignalR Hub                                    |
| SignalR               | Comunicação em tempo real (WebSocket)                |
| OpenCvSharp           | Detecção de rostos via Haar Cascade                  |
| ONNX Runtime          | Geração de embeddings com modelo ArcFace (w600k_r50) |
| Entity Framework Core | ORM                                                  |
| pgvector              | Busca por similaridade vetorial no PostgreSQL        |
| FluentMigrator        | Migrations do banco de dados                         |
| PostgreSQL 16         | Banco de dados                                       |
| Docker                | Containerização                                      |

### Frontend

| Tecnologia              | Uso                             |
| ----------------------- | ------------------------------- |
| Next.js 14 (App Router) | Framework React                 |
| TypeScript              | Tipagem estática                |
| Tailwind CSS            | Estilização                     |
| SignalR Client          | Comunicação com o hub           |
| Canvas API              | Renderização dos bounding boxes |

---

## Arquitetura

O projeto segue uma arquitetura em camadas inspirada em Clean Architecture:

```text
FaceSync.Api             → Controllers, Hubs, Filters
FaceSync.Application     → Use Cases, Helpers, Constants
FaceSync.Domain          → Entities, Interfaces de Repositório
FaceSync.Communication   → Requests e Responses (DTOs)
FaceSync.Infra           → Repositórios, Serviços, Migrations
FaceSync.Exceptions      → Exceções customizadas
```

### Fluxo de reconhecimento

```text
Frontend (câmera)
    │  frame (base64 JPEG)
    ▼
SignalR Hub → DetectFaceUseCase
    │  OpenCV detecta rosto(s) na imagem
    │  ONNX Runtime gera embedding (vetor de 512 floats)
    │  pgvector busca por similaridade coseno no banco
    ▼
RecognitionResult → Frontend
    │  bounding box + nome + similaridade por rosto
    ▼
Canvas API desenha os retângulos em cima do vídeo
```

### Fluxo de registro

```text
Frontend detecta rosto via SendFrame
    │  rosto encontrado → aguarda 1.5s para estabilizar
    ▼
RegisterFace → RegisterFaceUseCase
    │  detecta e valida (1 rosto, sem duplicatas)
    │  gera embedding com ArcFace
    │  verifica similaridade coseno com registros existentes
    │  threshold: 0.45 (rejeita se >= 45% similar a alguém cadastrado)
    ▼
Salva no PostgreSQL com coluna vector(512)
```

---

## Pré-requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/)

---

## Instalação e execução

### Execução com Docker Compose (recomendado)

```bash
docker compose up --build
```

O ambiente será iniciado com:

- PostgreSQL 16 + pgvector
- Backend ASP.NET Core
- Frontend Next.js

Após iniciar:

- Frontend → `http://localhost:3000`
- Backend → `https://localhost:7026`

> [!NOTE]
> Este projeto não utiliza arquivos `.env` para armazenar portas, URLs de conexão ou configurações locais, com o objetivo de simplificar a execução e reduzir etapas de configuração, já que se trata de um projeto pessoal/prático.
>
> Caso exista conflito de portas ou necessidade de adaptação para outro ambiente, ajuste manualmente os valores conforme necessário nos arquivos de configuração do backend, frontend ou `docker-compose.yml`.

---

### Execução manual

#### 1. Clone o repositório

```bash
git clone https://github.com/Luiz-Hen-Reis/facesync.git
cd facesync
```

#### 2. Configure o PostgreSQL

O projeto utiliza PostgreSQL 16 com a extensão `pgvector` para busca vetorial por similaridade.

Caso utilize um PostgreSQL próprio/local, será necessário instalar e habilitar manualmente a extensão:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3. Configure o backend

O arquivo `appsettings.Development.json` não é versionado no repositório por conter configurações locais do ambiente.

Crie o arquivo:

```text
src/Backend/FaceSync.Api/appsettings.Development.json
```

Utilizando a seguinte estrutura:

```json
{
  "ConnectionStrings": {
    "PostgresConnection": "Host=localhost;Port=5432;Database=facesync_dev;Username=facesync;Password=facesync123"
  }
}
```

#### 4. Execute o backend

```bash
cd src/Backend/FaceSync.Api
dotnet run
```

#### 5. Execute o frontend

```bash
cd src/Frontend/facesync-next
npm install
npm run dev
```

---

## Variáveis de ambiente

| Variável                                | Descrição                       | Padrão |
| --------------------------------------- | ------------------------------- | ------ |
| `ConnectionStrings__PostgresConnection` | Connection string do PostgreSQL | —      |

---

## Modelo ONNX

O modelo `w600k_r50.onnx` não é versionado no repositório devido ao limite de tamanho de arquivos do GitHub.

Baixe o modelo manualmente no repositório oficial do InsightFace:

- https://github.com/deepinsight/insightface

E coloque o arquivo em:

```text
src/Backend/FaceSync.Api/Models/w600k_r50.onnx
```

---

## Detalhes técnicos

### Similaridade coseno e threshold

Cada rosto registrado gera um vetor de 512 números (embedding). O sistema compara novos rostos com os cadastrados usando similaridade coseno — quanto mais próximo de 1, mais parecidos os rostos.

O threshold padrão é `0.45`:

- `>= 0.45` → mesmo rosto (bloqueia cadastro duplicado / reconhece como pessoa cadastrada)
- `< 0.45` → rosto diferente (permite cadastro / marca como desconhecido)

O valor pode ser ajustado em:

```csharp
// FaceSync.Application/Constants/FaceRecognitionConstants.cs
public const float SimilarityThreshold = 0.45f;
```

### Busca vetorial com pgvector

Em vez de trazer todos os registros para a memória e filtrar em C#, a busca de similaridade é feita diretamente no banco:

```sql
SELECT *, 1 - ("Embeddings" <=> query_vector) AS similarity
FROM "UserFaces"
WHERE ("Embeddings" <=> query_vector) <= threshold
ORDER BY "Embeddings" <=> query_vector
LIMIT 1;
```

### Tratamento de erros no Hub

Todas as exceções de domínio herdam de `AppException` e são capturadas pelo `HubExceptionFilter`, que envia a mensagem de erro ao cliente via evento `"Error"` sem derrubar a conexão.

---

## Estrutura de pastas

```text
facesync/
├── src/
│   ├── Backend/
│   │   ├── FaceSync.Api/
│   │   │   ├── Hubs/           → FaceHub (SignalR)
│   │   │   ├── Filters/        → HubExceptionFilter
│   │   │   ├── Models/
│   │   │   └── CascadeClassifiers/
│   │   ├── FaceSync.Application/
│   │   │   ├── UseCases/       → RegisterFace, DetectFace
│   │   │   ├── Constants/      → FaceRecognitionConstants
│   │   │   └── Helpers/        → ImageHelper, EmbeddingHelper
│   │   ├── FaceSync.Domain/
│   │   │   ├── Entities/       → UserFace
│   │   │   └── Repositories/   → Interfaces
│   │   ├── FaceSync.Infra/
│   │   │   ├── DataAccess/     → AppDbContext, Repositórios, Mappings
│   │   │   ├── Migrations/     → FluentMigrator versions
│   │   │   └── Services/       → FaceDetection, FaceRecognition
│   │   ├── FaceSync.Communication/
│   │   │   ├── Requests/
│   │   │   └── Responses/
│   │   └── FaceSync.Exceptions/
│   └── Frontend/
│       └── facesync-next/
│           ├── app/
│           ├── types/
│           ├── hooks/
│           └── components/
└── docker-compose.yml
```

---

## Créditos

- ArcFace w600k_r50:
  https://github.com/deepinsight/insightface

- Haar Cascade Classifier:
  https://github.com/opencv/opencv

- pgvector:
  https://github.com/pgvector/pgvector

---

## Licença

MIT
