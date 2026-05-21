namespace FaceSync.Application.Helpers;

public static class ImageHelper
{
    public static byte[] ConvertBase64ToBytes(string frame)
    {
        var base64 = frame.Split(',')[1];

        return Convert.FromBase64String(base64);
    }
}
