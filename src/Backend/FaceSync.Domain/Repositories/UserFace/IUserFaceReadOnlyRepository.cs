namespace FaceSync.Domain.Repositories.UserFace;

public interface IUserFaceReadOnlyRepository
{
    Task<(Entities.UserFace UserFace, float Similarity)?> FindSimilar(float[] embeddings, float similarityThreshold);
}
