namespace FaceSync.Communication.Responses;

public class ResponseDetectFace
{
    public List<DetectedFace> Faces { get; set; } = [];
}

public class DetectedFace
{
    public bool Recognized { get; set; }
    public string? Name { get; set; }
    public float Similarity { get; set; }
    public BoundingBox Box { get; set; } = null!;
}

public class BoundingBox
{
    public int X { get; set; }
    public int Y { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
}