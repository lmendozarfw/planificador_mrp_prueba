export interface ILoginRequest {
    username: string;
    password: string;
}

export interface ILoginResponse {
    token: string;
}

export interface IPermissionAuth {
    id: string;
    code: string;
}

export interface IUserAuth {
    id: string;
    fullName: string;
}

export interface IMeResponse {
    id: string;
    user: IUserAuth;
    permissions: IPermissionAuth[];
}