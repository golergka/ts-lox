import { LoxClass } from "./loxClass";

export class LoxInstance {
    public constructor(private readonly klass: LoxClass) {}
    
    public toString(): string {
        return `instance of ${this.klass.name}`;
    }
}