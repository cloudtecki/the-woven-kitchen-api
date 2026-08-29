export interface Command<T = void, TResult = void> {
  execute(data: T): Promise<TResult>;
}

export interface Query<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
