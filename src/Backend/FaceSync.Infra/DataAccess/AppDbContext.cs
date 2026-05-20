using FaceSync.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FaceSync.Infra.DataAccess;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions options) : base(options) { }

    public DbSet<UserFace> UserFaces { get; set; }
}
