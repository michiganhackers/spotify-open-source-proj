import postgres from 'postgres';
import 'dotenv/config'

const sql = postgres(process.env.POSTGRES_URI!) // will use psql environment variables

export default sql