export const entries = <Key extends string, Value>(
    record: Record<Key, Value>
): ReadonlyArray<[Key, Value]> =>
    Object.entries(record).map(
        ([key, value]) => [key as Key, value] as [Key, Value]
    );
