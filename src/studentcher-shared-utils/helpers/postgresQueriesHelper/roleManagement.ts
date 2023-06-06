// module.exports.getUpsertRoleQuery = ()=>{
//     return `insert into roles ($1, $2) VALUES (id, name)
//             ON CONFLICT (id)
//                 DO UPDATE SET
//                    name           = COALESCE( $2 , roles.name)
//             WHERE roles.id = $1
//             RETURNING id, name, user_management_enabled as "userManagementEnabled",
//             activity_management_enabled as "activityManagementEnabled",
//             plan_management_enabled as "planManagementEnabled",
//             role_management_enabled  as "roleManagementEnabled" `
// }