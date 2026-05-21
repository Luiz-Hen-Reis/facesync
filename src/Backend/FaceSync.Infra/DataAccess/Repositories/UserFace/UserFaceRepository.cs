using FaceSync.Domain.Repositories.UserFace;

namespace FaceSync.Infra.DataAccess.Repositories.UserFace;

public class UserFaceRepository : IUserFaceWriteOnlyRepository
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
}
