using FluentMigrator;

namespace FaceSync.Infra.Migrations.Versions;

[Migration(2, "Add vector extension and change Embeddings column to vector(512)")]
public class Version00000002 : ForwardOnlyMigration
{
    public override void Up()
    {
        Execute.Sql("CREATE EXTENSION IF NOT EXISTS vector");

        Execute.Sql(@"ALTER TABLE ""UserFaces"" 
                      ALTER COLUMN ""Embeddings"" 
                      TYPE vector(512) 
                      USING ""Embeddings""::vector(512)");

        Execute.Sql(@"CREATE INDEX ON ""UserFaces"" 
                      USING ivfflat (""Embeddings"" vector_cosine_ops)");
    }
}
