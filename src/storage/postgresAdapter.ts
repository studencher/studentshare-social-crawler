import {PostgresAdapter} from "../studentcher-shared-utils"


const pgClient = new PostgresAdapter({
    host: process.env.POSTGRES_ADDR,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    max: 25,
    min: 4,
    connectionTimeoutMillis: 10000
})

export default pgClient;

