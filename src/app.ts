// import { env } from "./config/env"
import express, {Express, Request, Response} from "express"
export const app: Express = express()

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.listen(3000, () => {
    console.log(`Example function listening`)
})