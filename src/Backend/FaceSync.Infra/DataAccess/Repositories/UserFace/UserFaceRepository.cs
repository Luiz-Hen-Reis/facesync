using FaceSync.Domain.Repositories.UserFace;
using Pgvector;
using Pgvector.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FaceSync.Infra.DataAccess.Repositories.UserFace;

public class UserFaceRepository : IUserFaceWriteOnlyRepository, IUserFaceReadOnlyRepository
{
    private readonly AppDbContext _dbContext;

    public UserFaceRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task Add(Domain.Entities.UserFace userFace)
    {
        await _dbContext.AddAsync(userFace);
    }

    public async Task<Domain.Entities.UserFace?> FindSimilar(float[] embeddings, float similarityThreshold)
    {
        var vector = new Vector(embeddings);

        return await _dbContext.UserFaces
            .Where(u => u.Embeddings.CosineDistance(vector) <= (1 - similarityThreshold))
            .OrderBy(u => u.Embeddings.CosineDistance(vector))
            .FirstOrDefaultAsync();
    }

}
