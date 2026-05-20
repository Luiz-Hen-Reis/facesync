namespace FaceSync.Domain.Entities;

public class UserFace
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public float[] Embeddings { get; set; } = [];
}
