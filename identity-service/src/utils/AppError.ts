class AppError extends Error {
  public errorCode: string;
  constructor(
    public statusCode: number,
    public message: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = "AppError";
  }
}

export default AppError;
