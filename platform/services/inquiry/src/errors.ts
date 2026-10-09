export class InvalidRequest extends Error {
  readonly code = "INQUIRY_INVALID";

  constructor() {
    super("INQUIRY_INVALID");
    this.name = "InvalidRequest";
  }
}

export class UniqueConflict extends Error {
  constructor() {
    super("unique conflict");
    this.name = "UniqueConflict";
  }
}
