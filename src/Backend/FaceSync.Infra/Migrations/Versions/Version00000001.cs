using FluentMigrator;

namespace FaceSync.Infra.Migrations.Versions;

[Migration(1, "Create UserFaces table")]
public class Version00000001 : ForwardOnlyMigration
{
    public override void Up()
    {
        Create.Table("UserFaces")
            .WithColumn("Id").AsGuid().PrimaryKey().NotNullable()
            .WithColumn("Name").AsString(200).NotNullable()
            .WithColumn("Embeddings").AsCustom("real[]").NotNullable();
    }
}
