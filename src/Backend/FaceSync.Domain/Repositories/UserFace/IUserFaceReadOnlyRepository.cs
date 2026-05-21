namespace FaceSync.Domain.Repositories.UserFace;

public interface IUserFaceReadOnlyRepository
{
    Task<List<Entities.UserFace>> ListAll();
}
