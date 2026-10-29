// Every endpoint answers with this envelope: `ok(data)` or `fail(message)` on the API side.
export type ApiSuccess<T> = { status: 'OK'; data: T };
export type ApiFailure = { status: 'ERROR'; message: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
