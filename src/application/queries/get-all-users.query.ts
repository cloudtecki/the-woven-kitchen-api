export class GetAllUsersQuery {
  constructor(
    public readonly page = 1,
    public readonly limit = 20
  ) {}
}
