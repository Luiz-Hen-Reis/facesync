namespace FaceSync.Domain.Repositories.UserFace;

public interface IUserFaceWriteOnlyRepository
{
    Task Add(Entities.UserFace userFace);
}
