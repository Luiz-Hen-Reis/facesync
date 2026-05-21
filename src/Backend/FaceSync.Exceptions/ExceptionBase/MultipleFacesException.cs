namespace FaceSync.Exceptions.ExceptionBase;

public class MultipleFacesException : AppException
{
    public MultipleFacesException() : base(ResourceErrorMessages.MULTIPLE_FACES) { }

    public override List<string> GetErrors() => [Message];
}
