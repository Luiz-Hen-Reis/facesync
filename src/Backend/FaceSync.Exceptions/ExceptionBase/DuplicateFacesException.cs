namespace FaceSync.Exceptions.ExceptionBase;

public class DuplicateFacesException : AppException
{
    public DuplicateFacesException() : base(ResourceErrorMessages.DUPLICATE_FACES) { }

    public override List<string> GetErrors() => [Message];
}
