const stableHoverMembers = new WeakSet<Element>();

export const registerStableHoverMember = (element: Element): void => {
    stableHoverMembers.add(element);
};

export const unregisterStableHoverMember = (element: Element): void => {
    stableHoverMembers.delete(element);
};

export const isStableHoverGroupMember = (element: Element | null): boolean => {
    let current: Element | null = element;
    while (current) {
        if (stableHoverMembers.has(current)) {
            return true;
        }
        current = current.parentElement;
    }
    return false;
};
