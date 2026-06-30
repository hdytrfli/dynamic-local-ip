export class Store<T> {
  private state: T;

  constructor(initial: T) {
    this.state = { ...initial };
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.state[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.state[key] = value;
  }

  update(partial: Partial<T>): void {
    Object.assign(this.state as object, partial);
  }

  snapshot(): T {
    return { ...this.state };
  }
}
