namespace FaceSync.Exceptions.ExceptionBase;

public class FaceNotDetectedException : AppException
{
    public FaceNotDetectedException() : base(ResourceErrorMessages.FACE_NOT_DETECTED) { }

    public override List<string> GetErrors() => [Message];
}
