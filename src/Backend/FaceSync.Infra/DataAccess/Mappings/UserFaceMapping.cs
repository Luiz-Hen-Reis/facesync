using FaceSync.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pgvector;

namespace FaceSync.Infra.DataAccess.Mappings;

internal class UserFaceMapping : IEntityTypeConfiguration<UserFace>
{
    public void Configure(EntityTypeBuilder<UserFace> builder)
    {
        builder.ToTable("UserFaces");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(u => u.Embeddings)
            .HasColumnType("vector(512)")
            .IsRequired()
            .HasConversion(
                v => new Vector(v),
                v => v.ToArray()
            );
    }
}
