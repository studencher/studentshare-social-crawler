type UserListType = {
    id: string,
    status: string,
    lastSeenAt: number,
    roleName: string
}

export type DiscordChannelDataType = {
    id: string,
    name: string,
    isClass: boolean,
    loggedUsers: UserListType[]
}
