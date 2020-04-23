type TJWTUser = {
  userId: string
}

type TMapper = {
  [key: string]: any
}

type TErrResponse = {
  message: string
}

type TResponse<T> = TErrResponse | T
