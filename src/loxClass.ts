export class LoxClass {
	public constructor(public readonly name: string) {}

	public toString(): string {
		return this.name
	}
}
