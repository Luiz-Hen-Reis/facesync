namespace FaceSync.Application.Helpers;

public static class EmbeddingHelper
{
    public static float CosineSimilarity(float[] a, float[] b)
    {
        float dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (MathF.Sqrt(normA) * MathF.Sqrt(normB));
    }
}
