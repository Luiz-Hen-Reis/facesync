using FaceSync.Domain.Repositories.UserFace;
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

    public async Task<List<Domain.Entities.UserFace>> ListAll()
    {
        return await _dbContext.UserFaces.AsNoTracking().ToListAsync();
    }
}
