namespace Yoma.Core.Domain.Core.Helpers
{
  public sealed class CSVTrailingCommaTrimmingTextReader : TextReader
  {
    #region Class Variables
    private readonly TextReader _inner;
    private string? _currentLine;
    private int _position;
    #endregion

    #region Constructor
    public CSVTrailingCommaTrimmingTextReader(TextReader inner)
    {
      _inner = inner ?? throw new ArgumentNullException(nameof(inner));
    }
    #endregion

    #region Public Members
    // CsvHelper reads through this method
    public override int Read(char[] buffer, int index, int count)
    {
      ArgumentNullException.ThrowIfNull(buffer);

      // Load next line if needed
      if (_currentLine == null || _position >= _currentLine.Length)
      {
        var line = _inner.ReadLine();
        if (line == null)
          return 0; // EOF

        // Trim trailing whitespace + trailing commas
        line = line.TrimEnd().TrimEnd(',');

        // Re-add newline so CsvHelper sees normal CSV rows
        _currentLine = line + System.Environment.NewLine;
        _position = 0;
      }

      var remaining = _currentLine.Length - _position;
      var toCopy = Math.Min(count, remaining);

      _currentLine.CopyTo(_position, buffer, index, toCopy);
      _position += toCopy;

      return toCopy;
    }

    public override int Read()
    {
      char[] one = new char[1];
      return Read(one, 0, 1) == 0 ? -1 : one[0];
    }

    public override Task<int> ReadAsync(char[] buffer, int index, int count)
      => Task.FromResult(Read(buffer, index, count));
    #endregion

    #region Protected Members
    protected override void Dispose(bool disposing)
    {
      if (disposing) _inner.Dispose();
      base.Dispose(disposing);
    }
    #endregion
  }
}
