export interface LoaderHandle {
    entries(): Iterable<{
        id: string;
        options: {
            id?: string;
            name?: string;
            disabled?: boolean | null;
        };
        update(options: {
            disabled: boolean | null;
        }, create?: boolean, force?: boolean): Promise<void>;
    }>;
    create(options: {
        id?: string;
        name: string;
    }): Promise<string>;
    resolve(id: string): {
        fiber?: unknown;
        options?: {
            disabled?: boolean | null;
        };
    };
}
export declare function mountPackage(loader: LoaderHandle | undefined, packageName: string): Promise<boolean>;
export declare function disablePackage(loader: LoaderHandle | undefined, packageName: string): Promise<boolean>;
