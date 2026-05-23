namespace FaceSync.Domain.Repositories.UserFace;

public interface IUserFaceReadOnlyRepository
{
    Task<Entities.UserFace?> FindSimilar(float[] embeddings, float similarityThreshold);
}
