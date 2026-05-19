namespace FaceSync.Communication.Responses;

public class ResponseDetectFace
{
    public bool Recognized { get; set; }

    public string? Name { get; set; }

    public double Similarity { get; set; }

    public BoundingBox Box { get; set; } = new BoundingBox();
}

public class BoundingBox
{
    public int X { get; set; }
    public int Y { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
}